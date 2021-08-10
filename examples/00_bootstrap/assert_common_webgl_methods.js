// Idea is here to check that dukwebgl.h was properly formed and contains some common constants and methods

// init WebGL rendering context
var gl = new WebGL2RenderingContext();
if (!gl instanceof WebGL2RenderingContext) {
	throw 'WebGL2 not initialized succesfully'
}

var constants = [
    "ACTIVE_ATTRIBUTES",
    "ACTIVE_UNIFORMS",
    "ARRAY_BUFFER",
    "ATTACHED_SHADERS",
    "CLAMP_TO_EDGE",
    "COLOR_ATTACHMENT0",
    "COLOR_BUFFER_BIT",
    "COMPILE_STATUS",
    "DEPTH_ATTACHMENT",
    "DEPTH_BUFFER_BIT",
    "DEPTH_COMPONENT16",
    "DEPTH_TEST",
    "DRAW_FRAMEBUFFER",
    "DYNAMIC_DRAW",
    "ELEMENT_ARRAY_BUFFER",
    "FLOAT",
    "FLOAT_VEC2",
    "FLOAT_VEC3",
    "FRAGMENT_SHADER",
    "FRAMEBUFFER",
    "FRAMEBUFFER_COMPLETE",
    "LINEAR",
    "LINK_STATUS",
    "MIRRORED_REPEAT",
    "NEAREST",
    "NONE",
    "READ_FRAMEBUFFER",
    "RENDERBUFFER",
    "REPEAT",
    "RGB",
    "RGBA",
    "SAMPLER_2D",
    "SHADER_TYPE",
    "STATIC_DRAW",
    "TEXTURE0",
    "TEXTURE_2D",
    "TEXTURE_MAG_FILTER",
    "TEXTURE_MIN_FILTER",
    "TEXTURE_WRAP_S",
    "TEXTURE_WRAP_T",
    "TRIANGLE_STRIP",
    "TRIANGLES",
    "UNSIGNED_BYTE",
    "VERTEX_SHADER"
];

var methods = [
    "activeTexture",
    "attachShader",
    "bindBuffer",
    "bindFramebuffer",
    "bindRenderbuffer",
    "bindTexture",
    "bindVertexArray",
    "bufferData",
    "checkFramebufferStatus",
    "clear",
    "clearColor",
    "compileShader",
    "createBuffer",
    "createFramebuffer",
    "createProgram",
    "createRenderbuffer",
    "createShader",
    "createTexture",
    "createVertexArray",
    "deleteBuffer",
    "deleteFramebuffer",
    "deleteProgram",
    "deleteRenderbuffer",
    "deleteShader",
    "deleteTexture",
    "deleteVertexArray",
    "drawArrays",
    "drawElements",
    "enable",
    "enableVertexAttribArray",
    "framebufferRenderbuffer",
    "framebufferTexture2D",
    "generateMipmap",
    "getActiveAttrib",
    "getActiveUniform",
    "getAttribLocation",
    "getProgramInfoLog",
    "getProgramParameter",
    "getShaderInfoLog",
    "getShaderParameter",
    "getUniformLocation",
    "isBuffer",
    "isFramebuffer",
    "isProgram",
    "isRenderbuffer",
    "isShader",
    "isTexture",
    "isVertexArray",
    "linkProgram",
    "renderbufferStorage",
    "shaderSource",
    "texImage2D",
    "texParameteri",
    "uniform1i",
    "useProgram",
    "vertexAttribPointer",
    "viewport"
];

for (var i = 0; i < constants.length; i++) {
    var c = constants[i];
    if (!(c in gl)) { throw "Constant '"+c+"' not found in gl, this indicates an issue in dukwebgl.h generation!"; }
}

for (var i = 0; i < methods.length; i++) {
    var m = methods[i];
    if (!(m in gl)) { throw "Method '"+m+"' not found in gl, this indicates an issue in dukwebgl.h generation!"; }
}

bootstrapExit(true);
