'use strict';

var fs = require('fs');
var _ = require('lodash');
var WebIDL2 = require("webidl2");

var webGl1Idl = fs.readFileSync('webgl1.idl', 'utf8');
var webGl2Idl = fs.readFileSync('webgl2.idl', 'utf8');
var glCHeader = fs.readFileSync('glcorearb.h', 'utf8');

// merge WebGL 1.0 and 2.0 as 2 is extending from 1.0 definitions
var idl = _.merge(WebIDL2.parse(webGl1Idl), WebIDL2.parse(webGl2Idl));

var cConstants = [];
var cMethods = [];

var glTypeDukTypeMap = {
    "GLenum": "uint",
    "GLbitfield": "uint",
    "GLboolean": "boolean",
    "GLint": "int",
    "GLint64": "int",
    "GLint64EXT": "int",
    "GLsizei": "int",
    "GLshort": "int",
    "GLbyte": "int",
    "GLfixed": "int",
    "GLubyte": "uint",
    "GLushort": "uint",
    "GLuint": "uint",
    "GLuint64": "uint",
    "GLuint64EXT": "uint",
    "GLfloat": "number",
    "GLclampf": "number",
    "GLdouble": "number",
    "GLclampd": "number",
    "GLhalfNV": "uint",
    "DOMString": "string",
};

var glTypeDukTypeParameterFunctionMap = {
	"WebGLProgram": function(index) { return `dukwebgl_get_object_id_uint(ctx, ${index})` },
	"WebGLShader": function(index) { return `dukwebgl_get_object_id_uint(ctx, ${index})` },
	"WebGLUniformLocation": function(index) { return `dukwebgl_get_object_id_uint(ctx, ${index})` },
	"WebGLRenderbuffer": function(index) { return `dukwebgl_get_object_id_uint(ctx, ${index})` },
	"WebGLTexture": function(index) { return `dukwebgl_get_object_id_uint(ctx, ${index})` },
	"WebGLFramebuffer": function(index) { return `dukwebgl_get_object_id_uint(ctx, ${index})` },
	"WebGLBuffer": function(index) { return `dukwebgl_get_object_id_uint(ctx, ${index})` },
	"WebGLVertexArrayObject": function(index) { return `dukwebgl_get_object_id_uint(ctx, ${index})` },
	"WebGLTransformFeedback": function(index) { return `dukwebgl_get_object_id_uint(ctx, ${index})` },
	"WebGLSampler": function(index) { return `dukwebgl_get_object_id_uint(ctx, ${index})` },
	"WebGLQuery": function(index) { return `dukwebgl_get_object_id_uint(ctx, ${index})` },
	"WebGLUniformLocation": function(index) { return `dukwebgl_get_object_id_int(ctx, ${index})` },
	"GLintptr": function(index) { return `(NULL + duk_get_int(ctx, ${index}))` },
	"GLboolean": function(index) { return `(duk_get_boolean(ctx, ${index}) == 1 ? GL_TRUE : GL_FALSE)` },
	"Float32Array": function(index) { return `duk_get_buffer_data(ctx, ${index}, NULL)` },
	"Int32Array": function(index) { return `duk_get_buffer_data(ctx, ${index}, NULL)` },
	"ArrayBufferView": function(index) { return `duk_get_buffer_data(ctx, ${index}, NULL)` },
	"ArrayBuffer": function(index) { return `duk_get_buffer_data(ctx, ${index}, NULL)` },
	"BufferSource": function(index) { return `duk_get_buffer_data(ctx, ${index}, NULL)` },
};

var glTypeDukTypeReturnFunctionMap = {
	"WebGLProgram": function() { return `dukwebgl_create_object_uint(ctx, ret)` },
	"WebGLShader": function() { return `dukwebgl_create_object_uint(ctx, ret)` },
	"WebGLUniformLocation": function() { return `dukwebgl_create_object_uint(ctx, ret)` },
	"WebGLRenderbuffer": function() { return `dukwebgl_create_object_uint(ctx, ret)` },
	"WebGLTexture": function() { return `dukwebgl_create_object_uint(ctx, ret)` },
	"WebGLFramebuffer": function() { return `dukwebgl_create_object_uint(ctx, ret)` },
	"WebGLBuffer": function() { return `dukwebgl_create_object_uint(ctx, ret)` },
	"WebGLVertexArrayObject": function() { return `dukwebgl_create_object_uint(ctx, ret)` },
	"WebGLTransformFeedback": function() { return `dukwebgl_create_object_uint(ctx, ret)` },
	"WebGLSampler": function() { return `dukwebgl_create_object_uint(ctx, ret)` },
	"WebGLQuery": function() { return `dukwebgl_create_object_uint(ctx, ret)` },
	"WebGLUniformLocation": function() { return `dukwebgl_create_object_int(ctx, ret)` },
	"GLboolean": function(index) { return `duk_push_boolean(ctx, (ret == GL_TRUE ? 1 : 0))` },
};

var customWebGlBindingImplementations = {
	"getProgramParameter": {"argumentCount": 2, "glVersion": "GL_VERSION_2_0"},
	"getProgramInfoLog": {"argumentCount": 1, "glVersion": "GL_VERSION_2_0"},
	"shaderSource": {"argumentCount": 2, "glVersion": "GL_VERSION_2_0"},
	"getShaderParameter": {"argumentCount": 2, "glVersion": "GL_VERSION_2_0"},
	"getShaderInfoLog": {"argumentCount": 1, "glVersion": "GL_VERSION_2_0"},
	"createBuffer": {"argumentCount": 0, "glVersion": "GL_VERSION_2_0"},
	"deleteBuffer": {"argumentCount": 1, "glVersion": "GL_VERSION_2_0"},
	"createTexture": {"argumentCount": 0, "glVersion": "GL_VERSION_2_0"},
	"deleteTexture": {"argumentCount": 1, "glVersion": "GL_VERSION_2_0"},
	"bufferData": {"argumentCount": "DUK_VARARGS", "glVersion": "GL_VERSION_2_0"},
	"texImage2D": {"argumentCount": "DUK_VARARGS", "glVersion": "GL_VERSION_2_0"},
	"readPixels": {"argumentCount": "DUK_VARARGS", "glVersion": "GL_VERSION_2_0"},
	"texSubImage2D": {"argumentCount": 9, "glVersion": "GL_VERSION_2_0"},
	"texImage3D": {"argumentCount": "DUK_VARARGS", "glVersion": "GL_VERSION_2_0"},
	"uniformMatrix2fv": {"argumentCount": 3, "glVersion": "GL_VERSION_2_0"},
	"uniformMatrix3fv": {"argumentCount": 3, "glVersion": "GL_VERSION_2_0"},
	"uniformMatrix4fv": {"argumentCount": 3, "glVersion": "GL_VERSION_2_0"},
};

var customWebGlConstantImplementations = {
	//WebGL = -1, OpenGL: 0xFFFFFFFFFFFFFFFFull (=bigger than duktape uint)
	"TIMEOUT_IGNORED": {"skip": true}
};

var constantRegExp = new RegExp(/#\s*define\s+([\w\d_]+)\s+([\w\d-]+)/);
var methodRegExp = new RegExp(/GLAPI\s+([\w\d_]+)\s+APIENTRY\s+([\w\d-]+)\s*\(\s*([\w\d\s_,*]+)\s*\)\s*;/);
var argumentRegExp = new RegExp(/(const\s+)?([\w\d]+\s*\**)\s*([\w\d]+)/);
var currentProcessedVersion = "GL_VERSION_0_0"; // undefined version
var glVersionList = [currentProcessedVersion];

glCHeader.split("\n").forEach(line => {
	var match = constantRegExp.exec(line);
	if (match) {
		if (match[1].startsWith("GL_VERSION_")) {
			currentProcessedVersion = match[1];
			glVersionList.push(currentProcessedVersion);
		}
		cConstants.push({"name":match[1], "value":match[2], "glVersion": currentProcessedVersion});
	} else {
		match = methodRegExp.exec(line);
		if (match) {
			var argumentList = [];
			match[3].split(",").forEach(argumentString => {
				if (argumentString == "" || argumentString == "void") {
					return;
				}

				var arg = {"original": argumentString};
				var match = argumentRegExp.exec(argumentString);
				arg.type = "";
				if (match[1]) {
					arg.type += match[1];
				}
				arg.type += match[2];
				arg.type = arg.type.trim();
				arg.variableName = match[3].trim();

				if (arg.variableName == "" || arg.type == "") {
					return;
				}

				argumentList.push(arg);
			});

			cMethods.push(({"returnType": match[1], "name": match[2], "argumentList": argumentList, "glVersion": currentProcessedVersion}));
		}
	}
});

var cResult = "";
var constants = [];
var methods = [];

idl.forEach(element => {
	if ('members' in element) {
		element.members.forEach(element => {
			processConstant(element);
			processMethod(element);
		});
	}
});


function processIdlToHeader(idl) {

	cResult += `
/**
 * Copyright (c) 2018 Mika Rautio
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 * 
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 * 
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 */

#if !defined(DUK_EXTERNAL_DECL) || !defined(DUK_LOCAL)
#error "Duktape constants not found. Duktape header must be included before dukwebgl!"
#endif

#if !defined(DUK_VERSION) || (DUK_VERSION < 20000)
#error "Duktape 2.0.0 is required in minimum"
#endif

#if !defined(DUKWEBGL_H_INCLUDED)
#define DUKWEBGL_H_INCLUDED

/*
 *  Avoid C++ name mangling
 */

#if defined(__cplusplus)
extern "C" {
#endif

DUK_EXTERNAL_DECL void dukwebgl_bind(duk_context *ctx);

/*
 *  C++ name mangling
 */

#if defined(__cplusplus)
/* end 'extern "C"' wrapper */
}
#endif

#endif /* DUKWEBGL_H_INCLUDED */

#if defined(DUKWEBGL_IMPLEMENTATION)

#if !defined(GL_NONE)
#error "OpenGL constants not found. OpenGL header must be included before dukwebgl!"
#endif

/* GLEW does not define GL_VERSION_1_0 but glcorearb.h does */
#if defined(GLEW_VERSION_1_1) && !defined(GL_VERSION_1_0)
#define GL_VERSION_1_0
#endif

#define dukwebgl_bind_function(ctx, c_function_name, js_function_name, argument_count) \
    duk_push_c_function((ctx), dukwebgl_##c_function_name, (argument_count)); \
    duk_put_prop_string((ctx), -2, #js_function_name)

#define dukwebgl_push_constant_property(ctx, webgl_constant) \
    duk_push_uint((ctx), (GL_##webgl_constant)); \
    duk_put_prop_string((ctx), -2, #webgl_constant)

DUK_LOCAL void dukwebgl_bind_constants(duk_context *ctx) {
	`;

	// constants NOT defined in OpenGL C API headers
	constants.forEach(c => {
		var cConstantName = `GL_${c.name}`;
		if ('cConstant' in c) {
			return;
		}

		if (c.name in customWebGlConstantImplementations && customWebGlConstantImplementations[c.name].skip === true) {
			cResult += `/* NOT IMPLEMENTED: ${c.name} */\n`;
			return;
		}

		cResult += `#ifdef ${cConstantName}\n`;
		cResult += `    dukwebgl_push_constant_property(ctx, ${c.name});\n`;
		cResult += `#endif\n`;
	});

	// constants defined in OpenGL C API headers
	glVersionList.forEach(glVersion => {
		cResult += `\n#ifdef ${glVersion}\n`
		constants.forEach(c => {
			var cConstantName = `GL_${c.name}`;
			if (!c.cConstant) {
				return;
			}
			if (glVersion !== c.cConstant.glVersion) {
				return;
			}

			if (c.name in customWebGlConstantImplementations && customWebGlConstantImplementations[c.name].skip === true) {
				cResult += `/* NOT IMPLEMENTED: ${c.name} */\n`;
				return;
			}

			cResult += `#ifdef ${cConstantName}\n`;
			cResult += `    dukwebgl_push_constant_property(ctx, ${c.name});\n`;
			cResult += `#endif\n`;
		});
		cResult += `#endif /* ${glVersion} */ \n`
	});

	cResult += `
} /* dukwebgl_bind_constants */

DUK_LOCAL duk_idx_t dukwebgl_create_object_uint(duk_context *ctx, GLuint id) {
    duk_idx_t obj = duk_push_object(ctx);
    
    duk_push_uint(ctx, id);
    duk_put_prop_string(ctx, obj, "_id");

    return obj;
}

DUK_LOCAL GLuint dukwebgl_get_object_id_uint(duk_context *ctx, duk_idx_t obj_idx) {
    duk_get_prop_string(ctx, obj_idx, "_id");
    GLuint ret = (GLuint)duk_to_uint(ctx, -1);
    duk_pop(ctx);

    return ret;
}

DUK_LOCAL duk_idx_t dukwebgl_create_object_int(duk_context *ctx, GLint id) {
    duk_idx_t obj = duk_push_object(ctx);
    
    duk_push_int(ctx, id);
    duk_put_prop_string(ctx, obj, "_id");

    return obj;
}

DUK_LOCAL GLint dukwebgl_get_object_id_int(duk_context *ctx, duk_idx_t obj_idx) {
    duk_get_prop_string(ctx, obj_idx, "_id");
    GLint ret = (GLint)duk_to_int(ctx, -1);
    duk_pop(ctx);

    return ret;
}

#ifdef GL_VERSION_2_0

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_uniformMatrix2fv(duk_context *ctx) {
    GLuint location = dukwebgl_get_object_id_uint(ctx, 0);
    GLboolean transpose = (GLboolean)(duk_get_boolean(ctx, 1) == 1 ? GL_TRUE : GL_FALSE);
    duk_size_t count = 0;
    const GLfloat *value = duk_get_buffer_data(ctx, 2, &count);

    glUniformMatrix2fv(location, (GLsizei)count, transpose, value);

    return 0;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_uniformMatrix3fv(duk_context *ctx) {
    GLuint location = dukwebgl_get_object_id_uint(ctx, 0);
    GLboolean transpose = (GLboolean)(duk_get_boolean(ctx, 1) == 1 ? GL_TRUE : GL_FALSE);
    duk_size_t count = 0;
    const GLfloat *value = duk_get_buffer_data(ctx, 2, &count);

    glUniformMatrix3fv(location, (GLsizei)count, transpose, value);

    return 0;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_uniformMatrix4fv(duk_context *ctx) {
    GLuint location = dukwebgl_get_object_id_uint(ctx, 0);
    GLboolean transpose = (GLboolean)(duk_get_boolean(ctx, 1) == 1 ? GL_TRUE : GL_FALSE);
    duk_size_t count = 0;
    const GLfloat *value = duk_get_buffer_data(ctx, 2, &count);

    glUniformMatrix4fv(location, (GLsizei)count, transpose, value);

    return 0;
}

/* ref. https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getProgramParameter */
DUK_LOCAL void dukwebgl_push_boolean_program_parameter(duk_context *ctx, GLuint program, GLenum pname) {
    GLint value = 0; 
    glGetProgramiv(program, pname, &value);
    duk_push_boolean(ctx, value == GL_TRUE ? 1 : 0);
}
DUK_LOCAL void dukwebgl_push_int_program_parameter(duk_context *ctx, GLuint program, GLenum pname) {
    GLint value = 0; 
    glGetProgramiv(program, pname, &value);
    duk_push_int(ctx, value);
}
DUK_LOCAL void dukwebgl_push_uint_program_parameter(duk_context *ctx, GLuint program, GLenum pname) {
    GLint value = 0; 
    glGetProgramiv(program, pname, &value);
    duk_push_uint(ctx, (unsigned int)value);
}
DUK_LOCAL duk_ret_t dukwebgl_custom_impl_getProgramParameter(duk_context *ctx) {
    GLuint program = dukwebgl_get_object_id_uint(ctx, 0);
    GLenum pname = (GLenum)duk_get_uint(ctx, 1);

    switch(pname) {
#ifdef GL_DELETE_STATUS
        case GL_DELETE_STATUS:
            dukwebgl_push_boolean_program_parameter(ctx, program, pname);
            break;
#endif
#ifdef GL_LINK_STATUS
        case GL_LINK_STATUS:
            dukwebgl_push_boolean_program_parameter(ctx, program, pname);
            break;
#endif
#ifdef GL_VALIDATE_STATUS
        case GL_VALIDATE_STATUS:
            dukwebgl_push_boolean_program_parameter(ctx, program, pname);
            break;
#endif
#ifdef GL_ATTACHED_SHADERS
        case GL_ATTACHED_SHADERS:
            dukwebgl_push_int_program_parameter(ctx, program, pname);
            break;
#endif
#ifdef GL_ACTIVE_ATTRIBUTES
        case GL_ACTIVE_ATTRIBUTES:
            dukwebgl_push_int_program_parameter(ctx, program, pname);
            break;
#endif
#ifdef GL_ACTIVE_UNIFORMS
        case GL_ACTIVE_UNIFORMS:
            dukwebgl_push_int_program_parameter(ctx, program, pname);
            break;
#endif
#ifdef GL_TRANSFORM_FEEDBACK_BUFFER_MODE
        case GL_TRANSFORM_FEEDBACK_BUFFER_MODE:
            dukwebgl_push_uint_program_parameter(ctx, program, pname);
            break;
#endif
#ifdef GL_TRANSFORM_FEEDBACK_VARYINGS
        case GL_TRANSFORM_FEEDBACK_VARYINGS:
            dukwebgl_push_int_program_parameter(ctx, program, pname);
            break;
#endif
#ifdef GL_ACTIVE_UNIFORM_BLOCKS
        case GL_ACTIVE_UNIFORM_BLOCKS:
            dukwebgl_push_int_program_parameter(ctx, program, pname);
            break;
#endif
        default:
            /* Unknown parameter case not defined by the MDN specs */
            duk_push_undefined(ctx);
            break;
    }

    return 1;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_getProgramInfoLog(duk_context *ctx) {
    GLuint program = dukwebgl_get_object_id_uint(ctx, 0);

    const GLsizei maxLength = 4096;
    GLchar infoLog[maxLength];
    GLsizei length = 0;

    glGetProgramInfoLog(program, maxLength, &length, infoLog);

    duk_push_string(ctx, (const char*)infoLog);

    return 1;
}

/* ref. https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderParameter */
DUK_LOCAL void dukwebgl_push_boolean_shader_parameter(duk_context *ctx, GLuint program, GLenum pname) {
    GLint value = 0; 
    glGetShaderiv(program, pname, &value);
    duk_push_boolean(ctx, value == GL_TRUE ? 1 : 0);
}
DUK_LOCAL void dukwebgl_push_uint_shader_parameter(duk_context *ctx, GLuint program, GLenum pname) {
    GLint value = 0; 
    glGetShaderiv(program, pname, &value);
    duk_push_uint(ctx, (unsigned int)value);
}
DUK_LOCAL duk_ret_t dukwebgl_custom_impl_getShaderParameter(duk_context *ctx) {
    GLuint shader = dukwebgl_get_object_id_uint(ctx, 0);
    GLenum pname = (GLenum)duk_get_uint(ctx, 1);

    switch(pname) {
#ifdef GL_DELETE_STATUS
        case GL_DELETE_STATUS:
            dukwebgl_push_boolean_shader_parameter(ctx, shader, pname);
            break;
#endif
#ifdef GL_COMPILE_STATUS
        case GL_COMPILE_STATUS:
            dukwebgl_push_boolean_shader_parameter(ctx, shader, pname);
            break;
#endif
#ifdef GL_SHADER_TYPE
        case GL_SHADER_TYPE:
            dukwebgl_push_uint_shader_parameter(ctx, shader, pname);
            break;
#endif
        default:
            /* Unknown parameter case not defined by the MDN specs */
            duk_push_undefined(ctx);
            break;
    }

    return 1;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_getShaderInfoLog(duk_context *ctx) {
    GLuint shader = dukwebgl_get_object_id_uint(ctx, 0);

    const GLsizei maxLength = 4096;
    GLchar infoLog[maxLength];
    GLsizei length = 0;

    glGetShaderInfoLog(shader, maxLength, &length, infoLog);

    duk_push_string(ctx, (const char*)infoLog);

    return 1;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_shaderSource(duk_context *ctx) {
    GLuint shader = dukwebgl_get_object_id_uint(ctx, 0);
    const GLchar *string = (const GLchar *)duk_get_string(ctx, 1);

    glShaderSource(shader, 1, &string, NULL);

    return 0;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_createBuffer(duk_context *ctx) {
    GLuint buffers[1];

    glGenBuffers(1, buffers);
    /* GL 4.5: void glCreateBuffers(GLsizei n, GLuint *buffers); */

    dukwebgl_create_object_uint(ctx, buffers[0]);

    return 1;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_deleteBuffer(duk_context *ctx) {
    GLuint buffer = dukwebgl_get_object_id_uint(ctx, 0);
    GLuint buffers[1] = { buffer };

    glDeleteBuffers(1, buffers);

    return 0;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_createTexture(duk_context *ctx) {
    GLuint textures[1];

    glGenTextures(1, textures);
    /* GL 4.5: void glCreateTextures(GLenum target, GLsizei n, GLuint *textures); */

    dukwebgl_create_object_uint(ctx, textures[0]);

    return 1;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_deleteTexture(duk_context *ctx) {
    GLuint texture = dukwebgl_get_object_id_uint(ctx, 0);
    GLuint textures[1] = { texture };

    glDeleteTextures(1, textures);

    return 0;
}

/* ref. https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData */
DUK_LOCAL duk_ret_t dukwebgl_custom_impl_bufferData(duk_context *ctx) {
    int argc = duk_get_top(ctx);

    GLenum target = (GLenum)duk_get_uint(ctx, 0);

    duk_size_t data_size = 0;
    void *data = NULL;
    if (duk_is_buffer_data(ctx, 1)) {
        data = duk_get_buffer_data(ctx, 1, &data_size);
    } else {
        /* WebGL 1 alternative */
        data_size = (duk_size_t)duk_get_uint(ctx, 1);
    }

    GLenum usage = (GLenum)duk_get_uint(ctx, 2);

    GLuint src_offset = 0;

    if (argc > 3) {
        /* WebGL 2 mandatory */
        src_offset = (GLuint)duk_get_uint(ctx, 3);
        data_size -= src_offset;

        if (argc > 4) {
            /* WebGL 2 optional */
            data_size = (GLuint)duk_get_uint(ctx, 4);
        }
    }

    glBufferData(target, (GLsizeiptr)(NULL + data_size), (const GLvoid *)data, usage);
    /* GL 4.5: glNamedBufferData(target, (GLsizeiptr)(NULL + data_size), (const GLvoid *)data, usage); */

    return 0;
}

/* ref. https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D */

DUK_LOCAL void * dukwebgl_get_pixels(duk_context *ctx, duk_idx_t idx) {
    void * pixels = NULL;
    if (duk_is_buffer_data(ctx, idx)) {
        /* ArrayBufferView / BufferSource */
        pixels = duk_get_buffer_data(ctx, idx, NULL);
    } else if (duk_is_object(ctx, idx)) {
        /* ref. https://developer.mozilla.org/en-US/docs/Web/API/ImageData */
        if (duk_has_prop_string(ctx, idx, "data")) {
            duk_get_prop_string(ctx, idx, "data");
            if (duk_is_buffer_data(ctx, -1)) {
                pixels = duk_get_buffer_data(ctx, -1, NULL);
                duk_pop(ctx);
            } else {
                /* unrecognized object.data variable type */
		return NULL;
            }
        } else {
            /* unrecognized object type */
	    return NULL;
        }
    } else {
        /* FIXME: TBD GLintptr offset */
        /* unrecognized argument type */
	return NULL;
    }

    return pixels;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_texImage2D(duk_context *ctx) {
    int argc = duk_get_top(ctx);

    GLenum target = (GLenum)duk_get_uint(ctx, 0);
    GLint level = (GLint)duk_get_int(ctx, 1);
    GLint internalformat = (GLint)duk_get_int(ctx, 2);
    GLsizei width = 0;
    GLsizei height = 0;
    GLint border = 0;
    GLenum format = 0;
    GLenum type = 0;
    void *pixels = NULL;

    /* FIXME: partial implementation. figure out HTMLImageElement, HTMLCanvasElement, HTMLVideoElement, ImageBitmap */
    if (argc == 6) {
        format = (GLenum)duk_get_uint(ctx, 3);
        type = (GLenum)duk_get_uint(ctx, 4);

        if (duk_is_object(ctx, 6)) {
            /* ref. https://developer.mozilla.org/en-US/docs/Web/API/ImageData */
            if (duk_has_prop_string(ctx, 6, "width")) {
                duk_get_prop_string(ctx, 6, "width");
                width = (GLsizei)duk_get_int(ctx, -1);
                duk_pop(ctx);
            }
            if (duk_has_prop_string(ctx, 6, "height")) {
                duk_get_prop_string(ctx, 6, "height");
                height = (GLsizei)duk_get_int(ctx, -1);
                duk_pop(ctx);
            }
            if (duk_has_prop_string(ctx, 6, "data")) {
                duk_get_prop_string(ctx, 6, "data");
                if (duk_is_buffer_data(ctx, -1)) {
                    pixels = duk_get_buffer_data(ctx, -1, NULL);
                    duk_pop(ctx);
                }
            }
        }

        pixels = dukwebgl_get_pixels(ctx, 8);
    } else {
        width = (GLsizei)duk_get_int(ctx, 3);
        height = (GLsizei)duk_get_int(ctx, 4);
        border = (GLint)duk_get_int(ctx, 5);
        format = (GLenum)duk_get_uint(ctx, 6);
        type = (GLenum)duk_get_uint(ctx, 7);

        pixels = dukwebgl_get_pixels(ctx, 8);

        if (argc > 8) {
            GLuint offset = (GLuint)duk_get_uint(ctx, 9);
	    pixels = pixels + offset;
        }
    }

    glTexImage2D(target,level,internalformat,width,height,border,format,type,pixels);

    return 0;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_readPixels(duk_context *ctx) {
    int argc = duk_get_top(ctx);

    GLint x = (GLint)duk_get_int(ctx, 0);
    GLint y = (GLint)duk_get_int(ctx, 1);
    GLsizei width = (GLsizei)duk_get_int(ctx, 2);
    GLsizei height = (GLsizei)duk_get_int(ctx, 3);
    GLenum format = (GLenum)duk_get_uint(ctx, 4);
    GLenum type = (GLenum)duk_get_uint(ctx, 5);
    void * pixels = (void *)duk_get_buffer_data(ctx, 6, NULL);

    GLuint dstoffset = 0;
    if (argc > 7) {
        dstoffset = (GLuint)duk_get_uint(ctx, 8);
    }

    glReadPixels(x,y,width,height,format,type,pixels + dstoffset);

    return 0;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_texSubImage2D(duk_context *ctx) {
    GLenum target = (GLenum)duk_get_uint(ctx, 0);
    GLint level = (GLint)duk_get_int(ctx, 1);
    GLint xoffset = (GLint)duk_get_int(ctx, 2);
    GLint yoffset = (GLint)duk_get_int(ctx, 3);
    GLsizei width = (GLsizei)duk_get_int(ctx, 4);
    GLsizei height = (GLsizei)duk_get_int(ctx, 5);
    GLenum format = (GLenum)duk_get_uint(ctx, 6);
    GLenum type = (GLenum)duk_get_uint(ctx, 7);

    const void * pixels = dukwebgl_get_pixels(ctx, 8);

    glTexSubImage2D(target,level,xoffset,yoffset,width,height,format,type,pixels);

    return 0;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_texImage3D(duk_context *ctx) {
    int argc = duk_get_top(ctx);

    GLenum target = (GLenum)duk_get_uint(ctx, 0);
    GLint level = (GLint)duk_get_int(ctx, 1);
    GLint internalformat = (GLint)duk_get_int(ctx, 2);
    GLsizei width = (GLsizei)duk_get_int(ctx, 3);
    GLsizei height = (GLsizei)duk_get_int(ctx, 4);
    GLsizei depth = (GLsizei)duk_get_int(ctx, 5);
    GLint border = (GLint)duk_get_int(ctx, 6);
    GLenum format = (GLenum)duk_get_uint(ctx, 7);
    GLenum type = (GLenum)duk_get_uint(ctx, 8);
    const void * pixels = dukwebgl_get_pixels(ctx, 9);

    GLuint offset = 0;
    if (argc > 9) {
        offset = (GLuint)duk_get_uint(ctx, 10);
    }

    glTexImage3D(target,level,internalformat,width,height,depth,border,format,type,pixels + offset);
    return 0;
}

#endif /* GL_VERSION_2_0 */

`;

var mappedMethodCount = 0;

glVersionList.forEach(glVersion => {
	cResult += `\n#ifdef ${glVersion}\n`
methods.forEach(m => {
	if (m.cMethod) {
		if (glVersion !== m.cMethod.glVersion) {
			return;
		}
	}
	if (!m.cMethod) {
		if (glVersion.endsWith("0_0")) {
			// complain only once
			cResult += `    /* NOT IMPLEMENTED: ${m.returnType} ${m.name} (${JSON.stringify(m.argumentList)}) */\n`;
		}
		return;
	}

	var returnVariable = false;
	if (m.returnType !== 'void') {
		returnVariable = true;

		if (!(m.cMethod.returnType in glTypeDukTypeMap)) {
			cResult += `    /* NOT IMPLEMENTED: ${m.returnType} ${m.name} (${JSON.stringify(m.argumentList)}) / ${m.cMethod.returnType} ${m.cMethod.name} (${JSON.stringify(m.cMethod.argumentList)}) */\n`;
			return;
		}
	}

	var cCallVariables = [];
	var cResultArguments = "";
	for (var i = 0; i < m.cMethod.argumentList.length; i++) {
		var argument = m.argumentList[i];
		var cArgument = m.cMethod.argumentList[i];
		cResultArguments += `    ${cArgument.type} ${cArgument.variableName} = `
		if (argument.type in glTypeDukTypeParameterFunctionMap) {
			cResultArguments += `(${cArgument.type})${glTypeDukTypeParameterFunctionMap[argument.type](i)};\n`
		} else {
			var dukInputArgumentType = glTypeDukTypeMap[argument.type];
			if (!dukInputArgumentType) {
				cResult += `    /* Cannot process method: ${m.returnType} ${m.name} => ${m.cMethod.name}. argument: ${argument.type} vs. ${cArgument.type} */`;
				return;
			}

			cResultArguments += `(${cArgument.type})duk_get_${dukInputArgumentType}(ctx, ${i});\n`
		}

		cCallVariables.push(`${cArgument.variableName}`);
	}

	cResult += `\nDUK_LOCAL duk_ret_t dukwebgl_${m.cMethod.name}(duk_context *ctx) {\n`
	cResult += cResultArguments;

	var cCall = `${m.cMethod.name}(${cCallVariables.join()})`;

	if (returnVariable) {
		var dukReturnType = glTypeDukTypeMap[m.cMethod.returnType];
		cResult += `    ${m.cMethod.returnType} ret = ${cCall};\n`;
		if (m.returnType in glTypeDukTypeReturnFunctionMap) {
			cResult += `    ${glTypeDukTypeReturnFunctionMap[m.returnType]()};\n`;
		} else if (m.returnType === m.cMethod.returnType) {
			cResult += `    duk_push_${dukReturnType}(ctx, ret);\n`;
		} else {
			throw `Cannot process method: ${m.returnType} ${m.name} => ${m.cMethod.returnType} ${m.cMethod.name}`;
		}
	} else {
		cResult += `    ${cCall};\n`;
	}

	cResult += `    return ${returnVariable ? 1 : 0};\n`;
	cResult += `}\n`;

	m.definitionGenerated = true;
	mappedMethodCount++;
});
	cResult += `#endif /* ${glVersion} */\n`
});


	cResult += `
DUK_LOCAL duk_ret_t dukwebgl_WebGL2RenderingContext(duk_context *ctx) {
    duk_push_object(ctx);

    if (!duk_is_constructor_call(ctx)) {
        return DUK_RET_TYPE_ERROR;
    }

    return 0;
}

void dukwebgl_bind(duk_context *ctx) {
    duk_push_c_function(ctx, dukwebgl_WebGL2RenderingContext, 0);
    duk_push_object(ctx);
    dukwebgl_bind_constants(ctx);\n`;

	glVersionList.forEach(glVersion => {
		cResult += `\n#ifdef ${glVersion}\n`
		Object.entries(customWebGlBindingImplementations).forEach(entry => {
			let key = entry[0];
			let value = entry[1];

			if (value.glVersion !== glVersion) {
				return;
			}

			cResult += `        dukwebgl_bind_function(ctx, custom_impl_${key}, ${key}, ${value.argumentCount});\n`;
		});

		methods.forEach(m => {
			if (m.definitionGenerated !== true) {
				return;
			}

			if (m.cMethod.glVersion !== glVersion) {
				return;
			}

			// has a C function definition, binding can be done
			cResult += `        dukwebgl_bind_function(ctx, ${m.cMethod.name}, ${m.name}, ${m.cMethod.argumentList.length});\n`;
		});
		cResult += `#endif /* ${glVersion} */\n`
	});

    cResult += `
    /* Function binding coverage = ${mappedMethodCount}/${methods.length} = ${mappedMethodCount/methods.length*100.0} % */

    duk_put_prop_string(ctx, -2, "prototype");
    duk_put_global_string(ctx, "WebGL2RenderingContext");
} /* dukwebgl_bind */

#endif /* DUKWEBGL_IMPLEMENTATION */
`;

}

function processConstant(element) {
	if (element.type !== "const") {
		return;
	}

	var name = element.name;
	var value = element.value.value;

	var cConstant = cConstants.find(c => c.name === `GL_${name}`);
	//if (!cConstant) {
	//	console.log(`Contant ${name} not defined in C header!`);
	//}
	constants.push({"name": name, "value": value, "cConstant": cConstant });
}

function processMethod(element) {
	if (element.type !== "operation" || !"body" in element) {
		return;
	}

	var body = element.body;

	var returnType = body.idlType.idlType;
	var name = body.name.value;
	var argumentList = [];

	if (name in customWebGlBindingImplementations) {
		// custom implementation, do not process automatically
		return;
	}

	if ("arguments" in body) {
		body.arguments.forEach(argument => {
			var type = argument.idlType.idlType;
			argumentList.push({"original": type, "type": type});
		});
	}

	var cMethodName = "gl" + name[0].toUpperCase() + name.slice(1); 
	var cMethod = cMethods.find(c => c.name === cMethodName && c.argumentList.length === argumentList.length);
	/*if (!cMethod) {
		console.log(`Mehthod ${name}/${cMethodName} not defined in C header!`);
	}*/
	methods.push({"returnType": returnType, "name": name, "argumentList": argumentList, "cMethod": cMethod});
}

processIdlToHeader(idl);
console.log(cResult);

