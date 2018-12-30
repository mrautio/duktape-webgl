// init WebGL rendering context
var gl = new WebGL2RenderingContext();
if (!gl instanceof WebGL2RenderingContext) {
	throw 'WebGL2 not initialized succesfully'
}

// check that some OpenGL constants exist and are somewhat valid
if (gl.COLOR_BUFFER_BIT === gl.DEPTH_BUFFER_BIT || !gl.COLOR_BUFFER_BIT || !gl.DEPTH_BUFFER_BIT) {
	throw 'WebGL basic constants not found'
}

// call WebGL function
gl.clearColor(0,0,0,0);

bootstrapExit(true);
