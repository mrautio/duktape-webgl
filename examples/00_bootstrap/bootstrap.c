/**
 * Duktape-WebGL, Duktape, SDL, GLEW, OpenGL bootstrap program
 * Expects 0..N files as command line arguments.
 * See README.md for further details
 */

#include <stdio.h>
#include <stdlib.h>

/* includes glew and OpenGL headers. OpenGL headers need to be included before duktape-webgl */
#include <GL/glew.h>

#include <SDL2/SDL.h>

/* Include Duktape before duktape-webgl */
#include <duktape.h>

/* Include duktape-webgl */
#define DUKWEBGL_IMPLEMENTATION
#include "dukwebgl.h"

#ifndef BOOTSTRAP_OPENGL_MAJOR_VERSION
#define BOOTSTRAP_OPENGL_MAJOR_VERSION 3
#endif

#ifndef BOOTSTRAP_OPENGL_MINOR_VERSION
#define BOOTSTRAP_OPENGL_MINOR_VERSION 2
#endif

#ifndef BOOTSTRAP_WINDOW_WIDTH
#define BOOTSTRAP_WINDOW_WIDTH 640
#endif

#ifndef BOOTSTRAP_WINDOW_HEIGHT
#define BOOTSTRAP_WINDOW_HEIGHT 480
#endif


static SDL_Window *window = NULL;
static SDL_GLContext sdl_gl_ctx = NULL;
static duk_context *ctx = NULL;
static FILE *f = NULL;
static char *data = NULL;

static void eval_js(duk_context *ctx, const char *data) {
    duk_push_string(ctx, data);
    duk_int_t ret = duk_peval(ctx);
    if (ret != DUK_EXEC_SUCCESS) {
        fprintf(stderr, "Duktape eval failed: %s\n", duk_safe_to_string(ctx, -1));
        exit(EXIT_FAILURE);
    }
    duk_pop(ctx);
}

/* Helper function to check that no OpenGL errors occur */
static duk_bool_t is_gl_error() {
    GLenum error_code = glGetError();
    if (error_code != GL_NO_ERROR) {
        const char *error_string;

        switch(error_code) {
#ifdef GL_INVALID_ENUM
            case GL_INVALID_ENUM:
                error_string = "GL_INVALID_ENUM";
                break;
#endif
#ifdef GL_INVALID_VALUE
            case GL_INVALID_VALUE:
                error_string = "GL_INVALID_VALUE";
                break;
#endif
#ifdef GL_INVALID_OPERATION
            case GL_INVALID_OPERATION:
                error_string = "GL_INVALID_OPERATION";
                break;
#endif
#ifdef GL_INVALID_FRAMEBUFFER_OPERATION
            case GL_INVALID_FRAMEBUFFER_OPERATION:
                error_string = "GL_INVALID_FRAMEBUFFER_OPERATION";
                break;
#endif
#ifdef GL_OUT_OF_MEMORY
            case GL_OUT_OF_MEMORY:
                error_string = "GL_OUT_OF_MEMORY";
                break;
#endif
#ifdef GL_STACK_UNDERFLOW
            case GL_STACK_UNDERFLOW:
                error_string = "GL_STACK_UNDERFLOW";
                break;
#endif
#ifdef GL_STACK_OVERFLOW
            case GL_STACK_OVERFLOW:
                error_string = "GL_STACK_OVERFLOW";
                break;
#endif
            default:
                error_string = "N/A";
                break;
        }

        fprintf(stderr, "OpenGL error occurred: %s (0x%X). OpenGL: %s, GLSL: %s\n",
                error_string, error_code,
                glGetString(GL_VERSION),
                glGetString(GL_SHADING_LANGUAGE_VERSION));

        return 1;
    }

    return 0;
}

static void cleanup(void) {
    if (data) {
        free(data);
    }

    if (f) {
        fclose(f);
    }

    if (ctx) {
        eval_js(ctx, "if (typeof cleanup === 'function') { cleanup(); } ");

        /* Check for OpenGL errors. TODO: figure out error exit if cleanup fails */
        is_gl_error();

        duk_destroy_heap(ctx);
    }

    if (sdl_gl_ctx) {
        SDL_GL_DeleteContext(sdl_gl_ctx);
    }

    if (window) {
        SDL_DestroyWindow(window);
    }

    SDL_Quit();
}

/* Helper function so that user can exit from JavaScript programmatically */
static int quit_status = EXIT_SUCCESS;
static duk_ret_t c_js_exit(duk_context *ctx) {
    int success = duk_get_boolean(ctx, 0);
    quit_status = success == 1 ? EXIT_SUCCESS : EXIT_FAILURE;

    SDL_Event event;
    event.type = SDL_QUIT;
    SDL_PushEvent(&event);
 
    return 0;
}

/**
 * Save screenshot as raw rgba
 * Convert to PNG example: convert -flip -size 640x480 -depth 8 rgba:tmpscreenshot_000000.rgb screenshot_draw_image.png
 */
static void save_screenshot(unsigned long frame, int width, int height) {    
    const int channels = 4;
    const int pixels = width * height * channels;
    char file[64];
    snprintf(file, 64, "tmpscreenshot_%06lu.rgb", frame);

    unsigned char *data = (unsigned char*)malloc(pixels * sizeof(unsigned char));
    if (data == NULL) {
        fprintf(stderr, "Could not allocate memory for screenshot saving!\n");
        exit(EXIT_FAILURE);
    }

    glReadPixels(0, 0, width, height, GL_RGBA, GL_UNSIGNED_BYTE, data);

    FILE *of = fopen(file, "wb");
    if (of == NULL) {
        free(data);
        fprintf(stderr, "Could not open file '%s' for writing!\n", file);
        exit(EXIT_FAILURE);
    }
    size_t written = fwrite(data, sizeof(char), pixels, of);
    fclose(of);
    free(data);

    if (written != (size_t)pixels) {
        fprintf(stderr, "Could not write to file '%s'! %lu <=> %d\n", file, written, pixels);
        exit(EXIT_FAILURE);
    }
}

int main (int argc, char **argv) {
    atexit(cleanup);

    if (SDL_Init(SDL_INIT_VIDEO) != 0) {
        fprintf(stderr, "Error initializing SDL2: %s\n", SDL_GetError());
        exit(EXIT_FAILURE);
    }

    window = SDL_CreateWindow("duktape-webgl test",
        SDL_WINDOWPOS_UNDEFINED, SDL_WINDOWPOS_UNDEFINED,
        BOOTSTRAP_WINDOW_WIDTH, BOOTSTRAP_WINDOW_HEIGHT,
        SDL_WINDOW_OPENGL);
    if (window == NULL) {
        printf("Could not create SDL window: %s\n", SDL_GetError());
        exit(EXIT_FAILURE);
    }

    sdl_gl_ctx = SDL_GL_CreateContext(window);
    if (sdl_gl_ctx == NULL) {
        printf("Could not create SDL OpenGL context: %s\n", SDL_GetError());
        exit(EXIT_FAILURE);
    }

    SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_CORE);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, BOOTSTRAP_OPENGL_MAJOR_VERSION);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, BOOTSTRAP_OPENGL_MINOR_VERSION);

    glewExperimental = GL_TRUE;
    GLenum ret = glewInit();
    if (ret != GLEW_OK) {
        printf("Could not initialize glew: %s\n", glewGetErrorString(ret));
        exit(EXIT_FAILURE);
    }

    const char *glsl_use_version = "320 core";
    const char *DUKWEBGL_BOOTSTRAP_GLSL_VERSION = SDL_getenv("DUKWEBGL_BOOTSTRAP_GLSL_VERSION");
    if (DUKWEBGL_BOOTSTRAP_GLSL_VERSION) {
        /* Override GLSL version */
        glsl_use_version = DUKWEBGL_BOOTSTRAP_GLSL_VERSION;
    }

    ctx = duk_create_heap_default();
    if (!ctx) {
        fprintf(stderr, "Failed to create Duktape heap\n");
        exit(EXIT_FAILURE);
    }

    /* Create duktape-webgl bindings to current Duktape context */
    dukwebgl_bind(ctx);

    duk_push_global_object(ctx);

    /* bind c_js_exit function as "bootstrapExit" in Duktape context to global object */
    duk_push_c_function(ctx, c_js_exit, 1);
    duk_put_prop_string(ctx, -2, "bootstrapExit");

    /* define window dimensions */
    duk_push_uint(ctx, BOOTSTRAP_WINDOW_WIDTH);
    duk_put_prop_string(ctx, -2, "BOOTSTRAP_WINDOW_WIDTH");
    duk_push_uint(ctx, BOOTSTRAP_WINDOW_HEIGHT);
    duk_put_prop_string(ctx, -2, "BOOTSTRAP_WINDOW_HEIGHT");

    /* GLSL version hint */
    duk_push_string(ctx, glsl_use_version);
    duk_put_prop_string(ctx, -2, "BOOTSTRAP_GLSL_VERSION");

    duk_pop(ctx);

    int i;
    for (i = 1; i < argc; i++) {
        /* read file contents into memory */
        const char *file = argv[i];

        f = fopen(file, "rb");
        if (f == NULL) {
            fprintf(stderr, "Could not open file for read: %s\n", file);
            exit(EXIT_FAILURE);
        }

        fseek(f, 0, SEEK_END);
        long size = ftell(f);
        if (size == -1L) {
            fprintf(stderr, "Could not seek file: %s\n", file);
            exit(EXIT_FAILURE);
        }
        fseek(f, 0, SEEK_SET);

        data = (char*)calloc(sizeof(char), (size + 1));
        if (data == NULL) {
            fprintf(stderr, "Could allocate memory to read file: %s\n", file);
            exit(EXIT_FAILURE);
        }

        size_t read_size = fread(data, sizeof(char), size, f);
        if (read_size != (size_t)size) {
            fprintf(stderr, "Could not read file completely: %s, %ld <=> %ld\n", file, size, read_size);
            exit(EXIT_FAILURE);
        }

        /* evaluate file data in Duktape */
        eval_js(ctx, data);

        fprintf(stdout, "Loaded file %s\n", file);

        /* cleanup file iteration */
        fclose(f);
        f = NULL;
        free(data);
        data = NULL;
    }

    if (argc < 2) {
        fprintf(stdout, "No javascript defined, will exit now\n");
        exit(EXIT_SUCCESS);
    }

    eval_js(ctx, "if (typeof init === 'function') { init(); } ");

    int loop = 1;
    int screenshot = 0;

    const char *DUKWEBGL_BOOTSTRAP_ONE_DRAW = SDL_getenv("DUKWEBGL_BOOTSTRAP_ONE_DRAW");
    if (DUKWEBGL_BOOTSTRAP_ONE_DRAW && !strcmp(DUKWEBGL_BOOTSTRAP_ONE_DRAW, "TRUE")) {
        /* Do not loop, draw only once. Used for unit testing */
        loop = 0;
    }

    const char *DUKWEBGL_BOOTSTRAP_SCREENSHOT = SDL_getenv("DUKWEBGL_BOOTSTRAP_SCREENSHOT");
    if (DUKWEBGL_BOOTSTRAP_SCREENSHOT && !strcmp(DUKWEBGL_BOOTSTRAP_SCREENSHOT, "TRUE")) {
        /* Attempt to save a screenshot per every draw round */
        screenshot = 1;
    }

    unsigned long frame = 0;
    do {
        /* attempt to call draw() function in JavaScript */
        eval_js(ctx, "if (typeof draw === 'function') { draw(); } ");

        /* Check for OpenGL errors */
        if (is_gl_error()) {
            exit(EXIT_FAILURE);
        }

        /* draw / swap window buffer */
        SDL_GL_SwapWindow(window);

        if (screenshot) {
            save_screenshot(frame, BOOTSTRAP_WINDOW_WIDTH, BOOTSTRAP_WINDOW_HEIGHT);
        }
        
        /* Check for user exit */
        SDL_Event event;
        while (SDL_PollEvent(&event)) {
            if (event.type == SDL_QUIT) {
                exit(quit_status);
            }

            if (event.type == SDL_KEYDOWN) {
                switch (event.key.keysym.sym) {
                    case SDLK_ESCAPE:
                        exit(quit_status);
                    default:
                        break;
                }
            }
        }

        /* sleep 1 ms */
        SDL_Delay(1);
        frame++;
    } while(loop);

    exit(EXIT_SUCCESS);
}

