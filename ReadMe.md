WebCryptoJS.js
==============

This is a set of libraries allowing [`WebCrypto`](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) **interoperate** with [`CryptoJS`](https://github.com/brix/crypto-js), a popular cryptography library implemented purely in ECMAScript.

Goals and non-goals
--------------------

* **It is NOT targeted to be secure. For security just use some lib based on `WebCrypto` and NEVER use ciphers implemented in pure JS. Properly mitigating side-channels requires low-level control, not available for high-level virtual machines like JS.**
* It is the lib allowing you to **interoperate** *without too much pain*. All the data created by `CryptoJS` should be correctly processed with the correct code written upon this lib, and v. v.
* Environments not having WebCrypto and native [typed arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays) are explicitly out of scope. We assume `little-endian` hardware endianness. Big-endian systems are explicitly out of scope.
* It is not a drop-in replacement: you should use `WebCrypto` as the standardized API. The goal of the API provided by this lib is to make it easier to rewrite the code from `CryptoJS` to `WebCrypto` keeping the behavior exactly the same, but using a bit different implementations.
* We try hard to keep it **as minimal and small as possible**. If we can reuse some other **small** impl that doesn't require us to carry much dependencies, and then remove some code from this lib, we do it.
    * I. e. for `MD5` we suggest to rely on WTFPL-licensed [`SparkMD5`](https://github.com/satazor/js-spark-md5), and not full it, but just `md51_array` and all the funcs it depends on. In this repo we have a [separate branch](https://github.com/KOLANICH/WebCryptoJS.js/tree/SparkMD5) only the needed funcs and some modifications.
    * For primitives already in browsers, like [`WebCrypto`](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API), [`TextEncoder`](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder), [`TextDecoder`](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder), [`atob`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/atob), [`btoa`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/btoa) we rely on them.
* In order to keep it small we try to have as much as possible composable.
* It is targeted to be bug-bug **compatible** to `CryptoJS`.
* We try to keep as much as possible under a **public-domain-like license**. For public domain code anyone doesn't have to carry text of the license.
* **We don't implement everything ahead of time.** We only implement the things that are actually needed. And we expect the ones who needs them to implement them.


Main points
-----------

* `CryptoJS` uses own serialization schemes for Base64. We cannot use `atob` present in browsers to decode `Base64`, and for text special chars are encoded into HTML entities.
* `WebCrypto` has some legacy cryptoprimitives, that are insecure, missing, that are still present and used in CryptoJS, like `MD5`. From the point of discouraging their use it is good, but from the point of interoperability with legacy insecure shit that one has to interoperate and that is NOT used for security (i.e. there are some assholes who use encryption for obfuscation), it is not good.

The library contains of 2 parts:

* The code not derived from `CryptoJS` licensed under `Unlicense` license. It provides some basic blocks.
* The code derived from `CryptoJS` licensed under `MIT` license.
