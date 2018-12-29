# Duktape-WebGL bootstrapping example

* This bootstrap program can be used to run the Duktape WebGL examples
* You can use the Dockerfile provided in the parent directory or run this manually

## Compile

```
make
```

### Dependencies

* SDL2 - for cross-platform windowing
* Duktape - ECMAScript 5 interpreter
* GLEW - OpenGL function loader
* OpenGL core 3.2 - can be less many times, but you'll have to configure it then

## Run

```
./bootstrap.exe ../01_grey_screen/grey_screen.js
```

## Bootstrap special functionality

### Optional functions that can be defined in input JavaScript files

* function init()
  * Is called before entering draw loop, i.e. initialize shaders and so here
* function draw()
  * Is called per every rendered frame, i.e. should call drawing routines here
* function cleanup()
  * Is called when exiting, i.e. should contain cleanup call, like deleting textures and shaders from GPU memory

### Extensions that can be used in JavaScript

* function bootstrapExit(boolean success)
  * Will force the bootstrap program to exit. Will call cleanup(), if defined
  * true = EXIT\_SUCCESS
  * false = EXIT\_FAILURE
* constant BOOTSTRAP\_WINDOW\_WIDTH
  * Window width
* constant BOOTSTRAP\_WINDOW\_HEIGHT
  * Window height

