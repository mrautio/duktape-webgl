FROM ubuntu:latest

RUN apt-get update && apt-get install -y xvfb libgcc-8-dev libsdl2-dev libglew-dev duktape-dev imagemagick

ENV XDG_RUNTIME_DIR=/tmp
WORKDIR /tmp

COPY docker_entrypoint.sh .

ENV DUKWEBGL_BOOTSTRAP_ONE_DRAW=TRUE
ENV DUKWEBGL_BOOTSTRAP_SCREENSHOT=TRUE
ENV DUKWEBGL_BOOTSTRAP_GLSL_VERSION="300 es"

ADD 00_bootstrap 00_bootstrap
ADD 01_grey_screen 01_grey_screen
ADD 02_hello_triangle 02_hello_triangle
ADD 03_draw_image 03_draw_image
ADD 04_render_to_texture 04_render_to_texture

# Compile the main bootstrap
RUN cd 00_bootstrap && make

# Compile the C++ test program, to verify that C++ compilation is OK
RUN cd 00_bootstrap && ln -s bootstrap.c bootstrap.cpp && make test-cpp-compile

CMD ["sh", "docker_entrypoint.sh"]
