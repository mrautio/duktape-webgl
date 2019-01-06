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

    // everything else than object assumed null
    if (duk_is_object(ctx, obj_idx)) {
        duk_get_prop_string(ctx, obj_idx, "_id");
        ret = (GLuint)duk_to_uint(ctx, -1);
        duk_pop(ctx);
    }

    return ret;
}

DUK_LOCAL void dukwebgl_create_object_int(duk_context *ctx, GLint id) {
    if (id == 0) {
        duk_push_null(ctx);
        return;
    }

    duk_idx_t obj = duk_push_object(ctx);
    duk_push_int(ctx, id);
    duk_put_prop_string(ctx, obj, "_id");
}

DUK_LOCAL GLint dukwebgl_get_object_id_int(duk_context *ctx, duk_idx_t obj_idx) {
    GLint ret = 0;

    // everything else than object assumed null
    if (duk_is_object(ctx, obj_idx)) {
        duk_get_prop_string(ctx, obj_idx, "_id");
        ret = (GLint)duk_to_int(ctx, -1);
        duk_pop(ctx);
    }

    return ret;
}

#ifdef GL_VERSION_2_0

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_uniformMatrix2fv(duk_context *ctx) {
    GLuint location = dukwebgl_get_object_id_uint(ctx, 0);
    GLboolean transpose = (GLboolean)(duk_get_boolean(ctx, 1) == 1 ? GL_TRUE : GL_FALSE);
    duk_size_t count = 0;
    const GLfloat *value = (const GLfloat *)duk_get_buffer_data(ctx, 2, &count);

    glUniformMatrix2fv(location, (GLsizei)count, transpose, value);

    return 0;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_uniformMatrix3fv(duk_context *ctx) {
    GLuint location = dukwebgl_get_object_id_uint(ctx, 0);
    GLboolean transpose = (GLboolean)(duk_get_boolean(ctx, 1) == 1 ? GL_TRUE : GL_FALSE);
    duk_size_t count = 0;
    const GLfloat *value = (const GLfloat *)duk_get_buffer_data(ctx, 2, &count);

    glUniformMatrix3fv(location, (GLsizei)count, transpose, value);

    return 0;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_uniformMatrix4fv(duk_context *ctx) {
    GLuint location = dukwebgl_get_object_id_uint(ctx, 0);
    GLboolean transpose = (GLboolean)(duk_get_boolean(ctx, 1) == 1 ? GL_TRUE : GL_FALSE);
    duk_size_t count = 0;
    const GLfloat *value = (const GLfloat *)duk_get_buffer_data(ctx, 2, &count);

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

    glBufferData(target, (GLsizeiptr)((char*)NULL + data_size), (const GLvoid *)data, usage);
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

#endif /* GL_VERSION_2_0 */

#ifdef GL_VERSION_3_0

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_createVertexArray(duk_context *ctx) {
    GLuint arrays[1];

    glGenVertexArrays(1, arrays);
    /* GL 4.5: void glCreateVertexArrays(GLsizei n, GLuint *arrays); */

    dukwebgl_create_object_uint(ctx, arrays[0]);

    return 1;
}

DUK_LOCAL duk_ret_t dukwebgl_custom_impl_deleteVertexArray(duk_context *ctx) {
    GLuint array = dukwebgl_get_object_id_uint(ctx, 0);
    GLuint arrays[1] = { array };

    glDeleteVertexArrays(1, arrays);

    return 0;
}

#endif /* GL_VERSION_3_0 */
