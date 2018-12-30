.DEFAULT_GOAL := all
.PHONY: all
all:
	gcc bootstrap.c -ansi -Wall -Werror -Wformat -Wformat-security -fstack-protector -pie -fPIE -D_FORTIFY_SOURCE=2 -O2 -Wl,-z,relro -Wl,-z,now -Wl,-z,noexecstack -lSDL2 -lduktape -lGLEW -lGL -o bootstrap.exe
