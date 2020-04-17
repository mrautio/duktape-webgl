FROM node:12-stretch

RUN apt-get update && apt-get install -y xvfb libgcc-6-dev libsdl2-dev libglew-dev duktape-dev imagemagick

ENV XDG_RUNTIME_DIR=/tmp
WORKDIR /tmp

COPY * /tmp/

# Compile the main bootstrap
RUN make

# Compile the C++ test program, to verify that C++ compilation is OK
RUN ln -s bootstrap.c bootstrap.cpp && make test-cpp-compile

RUN cp bootstrap.exe /usr/bin/ && rm -rf /tmp/*

