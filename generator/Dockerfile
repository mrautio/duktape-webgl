FROM alpine:latest

RUN apk add --no-cache nodejs npm

ENV WEBGL2_IDL_URL="https://www.khronos.org/registry/webgl/specs/latest/2.0/webgl2.idl"
ENV WEBGL1_IDL_URL="https://www.khronos.org/registry/webgl/specs/1.0.2/webgl.idl"
ENV OPENGL_H_URL="https://www.khronos.org/registry/OpenGL/api/GL/glcorearb.h"

WORKDIR /tmp
ADD ${WEBGL2_IDL_URL} webgl2.idl
ADD ${WEBGL1_IDL_URL} webgl1.idl
ADD ${OPENGL_H_URL} glcorearb.h

COPY LICENSE /tmp/
COPY generator/* /tmp/

RUN npm ci

CMD [ "npm", "--no-update-notifier", "--silent", "start" ]
