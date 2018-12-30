FROM ubuntu:latest

RUN apt-get update && apt-get install -y xvfb libgcc-8-dev libsdl2-dev libglew-dev duktape-dev

ENV XDG_RUNTIME_DIR=/tmp
WORKDIR /tmp

COPY docker_entrypoint.sh .

ADD 00_bootstrap 00_bootstrap
ADD 01_grey_screen 01_grey_screen
ADD 02_hello_triangle 02_hello_triangle

RUN cd 00_bootstrap && make

CMD ["sh", "docker_entrypoint.sh"]
