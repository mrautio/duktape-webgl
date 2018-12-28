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
    "GLboolean": "boolean",
    "GLbitfield": "uint",
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
};

var customWebGlBindingImplementations = {
	"getProgramParameter": {"argumentCount": 2}
};

var constantRegExp = new RegExp(/#\s*define\s+([\w\d_]+)\s+([\w\d-]+)/);
var methodRegExp = new RegExp(/GLAPI\s+([\w\d_]+)\s+APIENTRY\s+([\w\d-]+)\s*\(\s*([\w\d\s_,*]+)\s*\)\s*;/);
var argumentRegExp = new RegExp(/([\w\d]+\**)\s*([\w\d]+)/);
glCHeader.split("\n").forEach(line => {
	var match = constantRegExp.exec(line);
	if (match) {
		cConstants.push({"name":match[1], "value":match[2]});
	} else {
		match = methodRegExp.exec(line);
		if (match) {
			var argumentList = [];
			match[3].split(",").forEach(argumentString => {
				if (argumentString == "" || argumentString == "void") {
					return;
				}

				var arg = {"original": argumentString};
				argumentString.replace(/const\s+/g,"");
				argumentString.replace(/\s*\*\s*/g,"*");
				var match = argumentRegExp.exec(argumentString);
				arg.type = match[1];
				arg.variableName = match[2];

				if (arg.variableName == "" || arg.type == "") {
					return;
				}

				argumentList.push(arg);
			});
			cMethods.push(({"returnType": match[1], "name": match[2], "argumentList": argumentList}));
		}
	}
});

var pad = "    ";
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

#if !defined(DUK_EXTERNAL_DECL) || !defined(DUK_LOCAL)
#error "Duktape constants not found. Duktape header must be included before dukwebgl!"
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

#define dukwebgl_bind_function(ctx, c_function_name, js_function_name, argument_count) \
${pad}duk_push_c_function((ctx), dukwebgl_##c_function_name, (argument_count)); \
${pad}duk_put_prop_string((ctx), -2, #js_function_name)

#define dukwebgl_push_constant_property(ctx, webgl_constant) \
${pad}duk_push_uint((ctx), (GL_##webgl_constant)); \
${pad}duk_put_prop_string((ctx), -2, #webgl_constant)

DUK_LOCAL void dukwebgl_bind_constants(duk_context *ctx) {
${pad}/*  
${pad} *  If constant is not defined in included OpenGL C headers, it will not be exported to JS object
${pad} *  In practice many WebGL only constants, like UNPACK_FLIP_Y_WEBGL, are never exported
${pad} */

	`;

	constants.forEach(c => {

		cResult += `#ifdef GL_${c.name}\n`;
		cResult += `${pad}dukwebgl_push_constant_property(ctx, ${c.name});\n`;
		cResult += `#endif\n`;
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
    GLuint program = dukwebgl_get_webgl_object_id_uint(ctx, 0);
    GLenum pname = (GLenum)duk_get_uint(ctx, 1);

    int type = 0;
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
`;

var mappedMethodCount = 0;
methods.forEach(m => {
	if (!m.cMethod) {
		cResult += `${pad}/* NOT IMPLEMENTED: ${m.returnType} ${m.name} (${JSON.stringify(m.argumentList)}) */\n`;
		return;
	}

	var returnVariable = false;
	if (m.returnType !== 'void') {
		returnVariable = true;

		if (!(m.cMethod.returnType in glTypeDukTypeMap)) {
			cResult += `${pad}/* NOT IMPLEMENTED: ${m.returnType} ${m.name} (${JSON.stringify(m.argumentList)}) / ${m.cMethod.returnType} ${m.cMethod.name} (${JSON.stringify(m.cMethod.argumentList)}) */\n`;
			return;
		}
	}

	var cCallVariables = [];
	var cResultArguments = "";
	for (var i = 0; i < m.cMethod.argumentList.length; i++) {
		var argument = m.argumentList[i];
		var cArgument = m.cMethod.argumentList[i];
		cResultArguments += `${pad}${cArgument.type} ${cArgument.variableName} = `
		if (argument.type in glTypeDukTypeParameterFunctionMap) {
			cResultArguments += `(${cArgument.type})${glTypeDukTypeParameterFunctionMap[argument.type](i)}; // ${argument.original} & ${cArgument.original}\n`
		} else {
			var dukInputArgumentType = glTypeDukTypeMap[argument.type];
			if (!dukInputArgumentType) {
				cResult += `${pad}/* Cannot process method: ${m.returnType} ${m.name} => ${m.cMethod.name}. argument: ${argument.type} vs. ${cArgument.type} */`;
				return;
			}
			cResultArguments += `(${cArgument.type})duk_get_${dukInputArgumentType}(ctx, ${i}); // ${argument.original} & ${cArgument.original}\n`
		}

		cCallVariables.push(`${cArgument.variableName}`);
	}

	cResult += `\nDUK_LOCAL duk_ret_t dukwebgl_${m.cMethod.name}(duk_context *ctx) {\n`
	cResult += cResultArguments;

	var cCall = `${m.cMethod.name}(${cCallVariables.join()})`;

	if (returnVariable) {
		var dukReturnType = glTypeDukTypeMap[m.cMethod.returnType];
		cResult += `${pad}${m.cMethod.returnType} ret = ${cCall};\n`;
		if (m.returnType in glTypeDukTypeReturnFunctionMap) {
			cResult += `${pad}${glTypeDukTypeReturnFunctionMap[m.returnType]()};\n`;
		} else if (m.returnType === m.cMethod.returnType) {
			cResult += `${pad}duk_push_${dukReturnType}(ctx, ret);\n`;
		} else {
			throw `Cannot process method: ${m.returnType} ${m.name} => ${m.cMethod.returnType} ${m.cMethod.name}`;
		}
	} else {
		cResult += `${pad}${cCall};\n`;
	}

	cResult += `${pad}return ${returnVariable ? 1 : 0};\n`;
	cResult += `}\n`;

	mappedMethodCount++;
});

	cResult += `
DUK_LOCAL duk_ret_t dukwebgl_WebGL2RenderingContext(duk_context *ctx) {
    duk_idx_t obj = duk_push_object(ctx);

    if (duk_is_constructor_call(ctx)) {\n`;
	Object.entries(customWebGlBindingImplementations).forEach(entry => {
		let key = entry[0];
		let value = entry[1];
		cResult += `${pad}${pad}dukwebgl_bind_function(ctx, custom_impl_${key}, ${key}, ${value.argumentCount});\n`;
	});

	methods.forEach(m => {
		if (!m.cMethod) {
			cResult += `${pad}${pad}/* NOT IMPLEMENTED: ${m.returnType} ${m.name} (${JSON.stringify(m.argumentList)}) */\n`;
			return;
		}

		cResult += `${pad}${pad}dukwebgl_bind_function(ctx, ${m.cMethod.name}, ${m.name}, ${m.cMethod.argumentList.length});\n`;
	});
	
	cResult += `
	/* Function binding coverage = ${mappedMethodCount}/${methods.length} = ${mappedMethodCount/methods.length*100.0} % */
    }

    return 1;
}

DUK_LOCAL void dukwebgl_bind_methods(duk_context *ctx) {
${pad}dukwebgl_bind_function(ctx, WebGL2RenderingContext, WebGL2RenderingContext, 0);
} /* dukwebgl_bind_methods */

void dukwebgl_bind(duk_context *ctx) {
${pad}dukwebgl_bind_constants(ctx);
${pad}dukwebgl_bind_methods(ctx);
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
	if (!cMethod) {
		//FIXME: Many plural forms turned into singulars in WebGl, some handling needs to be figured out
		//FIXME: getInternalformatParameter => what is this?
		//console.log(`Mehthod ${name}/${cMethodName} not defined in C header!`);
	}
	methods.push({"returnType": returnType, "name": name, "argumentList": argumentList, "cMethod": cMethod});
}

processIdlToHeader(idl);
console.log(cResult);

