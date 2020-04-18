# Conformance tests

* Tool runs a subset of Khronos WebGL [conformance tests](https://github.com/KhronosGroup/WebGL)
* Intention is to get all tests functional

```
docker build -t duktape-webgl-conformance -f Dockerfile . && docker run --rm -t duktape-webgl-conformance
```

