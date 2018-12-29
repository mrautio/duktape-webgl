FROM ubuntu:latest

RUN apt update && apt install -y xvfb libgcc-8-dev libsdl2-dev libglew-dev duktape-dev

ENV XDG_RUNTIME_DIR=/tmp
WORKDIR /tmp

ADD 00_bootstrap 00_bootstrap
ADD 01_grey_screen 01_grey_screen

RUN cd 00_bootstrap && make

ENTRYPOINT xvfb-run --auto-servernum --server-num=1 -s '-screen 0 640x480x24' 00_bootstrap/bootstrap.exe 00_bootstrap/exit_success.js
