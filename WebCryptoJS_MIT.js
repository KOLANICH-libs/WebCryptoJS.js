"use strict";

// SPDX-License-Identifier: MIT

/*!
Preprocesses the string the way `CryptoJS` does it.
@param s The source string.
@returns The preprocessed string.
*/
function cjsPreprocessText(s) {
	return unescape(encodeURIComponent(s))
}

/*!
Replacement for `CryptoJS.enc.<text encoding>.parse` for use with `CryptoJS`.
@param s The source string.
@param encoder `TextEncoder`.
@returns The `WordsArray` of `CryptoJS`.
*/
function cjsTextParseWA(encoder, s) {
	return cjsTextOnlyParseWA(encoder, cjsPreprocessText(s))
}

/*!
Replacement for `CryptoJS.enc.<text encoding>.parse` for use with `WebCrypto`.
@param s The source string.
@param encoder `TextEncoder`.
@returns The `UInt8Array` for use with `WebCrypto`.
*/
function cjsTextParse(encoder, s) {
	return encoder.encode(cjsPreprocessText(s))
}

/*!
Replacement for `CryptoJS.enc.Hex.parse`
@param hexStr The hex string.
@returns The little-endian `Uint32Array`.
*/
function cjsFromHex(hexStr) {
	let words = [];
	for (let hexStrLength = hexStr.length, i = 0; i < hexStrLength; i += 2)
		words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << 24 - i % 8 * 4;
	return transformEndiannessU32(new Uint32Array(words))
}

function getBase64RevMap() {
	let reverseMap = new Uint8Array(123);
	for (let j = 0; 65 > j; j++)
		reverseMap["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charCodeAt(j)] = j;
	return reverseMap
}
const b64umap = getBase64RevMap();

/*!
Replacement for `CryptoJS.enc.Base64.parse`
@param base64Str The CryptoJS base64 string.
@returns The little-endian `Uint32Array`.
*/
function cjsBase64Decode(base64Str) {
	let base64StrLength = base64Str.length,
	res = base64Str.indexOf("=");
	-1 !== res && (base64StrLength = res);
	res = [];
	for (let i = 0, j = 0; i < base64StrLength; i++)
		i % 4 && (res[j >>> 2] |= (b64umap[base64Str.charCodeAt(i - 1)] << i % 4 * 2 | b64umap[base64Str.charCodeAt(i)] >>> 6 - i % 4 * 2) << 24 - j % 4 * 8, j++);
	return transformEndiannessU32(new Uint32Array(res))
}

/*!
Derives IV and key the same way `PasswordBasedCipher` (used when you pass a string instead of an object as a key to cyphers) does.
@param kdf A function computing KDF. Has the following signature: `(count of bytes to derive, lowEntropySecret, ...params)`
@param keySize An integer for the key size.
@param ivSize An integer for IV size.
@param lowEntropySecret A typed array with the data forming a low-entropy secret.
@param params Other params to pass to KDF.
@returns [iv, key], all as typed arrays.
*/
function cjsDeriveIVAndKeyFromPassword(kdf, keySize, ivSize, lowEntropySecret, ...params) {
	kdf = kdf(keySize + ivSize, lowEntropySecret, ...params);  //reuse: derived
	ivSize = kdf.slice(0, keySize);  // reuse: key
	return [kdf.slice(keySize), ivSize]
};
