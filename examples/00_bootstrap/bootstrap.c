/**
 * Duktape-WebGL, Duktape, SDL, GLEW, OpenGL bootstrap program
 * Expects 0..N files as command line arguments.
 *
 * Following special purpose functions may be defined:
 * - function init() - is called before entering draw loop, i.e. initialize shaders and so here
 * - function draw() - is per every rendered frame, i.e. should call drawing routines here
 * - function cleanup() - is called when exiting, i.e. should contain cleanup call, like deleting textures and shaders from GPU memory
 *
 * To programatically exit from javascript, following function has been pre-defined:
 * - function exit(boolean success) - true = EXIT_SUCCESS, false = EXIT_FAILURE, this will call cleanup(), if defined
 *
 * Compile example: make
 * Usage example: ./bootstrap file1.js file2.js
 *
 * Example license: Public Domain, CC0 https://creativecommons.org/publicdomain/zero/1.0/
 */

#include <stdio.h>
#include <stdlib.h>

/* includes glew and OpenGL headers */
#include <GL/glew.h>

#include <SDL2/SDL.h>

/* Enable Duktape stdout printing support */
#define DUK_CMDLINE_PRINTALERT_SUPPORT
#define DUK_CMDLINE_CONSOLE_SUPPORT
#include <duktape.h>

/* Include duktape-webgl */
/*#define DUKWEBGL_IMPLEMENTATION
#include "dukwebgl.h"*/

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

static void cleanup(void) {
	if (data) {
		free(data);
	}

	if (f) {
		fclose(f);
	}

	if (ctx) {
		eval_js(ctx, "if (typeof cleanup === 'function') { cleanup(); } ");

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

int main (int argc, char **argv) {
	atexit(cleanup);

	if (SDL_Init(SDL_INIT_VIDEO) != 0) {
		fprintf(stderr, "Error initializing SDL2: %s\n", SDL_GetError());
		exit(EXIT_FAILURE);
	}

	SDL_Window *window = SDL_CreateWindow("duktape-webgl test", SDL_WINDOWPOS_UNDEFINED, SDL_WINDOWPOS_UNDEFINED,  640, 480, SDL_WINDOW_OPENGL);
	if (window == NULL) {
		printf("Could not create SDL window: %s\n", SDL_GetError());
		exit(EXIT_FAILURE);
	}

	SDL_GLContext sdl_gl_ctx = SDL_GL_CreateContext(window);
	if (sdl_gl_ctx == NULL) {
		printf("Could not create SDL OpenGL context: %s\n", SDL_GetError());
		exit(EXIT_FAILURE);
	}

	SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_CORE);
	SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 3);
	SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 2);

	glewExperimental = GL_TRUE;
	GLenum ret = glewInit();
	if (ret != GLEW_OK) {
		printf("Could not initialize glew: %s\n", glewGetErrorString(ret));
		exit(EXIT_FAILURE);
	}

	duk_context *ctx = duk_create_heap_default();
	if (!ctx) {
		fprintf(stderr, "Failed to create Duktape heap\n");
		exit(EXIT_FAILURE);
	}

	/* bind c_js_exit function as "bootstrapExit" in Duktape context to global object */
	duk_push_global_object(ctx);
	duk_push_c_function(ctx, c_js_exit, 1);
	duk_put_prop_string(ctx, -2, "bootstrapExit");
	duk_pop(ctx);

	/* Create duktape-webgl bindings to current Duktape context */
/*	dukwebgl_bind(ctx);*/

	int i;
	for (i = 1; i < argc; i++) {
		/* read file contents into memory */
		const char *file = argv[i];

		FILE *f = fopen(file, "rb");
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

		char *data = (char*)malloc(sizeof(char) * size);
		if (data == NULL) {
			fprintf(stderr, "Could allocate memory to read file: %s\n", file);
			exit(EXIT_FAILURE);
		}

		size_t read_size = fread(data, sizeof(char), size, f);
		if (read_size != size) {
			fprintf(stderr, "Could not read file completely: %s, %ld <=> %ld\n", file, size, read_size);
			exit(EXIT_FAILURE);
		}

		/* evaluate file data in Duktape */
		eval_js(ctx, data);

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

	while(1) {
		/* attempt to call draw() function in JavaScript */
		eval_js(ctx, "if (typeof draw === 'function') { draw(); } ");

		/* draw / swap window buffer */
		SDL_GL_SwapWindow(window);
		
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
	}

	exit(EXIT_SUCCESS);
}

