/*
 * Renders screen to texture and draws rendered texture as gray scale
 *
 * This is an example source file that works in duktape-webgl bootstrap program and HTML5&WebGL2 compatible browser at the same time
 */

var gl = undefined;

var vertexShader = undefined;
var fragmentShader = undefined;
var program = undefined;
var postProcessFragmentShader = undefined;
var postProcessProgram = undefined;
var vbo = undefined;
var colorTexture = undefined;
var frameBuffer = undefined;
var depthBuffer = undefined;

var textureUniformName = "texture0";
var width = 640;
var height = 480;

function createEmptyTexture(width, height, format) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, gl.UNSIGNED_BYTE, null);

    return texture;
}

function loadShader(type, source) {
    var shader = gl.createShader(type);
    if (gl.isShader(shader) == false) {
        throw "shader should exist";
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) !== true) {
        throw gl.getShaderInfoLog(shader);
    }

    if (gl.getShaderParameter(shader, gl.SHADER_TYPE) !== type) {
        throw "Shader type not expected!"; 
    }

    return shader;
}

function makeProgram(vertexShader, fragmentShader) {
    var program = gl.createProgram();
    if (gl.isProgram(program) == false) {
        throw "program should exist";
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS) !== true) {
        throw gl.getProgramInfoLog(program);
    }

    var attachedShaders = gl.getProgramParameter(program, gl.ATTACHED_SHADERS);
    if (attachedShaders !== 2) {
        throw "Expected program to have two(2) attached shaders. actual: " + attachedShaders;
    }

    return program;
}

function init() {
    // will define custom variable glsl_version to make GLSL compatible between OpenGL core and OpenGL ES
    var glsl_version = '300 es';
    if (typeof BOOTSTRAP_GLSL_VERSION === 'string') {
        // If you end up with errors like: "GLSL 3.20 is not supported. Supported versions are: 1.10, 1.20, 1.30, 1.00 ES, and 3.00 ES"
        // Then you should customize BOOTSTRAP_GLSL_VERSION to fit your need, or customize the shader code
        glsl_version = BOOTSTRAP_GLSL_VERSION;
    }

    // cross-platform (browser vs. Duktape) initialize WebGL 2
    if (typeof Duktape !== 'undefined') {
        // Duktape
        gl = new WebGL2RenderingContext();

        if (typeof gl.canvas === 'undefined') {
            gl.canvas = {
                "width": width,
                "height": height
            }
        }
    } else if (typeof document !== 'undefined') {
        // HTML5
        var canvas = document.getElementById("screen");
        gl = canvas.getContext("webgl2");
    }

    if (!gl || !(gl instanceof WebGL2RenderingContext)) {
        throw 'WebGL2 not initialized';
    }

    var vertexIndex = 0;
    var texCoordIndex = 1;

    // compile vertex shader
    var vertexShaderSource = "";
    vertexShaderSource += "#version " + glsl_version + "\n";
    vertexShaderSource += "#ifdef GL_ES\n";
    vertexShaderSource += "    precision mediump float;\n";
    vertexShaderSource += "#endif\n";
    vertexShaderSource += "layout(location = " + vertexIndex + ") in vec3 vertexPosition;\n";
    vertexShaderSource += "layout(location = " + texCoordIndex + ") in vec2 vertexTexCoord;\n";
    vertexShaderSource += "out vec2 texCoord;\n";
    vertexShaderSource += "void main() {\n";
    vertexShaderSource += "    texCoord = vertexTexCoord;\n";
    vertexShaderSource += "    gl_Position.xyz = vertexPosition;\n";
    vertexShaderSource += "    gl_Position.w = 1.0;\n";
    vertexShaderSource += "}\n";

    vertexShader = loadShader(gl.VERTEX_SHADER, vertexShaderSource);

    // compile fragment shader

    var fragmentShaderSource = "";
    fragmentShaderSource += "#version " + glsl_version + "\n";
    fragmentShaderSource += "#ifdef GL_ES\n";
    fragmentShaderSource += "    precision mediump float;\n";
    fragmentShaderSource += "#endif\n";
    fragmentShaderSource += "in vec2 texCoord;\n";
    fragmentShaderSource += "out vec4 fragColor;\n";
    fragmentShaderSource += "void main() {\n";
    fragmentShaderSource += "    fragColor = vec4(texCoord.x, texCoord.y, 1.0, 1.0);\n";
    fragmentShaderSource += "}\n";

    fragmentShader = loadShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    fragmentShaderSource = "";
    fragmentShaderSource += "#version " + glsl_version + "\n";
    fragmentShaderSource += "#ifdef GL_ES\n";
    fragmentShaderSource += "    precision mediump float;\n";
    fragmentShaderSource += "#endif\n";
    fragmentShaderSource += "uniform sampler2D " + textureUniformName + ";\n";
    fragmentShaderSource += "in vec2 texCoord;\n";
    fragmentShaderSource += "out vec4 fragColor;\n";
    fragmentShaderSource += "void main() {\n";
    fragmentShaderSource += "    fragColor = texture(" + textureUniformName + ", texCoord);\n";
    fragmentShaderSource += "    float gray = (fragColor.r + fragColor.g + fragColor.b) / 3.0;\n";
    fragmentShaderSource += "    fragColor = vec4(gray, gray, gray, fragColor.a);\n";
    fragmentShaderSource += "}\n";

    postProcessFragmentShader = loadShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    // create shader program and link compiled shaders to it

    program = makeProgram(vertexShader, fragmentShader);

    postProcessProgram = makeProgram(vertexShader, postProcessFragmentShader);

    colorTexture = createEmptyTexture(width, height, gl.RGBA);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);

    frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, frameBuffer);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, frameBuffer);
    if (gl.isFramebuffer(frameBuffer) !== true) {
        throw "framebuffer should exist";
    }

    depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    if (gl.isRenderbuffer(depthBuffer) !== true) {
        throw "renderbuffer should exist";
    }

    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    gl.framebufferRenderbuffer(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);

    var frameBufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (frameBufferStatus !== gl.FRAMEBUFFER_COMPLETE) {
        throw "FrameBuffer not complete: " + frameBufferStatus;
    }

    // create vertex buffer object

    var vboData = new Float32Array([
        /* vertex x,y,z */  /* texcoord x,y */
        -1.0,  1.0,  0.0,   0.0, 1.0,   
        -1.0, -1.0,  0.0,   0.0, 0.0,
         1.0,  1.0,  0.0,   1.0, 1.0,
         1.0, -1.0,  0.0,   1.0, 0.0
    ]);

    vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vboData, gl.STATIC_DRAW, 0);

    var typeByteSize = vboData.byteLength / vboData.length;

    gl.enableVertexAttribArray(vertexIndex);
    gl.vertexAttribPointer(vertexIndex, 3, gl.FLOAT, false, typeByteSize * (3 + 2), 0);

    gl.enableVertexAttribArray(texCoordIndex);
    gl.vertexAttribPointer(texCoordIndex, 2, gl.FLOAT, false, typeByteSize * (3 + 2), typeByteSize * 3);
}

function draw() {
    // Render to FBO a color gradient

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, frameBuffer);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, frameBuffer);
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

    gl.viewport(0, 0, width, height);

    gl.clear(gl.DEPTH_BUFFER_BIT|gl.COLOR_BUFFER_BIT);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);

    gl.useProgram(program);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Render to main screen the FBO texture, but process it into grayscale

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clear(gl.DEPTH_BUFFER_BIT|gl.COLOR_BUFFER_BIT);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);

    gl.useProgram(postProcessProgram);
    gl.uniform1i(gl.getUniformLocation(postProcessProgram, textureUniformName), 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function cleanup() {
    // do the cleanup
    gl.useProgram(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    if (colorTexture) {
        gl.deleteTexture(colorTexture);
    }

    if (vertexShader) {
        gl.deleteShader(vertexShader);    
    }
    
    if (fragmentShader) {
        gl.deleteShader(fragmentShader);
    }
    
    if (program) {
        gl.deleteProgram(program);
    }
    
    if (postProcessFragmentShader) {
        gl.deleteShader(postProcessFragmentShader);
    }
    
    if (postProcessProgram) {
        gl.deleteProgram(postProcessProgram);
    }
    
    if (vbo) {
        gl.deleteBuffer(vbo);
    }

    if (frameBuffer) {
        gl.deleteFramebuffer(frameBuffer);
    }

    if (depthBuffer) {
        gl.deleteRenderbuffer(depthBuffer);
    }
}
