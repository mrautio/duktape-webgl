.DEFAULT_GOAL := all

CFLAGS=-pedantic -Wall -Werror -Wformat -Wformat-security -fstack-protector -pie -fPIE -D_FORTIFY_SOURCE=2 -O2 -Wl,-z,relro -Wl,-z,now -Wl,-z,noexecstack -I/usr/share/duktape
LDFLAGS=-lm -lSDL2 -lGLEW -lGL

.PHONY: all
all:
	gcc bootstrap.c /usr/share/duktape/duktape.c -std=c99 ${CFLAGS} ${LDFLAGS} -o bootstrap.exe

.PHONY: test-cpp-compile
test-cpp-compile:
	g++ bootstrap.cpp /usr/share/duktape/duktape.c -std=c++11 ${CFLAGS} ${LDFLAGS} -o bootstrap_cpp.exe
