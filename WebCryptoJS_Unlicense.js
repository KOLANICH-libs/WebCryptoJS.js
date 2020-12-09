"use strict";

// SPDX-License-Identifier: Unlicense

/*!
Concatenates typed arrays of the same type.
@param arrs Arrays to concat into 1
@returns Array of the content concatted.
*/
function concatTypedArrays(...arrs) {
	let c_sumLen = 0, a_pos;
	for (a_pos of arrs)
		c_sumLen += a_pos.length;
	c_sumLen = new arrs[0].constructor(c_sumLen);
	a_pos = 0;
	for (let a of arrs)
		c_sumLen.set(a, a_pos), a_pos += a.length;
	return c_sumLen
}

/*!
If we have a byte array of length `length`, produces an array of length `Math.ceil(l / chunkLength) * chunkLength`
@param b An `ArrayBuffer` that will be padded.
@param chunkLength An integer specifying the size of the chunk.
@returns `ArrayBuffer` that is padded with zero bytes, if needed.
*/
function padWithZerosToEvenCountOfChunks(b, chunkLength = 4) {
	let bl_res8 = b.byteLength;
	let rem = bl_res8 % chunkLength,
	wholeWordsBytes = bl_res8 - rem;
	rem && (rem = chunkLength - rem);
	chunkLength = new ArrayBuffer(bl_res8 + rem);
	bl_res8 = new Int8Array(chunkLength);  // reuse
	bl_res8.set(b.slice(0, wholeWordsBytes));
	bl_res8.set(b.slice(wholeWordsBytes), wholeWordsBytes);
	return chunkLength
}

/*!
Converts an `ArrayBuffer` into `Uint32Array`, badding it with zeros, if needed.
@param b An `ArrayBuffer` that will be converted to `Uint32Array`.
@returns The resulting `Uint32Array`. The endianness is hardware-specific, the most likely LE.
*/
function toWords(b) {
	return new Uint32Array(padWithZerosToEvenCountOfChunks(b, 4))
}

/*!
Changes an endian of a `Uint32Array` The actual endianness doesn't change (it is impossible), so changes the numbers.
@param b An `Uint32Array` that will be converted to `Uint32Array`.
@returns An `Uint32Array` with its endianness swapped.
*/
function transformEndiannessU32(b) {
	return new Uint32Array(b.map(
			e =>
			(e >> 24 & 255) << 0
			| (e >> 16 & 255) << 8
			| (e >> 8 & 255) << 16
			| (e >> 0 & 255) << 24
		)
	)
}

/*!
A function used for debugging, that converts an array of numbers to an array of hex strings.
@param b An array of supported type (either a just `Array` of numbers, or any typed aray, or CryptoJS `WordArray`) that will be converted to an array of hex strings.
@returns An `Array` with its elements being hex representations (`Number.prototype.toString.call(el, 16)`) of the numbers in arrays.
*/
function toHexArray(a) {
	a.words && (a = WA2U32A(a));
	return [...a].map(e => e.toString(16))
}

/*!
Transforms a `WordsArray` of `CryptoJS` into `Uint32Array` that can be used with `WebCrypto`.
@param a A `WordsArray`. Its `words` are big endian.
@returns An `Uint32Array`, little-endian
*/
function WA2U32A(a) {
	return transformEndiannessU32(new Uint32Array(a.words))
}

/*!
Transforms a `Uint32Array` that can be used with `WebCrypto` into `WordsArray` of `CryptoJS`.
@param a An `Uint32Array`, little-endian.
@returns A `WordsArray`. Its `words` are big endian.
*/
function U32A2WA(a) {
	return WordArray.create(transformEndiannessU32(new Uint32Array(a)))
}

/*!
Encodes a string to bytes and puts it into little-endian `Uint32Array`. Needed to properly pass strings to `CryptoJS` `WordArray` without using its functions for decoding text. Don't use this function, it doesn't do everything needed.
@param encoder A `TextEncoder`.
@param s A string.
@returns An array, first element is a zero-padded `Uint32Array` of words, little-endian, second is length in bytes.
*/
function cjsTextOnlyParseU32ANoEndianTransform(encoder, s) {
	encoder = encoder.encode(s);  // reuse: bytes
	return [toWords(encoder), encoder.length]
}

/*!
Encodes a string to bytes and puts it into big-endian `Uint32Array`. Needed to properly pass strings to `CryptoJS` `WordArray` without using its functions for decoding text.
@param encoder A `TextEncoder`.
@param s A string.
@returns An array, first element is a zero-padded `Uint32Array` of words, big-endian, second is length in bytes.
*/
function cjsTextOnlyParseU32A(encoder, s) {
	let[words, byteLength] = cjsTextOnlyParseU32ANoEndianTransform(encoder, s);
	return [transformEndiannessU32(words), byteLength]
}

/*!
Converts a pair [`Uint32Array`, `count of bytes in it without padding`] to `CryptoJS` `WordArray`
@param words `Uint32Array`, big-endian, zero-padded.
@param byteCount count of bytes in former `Uint8Array`.
@returns `CryptoJS` `WordArray` representing the same content
*/
function U32A_with_U8A_associated_length_to_CJS_WA(words, byteCount) {
	words = WordArray.create(words); // reuse
	words.sigBytes = byteCount;
	return words
}

/*!
Replacement for `CryptoJS.enc.<text encoding>.parse`. Incomplete, lacks preprocessing (`cjsPreprocessText`) from `WebCryptoJS_MIT`.
@param encoder A `TextEncoder`.
@param s The source string.
@returns The `WordsArray` of `CryptoJS`.
*/
function cjsTextOnlyParseWA(encoder, s) {
	return U32A_with_U8A_associated_length_to_CJS_WA(...cjsTextOnlyParseU32A(encoder, s))
}

/*!
Iterates a (hash) function `iters` times.
@param hasher A (hash) function.
@param iters Count of (hash) function iterations
@returns `hasher(hasher(hasher(..iters times..)))`
*/
function functionPowerExplicit(hasher, iters, src) {
	for (let i = 0; i < iters; i++)
		src = hasher(src);
	return src
}

/*!
Computes EVPKDF (the not very good KDF used in OpenSSL). https://www.openssl.org/docs/manmaster/man3/EVP_BytesToKey.html#KEY-DERIVATION-ALGORITHM
@param hasher A hash function.
@param iters Count of hash function iterations.
@param highEntropySecretBytesNeeded The size of high entropy secret neeeded in bytes. Mst be a multiple of 4. Otherwise the behavior is undefined.
@param lowEntropySecret The secret used to derive a high entropy secret from.
@param salt High entropy salt.
@returns `Uint8Array` of length `highEntropySecretBytesNeeded`, containing the derived high-entrop secret;
*/
function EVPKDF(hasher, iters, highEntropySecretBytesNeeded, lowEntropySecret, salt) {
	let derived = new Uint8Array(highEntropySecretBytesNeeded);
	let hashMaterial = concatTypedArrays(new Uint8Array(lowEntropySecret.buffer), new Uint8Array(salt.buffer));
	let block = functionPowerExplicit(hasher, iters, hashMaterial);
	derived.set(block, 0);
	hashMaterial = concatTypedArrays(block, new Uint8Array(hashMaterial.buffer));
	for (let j = block.length; j < highEntropySecretBytesNeeded; )
		block = functionPowerExplicit(hasher, iters, hashMaterial), derived.set(block, j), hashMaterial.set(block, 0), j += block.length;
	return derived
}

/*!
Decorates vanilla SparkMD5 md51_array to return `Uint8Array`s
@param md51_array `md51_array` from vanilla SparkMD5, returning an array of 4 integers.
@returns md51_array returning an `Uint8Array`
*/
function decorateVanillaSparkMD5_md51_array(md51_array) {
	return a => new Uint8Array((new Uint32Array(md51_array(a))).buffer)
};
