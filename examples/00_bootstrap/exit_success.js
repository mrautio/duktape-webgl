// init WebGL rendering context
var gl = new WebGL2RenderingContext();
if (!gl instanceof WebGL2RenderingContext) {
	bootstrapExit(false);
}

// check that some OpenGL constants exist and are somewhat valid
if (gl.TRUE === gl.FALSE) {
	bootstrapExit(false);
}

// call WebGL function
gl.clearColor(0,0,0,0);

bootstrapExit(true);
