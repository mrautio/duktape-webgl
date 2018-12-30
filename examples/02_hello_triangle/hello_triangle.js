/*
 * Draw a red triangle on a black bacground
 *
 * This is an example source file that works in duktape-webgl bootstrap program and HTML5&WebGL2 compatible browser at the same time
 */

var gl = undefined;

var vertexShader = undefined;
var fragmentShader = undefined;
var program = undefined;
var vbo = undefined;

function init() {
    // cross-platform (browser vs. Duktape) initialize WebGL 2
    // will define custom variable _GLSL_VERSION to make GLSL compatible between OpenGL core and OpenGL ES
    if (typeof Duktape !== 'undefined') {
        // Duktape
        gl = new WebGL2RenderingContext();
        gl._GLSL_VERSION = '320 core';
    } else if (typeof document !== 'undefined') {
        // HTML5
        var canvas = document.getElementById("screen");
        gl = canvas.getContext("webgl2");
        gl._GLSL_VERSION = '300 es';
    }

    if (!gl || !(gl instanceof WebGL2RenderingContext)) {
        throw 'WebGL2 not initialized';
    }

    // compile vertex shader

    var vertexShaderSource = "";
    vertexShaderSource += "#version " + gl._GLSL_VERSION + "\n";
    vertexShaderSource += "#ifdef GL_ES\n";
    vertexShaderSource += "    precision mediump float;\n";
    vertexShaderSource += "#endif\n";
    vertexShaderSource += "in vec3 vertexPosition;\n";
    vertexShaderSource += "void main() {\n";
    vertexShaderSource += "    gl_Position.xyz = vertexPosition;\n";
    vertexShaderSource += "    gl_Position.w = 1.0;\n";
    vertexShaderSource += "}\n";

    vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        throw gl.getShaderInfoLog(vertexShader);
    }

    // compile fragment shader

    var fragmentShaderSource = "";
    fragmentShaderSource += "#version " + gl._GLSL_VERSION + "\n";
    fragmentShaderSource += "#ifdef GL_ES\n";
    fragmentShaderSource += "    precision mediump float;\n";
    fragmentShaderSource += "#endif\n";
    fragmentShaderSource += "out vec4 fragColor;\n";
    fragmentShaderSource += "void main() {\n";
    fragmentShaderSource += "    fragColor = vec4(1.0, 0.0, 0.0, 1.0);\n";
    fragmentShaderSource += "}\n";

    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        throw gl.getShaderInfoLog(fragmentShader);
    }

    // create shader program and link compiled shaders to it

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.useProgram(program);

    // create vertex buffer object

    var vboData = new Float32Array([
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0,
        0.0,  1.0, 0.0,
    ]);

    vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vboData, gl.STATIC_DRAW, 0);

    gl.enableVertexAttribArray(0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 0, 0);

    // background color to black

    gl.clearColor(0,0,0,1);
}

function draw() {
    // clear screen and draw red shaded triangle

    gl.clear(gl.DEPTH_BUFFER_BIT|gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function cleanup() {
    // do the cleanup

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    gl.deleteProgram(program);
    gl.deleteBuffer(vbo);
}
