# Examples

* Contains some examples how to use duktape-webgl
* Unless stated otherwise all example code in the repository is licensed as [Public Domain, CC0](https://creativecommons.org/publicdomain/zero/1.0/)

## Tutorials

This is not meant to be a tutorial. Examples are meant to clarify the usage of duktape-webgl and also how to utilize it in cross-platform manner, i.e. natively and via web browsers. Also examples are used for test automation of the library. So you might see varying uses of WebGL methods and constants.

Luckily there are plenty of good tutorials, so if you're interested in learning JavaScript, WebGL or modern OpenGL, take a look at these resources:
* [JavaScript Guide](https://developer.mozilla.org/bm/docs/Web/JavaScript/Guide)
* [WebGL tutorial](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial)
* [The Book of Shaders](https://thebookofshaders.com/)
* [Learn OpenGL ES](http://www.learnopengles.com/)

## Docker build and run examples

* Note that dukwebgl.h header file is not available by default so you need to place the header to 00\_bootstrap directory

```
docker build -t duktape-webgl-examples . && docker run --rm -t duktape-webgl-examples
```
