/*
 * This is a minimal example for duktape-webgl example bootstrap program
 * Basically just keeps the window open and shows a grey screen
 */

var gl = undefined;

function init() {
	// here you should initialize everything needed by the draw call
	gl = new WebGL2RenderingContext();
	if (!gl instanceof WebGL2RenderingContext) {
		bootstrapExit(false);
	}

	// gray screen clear color
	gl.clearColor(0.6,0.6,0.6,1);
}

function draw() {
	// here is where all drawing happens
	gl.clear(gl.COLOR_BUFFER_BIT);
}

function cleanup() {
	// here you should delete textures, shaders and so on that you've initialized previously
}

