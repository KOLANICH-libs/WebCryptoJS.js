SparkMD5 fork [![Unlicensed work](https://raw.githubusercontent.com/unlicense/unlicense.org/master/static/favicon.png)](https://unlicense.org/)
=============

Just a very barebone fork of [SparkMD5](https://github.com/satazor/js-spark-md5). Based on [c3d964c605befba62d608d2c0fe3dfbf06e251fb commit](https://raw.githubusercontent.com/satazor/js-spark-md5/c3d964c605befba62d608d2c0fe3dfbf06e251fb/spark-md5.min.js).

* Everything is stripped, except `md51_array` and its dependencies.
* `md51_array` returns an [`Uint8Array`](https://developer.mozilla.org/en_us/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) instead of 4 32-bit integers in a simple [`Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array).
* In some places used a typed array instead of just an `Array`.
* License is changed from [WTFPL](https://raw.githubusercontent.com/satazor/js-spark-md5/c3d964c605befba62d608d2c0fe3dfbf06e251fb/LICENSE) to [Unlicense](./Unlicense.md) to address legal risks.
* Optimized with [Google Closure Compiler](https://github.com/google/closure-compiler).
