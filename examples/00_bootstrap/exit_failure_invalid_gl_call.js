// init WebGL rendering context
var gl = new WebGL2RenderingContext();

function init() {
	if (!gl instanceof WebGL2RenderingContext) {
	        throw 'WebGL2 not initialized succesfully'
	}
}

function draw() {
	gl.enable(gl.DEPTH_TEST); // expecting OK 
	gl.enable(gl.NONE); // expecting GL_INVALID_ENUM
	gl.enable(gl.DEPTH_TEST); // expecting OK 
}
