[![Build Status](https://travis-ci.com/mrautio/duktape-webgl.png)](https://travis-ci.com/mrautio/duktape-webgl)

# duktape-webgl
[WebGL](https://www.khronos.org/webgl/) 2.0 bindings for [Duktape embeddable Javascript engine](http://duktape.org)

* duktape-webgl implements fairly many WebGL 1.0 and 2.0 methods and constants.
  * \*_WEBGL constants and methods not available in core OpenGL are missing.
  * duktape-webgl runs desktop [OpenGL Core Profile](https://www.khronos.org/opengl/) beneath, not [OpenGL ES](https://www.khronos.org/opengles/) to which WebGL is based.
* If you're looking for [OpenGL 1.x](https://www.khronos.org/registry/OpenGL/specs/gl/glspec13.pdf) legacy bindings, check [duktape-opengl project](https://github.com/mrautio/duktape-opengl).

## License

[Zlib](https://github.com/mrautio/duktape-webgl/blob/master/LICENSE)

## Setup

* Include dukwebgl.h to your Duktape & OpenGL project.

### C initialization example

```C
/* Applicable OpenGL header needs to be included before dukwebgl */
#include <GL/glcorearb.h>

/* Duktape needs to be included before dukwebgl */
#include "duktape.h"

/* DUKWEBGL_IMPLEMENTATION needs to be defined in *one* source file to create the implementation. */
#define DUKWEBGL_IMPLEMENTATION 
#include "dukwebgl.h"

...
    /* duktape-webgl bindings will be added to the global object */
    dukwebgl_bind(ctx);
...
```

### JS initialization example
```js
var gl = new WebGL2RenderingContext();
// now you should be able to call WebGL methods as you wish
```

## API general design

* JS API should resemble to WebGL specifications as much as possible
  * Contradicting / differing OpenGL call logic should be in favor of WebGL specifications
* C API should be minimal, yet allowing some flexibility for power-users
* Comply to intersection of OpenGL core C API headers and WebGL 1.x - 2.x APIs
  * Only support WebGL constants defined in the C API
  * Users should have possibility to restrict API imports based on OpenGL core version, i.e. via define/undef 
* Performance over validity
  * Does not validate input
    * Duktape context is assumed to be valid
    * Variables passed from JS are assumed to be valid for intended OpenGL API calls
  * Will attempt to pass calls to underlying OpenGL C API functions with low overhead.

