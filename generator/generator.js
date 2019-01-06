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
    "GLintptr": function(index) { return `((char*)NULL + duk_get_int(ctx, ${index}))` },
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
    "uniformMatrix2fv": {"argumentCount": "DUK_VARARGS", "glVersion": "GL_VERSION_2_0"},
    "uniformMatrix3fv": {"argumentCount": "DUK_VARARGS", "glVersion": "GL_VERSION_2_0"},
    "uniformMatrix4fv": {"argumentCount": "DUK_VARARGS", "glVersion": "GL_VERSION_2_0"},
    "uniformMatrix2x3fv": {"argumentCount": "DUK_VARARGS", "glVersion": "GL_VERSION_2_0"},
    "uniformMatrix2x4fv": {"argumentCount": "DUK_VARARGS", "glVersion": "GL_VERSION_2_0"},
    "uniformMatrix3x2fv": {"argumentCount": "DUK_VARARGS", "glVersion": "GL_VERSION_2_0"},
    "uniformMatrix3x4fv": {"argumentCount": "DUK_VARARGS", "glVersion": "GL_VERSION_2_0"},
    "uniformMatrix4x2fv": {"argumentCount": "DUK_VARARGS", "glVersion": "GL_VERSION_2_0"},
    "uniformMatrix4x3fv": {"argumentCount": "DUK_VARARGS", "glVersion": "GL_VERSION_2_0"},
    "uniform1fv": {"argumentCount": 2, "glVersion": "GL_VERSION_2_0"},
    "uniform2fv": {"argumentCount": 2, "glVersion": "GL_VERSION_2_0"},
    "uniform3fv": {"argumentCount": 2, "glVersion": "GL_VERSION_2_0"},
    "uniform4fv": {"argumentCount": 2, "glVersion": "GL_VERSION_2_0"},
    "uniform1iv": {"argumentCount": 2, "glVersion": "GL_VERSION_2_0"},
    "uniform2iv": {"argumentCount": 2, "glVersion": "GL_VERSION_2_0"},
    "uniform3iv": {"argumentCount": 2, "glVersion": "GL_VERSION_2_0"},
    "uniform4iv": {"argumentCount": 2, "glVersion": "GL_VERSION_2_0"},
    "uniform1uiv": {"argumentCount": 2, "glVersion": "GL_VERSION_2_0"},
    "uniform2uiv": {"argumentCount": 2, "glVersion": "GL_VERSION_2_0"},
    "uniform3uiv": {"argumentCount": 2, "glVersion": "GL_VERSION_2_0"},
    "uniform4uiv": {"argumentCount": 2, "glVersion": "GL_VERSION_2_0"},
    "createVertexArray": {"argumentCount": 0, "glVersion": "GL_VERSION_3_0"},
    "deleteVertexArray": {"argumentCount": 1, "glVersion": "GL_VERSION_3_0"},
    "createFramebuffer": {"argumentCount": 0, "glVersion": "GL_VERSION_3_0"},
    "deleteFramebuffer": {"argumentCount": 1, "glVersion": "GL_VERSION_3_0"},
    "createRenderbuffer": {"argumentCount": 0, "glVersion": "GL_VERSION_3_0"},
    "deleteRenderbuffer": {"argumentCount": 1, "glVersion": "GL_VERSION_3_0"},
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

function licenseToHeader() {
    cResult += "/**\n";

    fs.readFileSync('LICENSE', 'utf8').split("\n").forEach(line => {
        cResult += ` * ${line}\n`;
    });

    cResult += " */\n";
}

function processIdlToHeader(idl) {

    cResult += `
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
`;

cResult += fs.readFileSync('function_definitions_inline.h', 'utf8');

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
    //    console.log(`Contant ${name} not defined in C header!`);
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

licenseToHeader();
processIdlToHeader(idl);
console.log(cResult);

