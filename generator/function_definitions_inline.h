
DUK_LOCAL void dukwebgl_create_object_uint(duk_context *ctx, GLuint id) {
    if (id == 0) {
        duk_push_null(ctx);
        return;
    }

    duk_idx_t obj = duk_push_object(ctx);
    duk_push_uint(ctx, id);
    duk_put_prop_string(ctx, obj, "_id");
}

DUK_LOCAL GLuint dukwebgl_get_object_id_uint(duk_context *ctx, duk_idx_t obj_idx) {
    GLuint ret = 0;

    /* everything else than object assumed null */
    if (duk_is_object(ctx, obj_idx)) {
        duk_get_prop_string(ctx, obj_idx, "_id");
        ret = (GLuint)duk_to_uint(ctx, -1);
        duk_pop(ctx);
    }

    return ret;
}

DUK_LOCAL void dukwebgl_create_object_int(duk_context *ctx, GLint id) {
    if (id < 0) {
        duk_push_null(ctx);
        return;
    }

    duk_idx_t obj = duk_push_object(ctx);
    duk_push_int(ctx, id);
    duk_put_prop_string(ctx, obj, "_id");
}

DUK_LOCAL GLint dukwebgl_get_object_id_int(duk_context *ctx, duk_idx_t obj_idx) {
    GLint ret = 0;

    /* everything else than object assumed null */
    if (duk_is_object(ctx, obj_idx)) {
        duk_get_prop_string(ctx, obj_idx, "_id");
        ret = (GLint)duk_to_int(ctx, -1);
        duk_pop(ctx);
    }

    return ret;
}

#ifdef GL_VERSION_1_0

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_getContextAttributes(duk_context *ctx) {
    /*
     * ref. https://www.khronos.org/registry/webgl/specs/latest/1.0/#WEBGLCONTEXTATTRIBUTES
     * Note: Sensible fixed defaults here
     */
    duk_idx_t obj = duk_push_object(ctx);
    duk_push_boolean(ctx, 1);
    duk_put_prop_string(ctx, obj, "alpha");
    duk_push_boolean(ctx, 1);
    duk_put_prop_string(ctx, obj, "depth");
    duk_push_boolean(ctx, 1);
    duk_put_prop_string(ctx, obj, "stencil");
    duk_push_boolean(ctx, 1);
    duk_put_prop_string(ctx, obj, "antialias");
    duk_push_boolean(ctx, 1);
    duk_put_prop_string(ctx, obj, "premultipliedAlpha");
    duk_push_boolean(ctx, 0);
    duk_put_prop_string(ctx, obj, "preserveDrawingBuffer");
    duk_push_string(ctx, "default");
    duk_put_prop_string(ctx, obj, "powerPreference");
    duk_push_boolean(ctx, 0);
    duk_put_prop_string(ctx, obj, "failIfMajorPerformanceCaveat");

    return 1;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_isContextLost(duk_context *ctx) {
    /*
     * ref. https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14.13
     * Note: context is assumably never lost in Duktape implementation.
     * This function is not available in normal OpenGL.
     */
    duk_push_false(ctx);
    return 1;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_getSupportedExtensions(duk_context *ctx) {
    /*
     * ref. https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getSupportedExtensions
     * Note: No extensions supported at the moment
     * Will return an empty array.
     */
    duk_push_array(ctx);
    return 1;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_getExtension(duk_context *ctx) {
    /*
     * ref. https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getExtension
     * Note: No extensions supported at the moment
     * Will return null.
     */
    /*const GLchar *extension =*/ (const GLchar *)duk_get_string(ctx, 0);
    duk_push_null(ctx);
    return 1;
}

#endif /* GL_VERSION_1_0 */

#define DEFINE_CREATE_OBJECT(jsFunctionName, cFunctionName) \
    DUK_LOCAL duk_ret_t dukwebgl_custom_impl_##jsFunctionName (duk_context *ctx) { \
        GLuint ids[1]; \
        cFunctionName (1, ids); \
        dukwebgl_create_object_uint(ctx, ids[0]); \
        return 1; \
    }

#define DEFINE_DELETE_OBJECT(jsFunctionName, cFunctionName) \
    DUK_LOCAL duk_ret_t dukwebgl_custom_impl_##jsFunctionName (duk_context *ctx) { \
        GLuint id = dukwebgl_get_object_id_uint(ctx, 0); \
        GLuint ids[1] = { id }; \
        cFunctionName (1, ids); \
        return 0; \
    }

#ifdef GL_VERSION_2_0

DEFINE_CREATE_OBJECT(createBuffer, glGenBuffers)
DEFINE_DELETE_OBJECT(deleteBuffer, glDeleteBuffers)

DEFINE_CREATE_OBJECT(createTexture, glGenTextures)
DEFINE_DELETE_OBJECT(deleteTexture, glDeleteTextures)

DEFINE_CREATE_OBJECT(createQuery, glGenQueries)
DEFINE_DELETE_OBJECT(deleteQuery, glDeleteQueries)

/* FIXME: srcOffset / srcLength support : https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/uniformMatrix */
#define DEFINE_UNIFORM_MATRIX(jsFunctionName, cFunctionName) \
    DUK_LOCAL duk_ret_t dukwebgl_custom_impl_##jsFunctionName (duk_context *ctx) { \
        GLint location = dukwebgl_get_object_id_int(ctx, 0); \
        GLboolean transpose = (GLboolean)(duk_get_boolean(ctx, 1) == 1 ? GL_TRUE : GL_FALSE); \
        duk_size_t count = 0; \
        const GLfloat *value = (const GLfloat *)duk_get_buffer_data(ctx, 2, &count); \
        cFunctionName (location, 1, transpose, value); \
        return 0; \
    }

DEFINE_UNIFORM_MATRIX(uniformMatrix2fv, glUniformMatrix2fv)
DEFINE_UNIFORM_MATRIX(uniformMatrix3fv, glUniformMatrix3fv)
DEFINE_UNIFORM_MATRIX(uniformMatrix4fv, glUniformMatrix4fv)
DEFINE_UNIFORM_MATRIX(uniformMatrix2x3fv, glUniformMatrix2x3fv)
DEFINE_UNIFORM_MATRIX(uniformMatrix2x4fv, glUniformMatrix2x4fv)
DEFINE_UNIFORM_MATRIX(uniformMatrix3x2fv, glUniformMatrix3x2fv)
DEFINE_UNIFORM_MATRIX(uniformMatrix3x4fv, glUniformMatrix3x4fv)
DEFINE_UNIFORM_MATRIX(uniformMatrix4x2fv, glUniformMatrix4x2fv)
DEFINE_UNIFORM_MATRIX(uniformMatrix4x3fv, glUniformMatrix4x3fv)

#define DEFINE_UNIFORM_FV(jsFunctionName, cType, cFunctionName) \
    DUK_LOCAL duk_ret_t dukwebgl_custom_impl_##jsFunctionName (duk_context *ctx) { \
        GLint location = dukwebgl_get_object_id_int(ctx, 0); \
        duk_size_t count = 0; \
        const cType *value = (const cType *)duk_get_buffer_data(ctx, 2, &count); \
        cFunctionName (location, (GLsizei)count, value); \
        return 0; \
    }

DEFINE_UNIFORM_FV(uniform1fv, GLfloat, glUniform1fv)
DEFINE_UNIFORM_FV(uniform2fv, GLfloat, glUniform2fv)
DEFINE_UNIFORM_FV(uniform3fv, GLfloat, glUniform3fv)
DEFINE_UNIFORM_FV(uniform4fv, GLfloat, glUniform4fv)

DEFINE_UNIFORM_FV(uniform1iv, GLint, glUniform1iv)
DEFINE_UNIFORM_FV(uniform2iv, GLint, glUniform2iv)
DEFINE_UNIFORM_FV(uniform3iv, GLint, glUniform3iv)
DEFINE_UNIFORM_FV(uniform4iv, GLint, glUniform4iv)

DEFINE_UNIFORM_FV(uniform1uiv, GLuint, glUniform1uiv)
DEFINE_UNIFORM_FV(uniform2uiv, GLuint, glUniform2uiv)
DEFINE_UNIFORM_FV(uniform3uiv, GLuint, glUniform3uiv)
DEFINE_UNIFORM_FV(uniform4uiv, GLuint, glUniform4uiv)

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

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_getShaderSource(duk_context *ctx) {
    GLuint shader = dukwebgl_get_object_id_uint(ctx, 0);

    const GLsizei maxLength = 65536;
    GLchar source[maxLength];
    GLsizei length = 0;

    glGetShaderSource(shader, maxLength, &length, source);

    duk_push_string(ctx, (const char*)source);

    return 1;
}

/* ref. https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData */
DUK_LOCAL duk_ret_t dukwebgl_custom_impl_bufferData(duk_context *ctx) {
    int argc = duk_get_top(ctx);

    GLenum target = (GLenum)duk_get_uint(ctx, 0);

    duk_size_t data_size = 0;
    GLvoid *data = NULL;
    if (duk_is_buffer_data(ctx, 1)) {
        data = duk_get_buffer_data(ctx, 1, &data_size);
    } else {
        /* WebGL 1 alternative */
        data_size = (duk_size_t)duk_get_uint(ctx, 1);
    }

    GLenum usage = (GLenum)duk_get_uint(ctx, 2);

    if (argc > 3) {
        /* WebGL 2 mandatory */
        GLuint src_offset = (GLuint)duk_get_uint(ctx, 3);
        data = (GLvoid*)((char*)data + src_offset);
        data_size = data_size - src_offset;

        if (argc > 4) {
            /* WebGL 2 optional */
            GLuint length = (GLuint)duk_get_uint(ctx, 4);

            if (length > 0 && (GLsizeiptr)length <= data_size) {
                data_size = (GLsizeiptr)length;
            }

        }
    }

    glBufferData(target, (GLsizeiptr)((char*)NULL + data_size), (const GLvoid *)data, usage);
    /* GL 4.5: glNamedBufferData(target, (GLsizeiptr)(NULL + data_size), (const GLvoid *)data, usage); */

    return 0;
}

/* ref. https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferSubData */
DUK_LOCAL duk_ret_t dukwebgl_custom_impl_bufferSubData(duk_context *ctx) {
    int argc = duk_get_top(ctx);

    GLenum target = (GLenum)duk_get_uint(ctx, 0);

    GLintptr offset = (GLintptr)((char*)NULL + duk_get_uint(ctx, 1));

    duk_size_t data_size = 0;
    GLvoid * data = NULL;
    if (duk_is_buffer_data(ctx, 2)) {
        data = duk_get_buffer_data(ctx, 2, &data_size);
    }

    if (argc > 3) {
        GLuint src_offset = (GLuint)duk_get_uint(ctx, 3);
        data = (GLvoid*)((char*)data + src_offset);
        data_size = data_size - src_offset;

        if (argc > 4) {
            GLuint length = (GLuint)duk_get_uint(ctx, 4);

            if (data_size > 0 && (GLsizeiptr)length <= data_size) {
                data_size = (GLsizeiptr)length;
            }
        }

    }

    glBufferSubData(target, offset, (GLsizeiptr)((char*)NULL + data_size), (const GLvoid *)data);

    return 0;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_drawBuffers(duk_context *ctx) {
    duk_idx_t idx = 0;
    if (duk_is_array(ctx, idx)) {
        duk_get_prop_string(ctx, idx, "length");
        unsigned int length = duk_to_uint(ctx, -1);
        duk_pop(ctx);

        GLenum *bufs = (GLenum*)malloc(sizeof(GLenum) * length);
        if (bufs == NULL) {
            /* TODO: maybe some better way needed in out-of-memory cases */
            return DUK_ERR_ERROR;
        }

        for(unsigned int i = 0; i < length; i++) {
            duk_get_prop_index(ctx, idx, 0);
            GLenum buf = (GLenum)duk_to_uint(ctx, -1);
            duk_pop(ctx);

            bufs[i] = buf;
        }

        glDrawBuffers((GLsizei)length, (const GLenum *)bufs);

        free(bufs);

        return 0;
    }

    return DUK_ERR_TYPE_ERROR;
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
            pixels = (char*)pixels + offset;
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
    pixels = (char*)pixels + dstoffset;
    }

    glReadPixels(x,y,width,height,format,type,pixels);

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
        pixels = (char*)pixels + offset;
    }

    glTexImage3D(target,level,internalformat,width,height,depth,border,format,type,pixels);
    return 0;
}

DUK_LOCAL void dukwebgl_create_WebGLActiveInfo(duk_context *ctx, GLchar *name, GLsizei length, GLenum type, GLint size) {
    if (length <= 0) {
	/* return value not defined in invalid case for WebGL
	   OpenGL errors will happen anyway */
        duk_push_undefined(ctx);
        return;
    }

    duk_idx_t obj = duk_push_object(ctx);
    duk_push_string(ctx, (const char*)name);
    duk_put_prop_string(ctx, obj, "name");
    duk_push_uint(ctx, type);
    duk_put_prop_string(ctx, obj, "type");
    duk_push_int(ctx, size);
    duk_put_prop_string(ctx, obj, "size");
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_getActiveAttrib(duk_context *ctx) {
    GLuint program = dukwebgl_get_object_id_uint(ctx, 0);
    GLuint index = (GLuint)duk_get_uint(ctx, 1);

    const GLsizei bufSize = 1024;
    GLchar name[bufSize];
    GLsizei length = 0;
    GLenum type;
    GLint size;

    glGetActiveAttrib(program, index, bufSize, &length, &size, &type, name);

    dukwebgl_create_WebGLActiveInfo(ctx, name, length, type, size);

    return 1;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_getActiveUniform(duk_context *ctx) {
    GLuint program = dukwebgl_get_object_id_uint(ctx, 0);
    GLuint index = (GLuint)duk_get_uint(ctx, 1);

    const GLsizei bufSize = 1024;
    GLchar name[bufSize];
    GLsizei length = 0;
    GLenum type;
    GLint size;

    glGetActiveUniform(program, index, bufSize, &length, &size, &type, name);

    dukwebgl_create_WebGLActiveInfo(ctx, name, length, type, size);

    return 1;
}

#define DEFINE_GET_PARAMETER_GLENUM { \
    GLint value = 0; \
    glGetIntegerv(pname, &value); \
    duk_push_uint(ctx, (GLenum)value); \
    break; }
#define DEFINE_GET_PARAMETER_GLINT { \
    GLint value = 0; \
    glGetIntegerv(pname, &value); \
    duk_push_int(ctx, value); \
    break; }
#define DEFINE_GET_PARAMETER_GLUINT { \
    GLint value = 0; \
    glGetIntegerv(pname, &value); \
    duk_push_uint(ctx, (GLuint)value); \
    break; }
#define DEFINE_GET_PARAMETER_GLFLOAT { \
    GLfloat value = 0; \
    glGetFloatv(pname, &value); \
    duk_push_number(ctx, value); \
    break; }
#define DEFINE_GET_PARAMETER_GLBOOLEAN { \
    GLint value = 0; \
    glGetIntegerv(pname, &value); \
    duk_push_boolean(ctx, value == GL_TRUE ? 1 : 0); \
    break; }
#define DEFINE_GET_PARAMETER_WEBGLBUFFER { \
    GLint value = 0; \
    glGetIntegerv(pname, &value); \
    dukwebgl_create_object_uint(ctx, (GLuint)value); \
    break; }
#define DEFINE_GET_PARAMETER_WEBGLPROGRAM { \
    GLint value = 0; \
    glGetIntegerv(pname, &value); \
    dukwebgl_create_object_uint(ctx, (GLuint)value); \
    break; }
#define DEFINE_GET_PARAMETER_UNDEFINED { \
    duk_push_undefined(ctx); \
    break; }


DUK_LOCAL duk_ret_t dukwebgl_custom_impl_getParameter(duk_context *ctx) {
    GLenum pname = (GLenum)duk_get_uint(ctx, 0);

    switch(pname) {
// WebGL 1

#ifdef GL_ACTIVE_TEXTURE
        case GL_ACTIVE_TEXTURE: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_ALIASED_LINE_WIDTH_RANGE
        case GL_ALIASED_LINE_WIDTH_RANGE: DEFINE_GET_PARAMETER_UNDEFINED
#endif
#ifdef GL_ALIASED_POINT_SIZE_RANGE
        case GL_ALIASED_POINT_SIZE_RANGE: DEFINE_GET_PARAMETER_UNDEFINED
#endif
#ifdef GL_ALPHA_BITS
        case GL_ALPHA_BITS: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_ARRAY_BUFFER_BINDING
        case GL_ARRAY_BUFFER_BINDING: DEFINE_GET_PARAMETER_WEBGLBUFFER
#endif
#ifdef GL_BLEND
        case GL_BLEND: DEFINE_GET_PARAMETER_GLBOOLEAN
#endif
#ifdef GL_BLEND_COLOR
        case GL_BLEND_COLOR: DEFINE_GET_PARAMETER_UNDEFINED
#endif
#ifdef GL_BLEND_DST_ALPHA
        case GL_BLEND_DST_ALPHA: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_BLEND_DST_RGB
        case GL_BLEND_DST_RGB: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_BLEND_EQUATION
        case GL_BLEND_EQUATION: DEFINE_GET_PARAMETER_GLENUM
#elif GL_BLEND_EQUATION_RGB
        case GL_BLEND_EQUATION_RGB: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_BLEND_EQUATION_ALPHA
        case GL_BLEND_EQUATION_ALPHA: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_BLEND_SRC_ALPHA
        case GL_BLEND_SRC_ALPHA: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_BLEND_SRC_RGB
        case GL_BLEND_SRC_RGB: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_BLUE_BITS
        case GL_BLUE_BITS: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_COLOR_CLEAR_VALUE
        case GL_COLOR_CLEAR_VALUE: DEFINE_GET_PARAMETER_UNDEFINED
#endif
#ifdef GL_COLOR_WRITEMASK
        case GL_COLOR_WRITEMASK: DEFINE_GET_PARAMETER_UNDEFINED
#endif
#ifdef GL_COMPRESSED_TEXTURE_FORMATS
        case GL_COMPRESSED_TEXTURE_FORMATS: DEFINE_GET_PARAMETER_UNDEFINED
#endif
#ifdef GL_CULL_FACE
        case GL_CULL_FACE: DEFINE_GET_PARAMETER_GLBOOLEAN
#endif
#ifdef GL_CULL_FACE_MODE
        case GL_CULL_FACE_MODE: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_CURRENT_PROGRAM
        case GL_CURRENT_PROGRAM: DEFINE_GET_PARAMETER_WEBGLPROGRAM
#endif
#ifdef GL_DEPTH_BITS
        case GL_DEPTH_BITS: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_DEPTH_CLEAR_VALUE
        case GL_DEPTH_CLEAR_VALUE: DEFINE_GET_PARAMETER_GLFLOAT
#endif
#ifdef GL_DEPTH_FUNC
        case GL_DEPTH_FUNC: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_DEPTH_RANGE
        case GL_DEPTH_RANGE: DEFINE_GET_PARAMETER_UNDEFINED
#endif
#ifdef GL_DEPTH_TEST
        case GL_DEPTH_TEST: DEFINE_GET_PARAMETER_GLBOOLEAN
#endif
#ifdef GL_DEPTH_WRITEMASK
        case GL_DEPTH_WRITEMASK: DEFINE_GET_PARAMETER_GLBOOLEAN
#endif
#ifdef GL_DITHER
        case GL_DITHER: DEFINE_GET_PARAMETER_GLBOOLEAN
#endif
#ifdef GL_ELEMENT_ARRAY_BUFFER_BINDING
        case GL_ELEMENT_ARRAY_BUFFER_BINDING: DEFINE_GET_PARAMETER_WEBGLBUFFER
#endif
#ifdef GL_FRAMEBUFFER_BINDING
        case GL_FRAMEBUFFER_BINDING: DEFINE_GET_PARAMETER_UNDEFINED
#endif
#ifdef GL_FRONT_FACE
        case GL_FRONT_FACE: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_GENERATE_MIPMAP_HINT
        case GL_GENERATE_MIPMAP_HINT: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_GREEN_BITS
        case GL_GREEN_BITS: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_IMPLEMENTATION_COLOR_READ_FORMAT
        case GL_IMPLEMENTATION_COLOR_READ_FORMAT: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_IMPLEMENTATION_COLOR_READ_TYPE
        case GL_IMPLEMENTATION_COLOR_READ_TYPE: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_LINE_WIDTH
        case GL_LINE_WIDTH: DEFINE_GET_PARAMETER_GLFLOAT
#endif
#ifdef GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS
        case GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_MAX_CUBE_MAP_TEXTURE_SIZE
        case GL_MAX_CUBE_MAP_TEXTURE_SIZE: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_MAX_FRAGMENT_UNIFORM_VECTORS
        case GL_MAX_FRAGMENT_UNIFORM_VECTORS: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_MAX_RENDERBUFFER_SIZE
        case GL_MAX_RENDERBUFFER_SIZE: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_MAX_TEXTURE_IMAGE_UNITS
        case GL_MAX_TEXTURE_IMAGE_UNITS: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_MAX_TEXTURE_SIZE
        case GL_MAX_TEXTURE_SIZE: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_MAX_VARYING_VECTORS
        case GL_MAX_VARYING_VECTORS: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_MAX_VERTEX_ATTRIBS
        case GL_MAX_VERTEX_ATTRIBS: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS
        case GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_MAX_VERTEX_UNIFORM_VECTORS
        case GL_MAX_VERTEX_UNIFORM_VECTORS: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_MAX_VIEWPORT_DIMS
        case GL_MAX_VIEWPORT_DIMS: DEFINE_GET_PARAMETER_UNDEFINED
#endif
#ifdef GL_PACK_ALIGNMENT
        case GL_PACK_ALIGNMENT: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_POLYGON_OFFSET_FACTOR
        case GL_POLYGON_OFFSET_FACTOR: DEFINE_GET_PARAMETER_GLFLOAT
#endif
#ifdef GL_POLYGON_OFFSET_FILL
        case GL_POLYGON_OFFSET_FILL: DEFINE_GET_PARAMETER_GLBOOLEAN
#endif
#ifdef GL_POLYGON_OFFSET_UNITS
        case GL_POLYGON_OFFSET_UNITS: DEFINE_GET_PARAMETER_GLFLOAT
#endif
#ifdef GL_RED_BITS
        case GL_RED_BITS: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_RENDERBUFFER_BINDING
        case GL_RENDERBUFFER_BINDING: DEFINE_GET_PARAMETER_UNDEFINED
#endif
#ifdef GL_RENDERER
        case GL_RENDERER: DEFINE_GET_PARAMETER_UNDEFINED
#endif
#ifdef GL_SAMPLE_BUFFERS
        case GL_SAMPLE_BUFFERS: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_SAMPLE_COVERAGE_INVERT
        case GL_SAMPLE_COVERAGE_INVERT: DEFINE_GET_PARAMETER_GLBOOLEAN
#endif
#ifdef GL_SAMPLE_COVERAGE_VALUE
        case GL_SAMPLE_COVERAGE_VALUE: DEFINE_GET_PARAMETER_GLFLOAT
#endif
#ifdef GL_SAMPLES
        case GL_SAMPLES: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_SCISSOR_BOX
        case GL_SCISSOR_BOX: DEFINE_GET_PARAMETER_UNDEFINED
#endif
#ifdef GL_SCISSOR_TEST
        case GL_SCISSOR_TEST: DEFINE_GET_PARAMETER_GLBOOLEAN
#endif
#ifdef GL_SHADING_LANGUAGE_VERSION
        case GL_SHADING_LANGUAGE_VERSION: DEFINE_GET_PARAMETER_UNDEFINED
#endif
#ifdef GL_STENCIL_BACK_FAIL
        case GL_STENCIL_BACK_FAIL: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_STENCIL_BACK_FUNC
        case GL_STENCIL_BACK_FUNC: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_STENCIL_BACK_PASS_DEPTH_FAIL
        case GL_STENCIL_BACK_PASS_DEPTH_FAIL: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_STENCIL_BACK_PASS_DEPTH_PASS
        case GL_STENCIL_BACK_PASS_DEPTH_PASS: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_STENCIL_BACK_REF
        case GL_STENCIL_BACK_REF: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_STENCIL_BACK_VALUE_MASK
        case GL_STENCIL_BACK_VALUE_MASK: DEFINE_GET_PARAMETER_GLUINT
#endif
#ifdef GL_STENCIL_BACK_WRITEMASK
        case GL_STENCIL_BACK_WRITEMASK: DEFINE_GET_PARAMETER_GLUINT
#endif
#ifdef GL_STENCIL_BITS
        case GL_STENCIL_BITS: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_STENCIL_CLEAR_VALUE
        case GL_STENCIL_CLEAR_VALUE: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_STENCIL_FAIL
        case GL_STENCIL_FAIL: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_STENCIL_FUNC
        case GL_STENCIL_FUNC: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_STENCIL_PASS_DEPTH_FAIL
        case GL_STENCIL_PASS_DEPTH_FAIL: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_STENCIL_PASS_DEPTH_PASS
        case GL_STENCIL_PASS_DEPTH_PASS: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_STENCIL_REF
        case GL_STENCIL_REF: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_STENCIL_TEST
        case GL_STENCIL_TEST: DEFINE_GET_PARAMETER_GLBOOLEAN
#endif
#ifdef GL_STENCIL_VALUE_MASK
        case GL_STENCIL_VALUE_MASK: DEFINE_GET_PARAMETER_GLUINT
#endif
#ifdef GL_STENCIL_WRITEMASK
        case GL_STENCIL_WRITEMASK: DEFINE_GET_PARAMETER_GLUINT
#endif
#ifdef GL_SUBPIXEL_BITS
        case GL_SUBPIXEL_BITS: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_TEXTURE_BINDING_2D
        case GL_TEXTURE_BINDING_2D: DEFINE_GET_PARAMETER_UNDEFINED
#endif
#ifdef GL_TEXTURE_BINDING_CUBE_MAP
        case GL_TEXTURE_BINDING_CUBE_MAP: DEFINE_GET_PARAMETER_UNDEFINED
#endif
#ifdef GL_UNPACK_ALIGNMENT
        case GL_UNPACK_ALIGNMENT: DEFINE_GET_PARAMETER_GLINT
#endif
#ifdef GL_UNPACK_COLORSPACE_CONVERSION_WEBGL
        case GL_UNPACK_COLORSPACE_CONVERSION_WEBGL: DEFINE_GET_PARAMETER_GLENUM
#endif
#ifdef GL_UNPACK_FLIP_Y_WEBGL
        case GL_UNPACK_FLIP_Y_WEBGL: DEFINE_GET_PARAMETER_GLBOOLEAN
#endif
#ifdef GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL
        case GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL: DEFINE_GET_PARAMETER_GLBOOLEAN
#endif
#ifdef GL_VENDOR
        case GL_VENDOR: DEFINE_GET_PARAMETER_UNDEFINED
#endif
#ifdef GL_VERSION
        case GL_VERSION: DEFINE_GET_PARAMETER_UNDEFINED
#endif
#ifdef GL_VIEWPORT
        case GL_VIEWPORT: DEFINE_GET_PARAMETER_UNDEFINED
#endif

// WebGL 2

        default: DEFINE_GET_PARAMETER_UNDEFINED
    }

    return 1;
}

#endif /* GL_VERSION_2_0 */

#ifdef GL_VERSION_3_0

#define DEFINE_CLEAR_BUFFER_V(jsFunctionName, cType, cFunctionName) \
    DUK_LOCAL duk_ret_t dukwebgl_custom_impl_##jsFunctionName (duk_context *ctx) { \
        int argc = duk_get_top(ctx); \
        GLenum buffer = (GLenum)duk_get_uint(ctx, 0); \
        GLint drawbuffer = (GLint)duk_get_int(ctx, 1); \
        cType *value = (cType *)duk_get_buffer_data(ctx, 2, NULL); \
        if (argc > 3) { \
            GLuint srcOffset = (GLuint)duk_get_uint(ctx, 3); \
            value = value + srcOffset; \
        } \
        cFunctionName (buffer, drawbuffer, (const cType *)value); \
        return 0; \
    }

DEFINE_CLEAR_BUFFER_V(clearBufferfv, GLfloat, glClearBufferfv)
DEFINE_CLEAR_BUFFER_V(clearBufferiv, GLint, glClearBufferiv)
DEFINE_CLEAR_BUFFER_V(clearBufferuiv, GLuint, glClearBufferuiv)

DEFINE_CREATE_OBJECT(createVertexArray, glGenVertexArrays)
DEFINE_DELETE_OBJECT(deleteVertexArray, glDeleteVertexArrays)

DEFINE_CREATE_OBJECT(createFramebuffer, glGenFramebuffers)
DEFINE_DELETE_OBJECT(deleteFramebuffer, glDeleteFramebuffers)

DEFINE_CREATE_OBJECT(createRenderbuffer, glGenRenderbuffers)
DEFINE_DELETE_OBJECT(deleteRenderbuffer, glDeleteRenderbuffers)

#endif /* GL_VERSION_3_0 */

#ifdef GL_VERSION_3_1

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_getActiveUniformBlockName(duk_context *ctx) {
    GLuint program = dukwebgl_get_object_id_uint(ctx, 0);
    GLuint uniformBlockIndex = duk_get_uint(ctx, 1);

    const GLsizei maxLength = 1024;
    GLchar uniformBlockName[maxLength];
    GLsizei length = 0;

    glGetActiveUniformBlockName(program, uniformBlockIndex, maxLength, &length, uniformBlockName);

    duk_push_string(ctx, (const char*)uniformBlockName);

    return 1;
}

#endif /* GL_VERSION_3_1 */

#ifdef GL_VERSION_3_2

/* only utilized with WebGLSync / GLsync */
DUK_LOCAL void dukwebgl_create_object_ptr(duk_context *ctx, void *ptr) {
    if (ptr == NULL) {
        duk_push_null(ctx);
        return;
    }

    duk_idx_t obj = duk_push_object(ctx);
    duk_push_pointer(ctx, ptr);
    duk_put_prop_string(ctx, obj, "_ptr");
}

DUK_LOCAL void* dukwebgl_get_object_ptr(duk_context *ctx, duk_idx_t obj_idx) {
    void* ret = NULL;

    /* everything else than object assumed null */
    if (duk_is_object(ctx, obj_idx)) {
        duk_get_prop_string(ctx, obj_idx, "_ptr");
        ret = duk_to_pointer(ctx, -1);
        duk_pop(ctx);
    }

    return ret;
}

DEFINE_CREATE_OBJECT(createSampler, glGenSamplers)
DEFINE_DELETE_OBJECT(deleteSampler, glDeleteSamplers)

#endif /* GL_VERSION_3_2 */

#ifdef GL_VERSION_4_0

DEFINE_CREATE_OBJECT(createTransformFeedback, glGenTransformFeedbacks)
DEFINE_DELETE_OBJECT(deleteTransformFeedback, glDeleteTransformFeedbacks)

#endif /* GL_VERSION_4_0 */
