# Generator

* Generator is a tool, which will generate the duktape-webgl C code file(s)

## Generating duktape-webgl header

* As an end user, you should just download latest pre-generated header file. Generator is meant for development.
* If you want to generate content then by all means. This is done using Docker:

```
docker build -t duktape-webgl-generator . && docker run -t --read-only duktape-webgl-generator > dukwebgl.h
```

