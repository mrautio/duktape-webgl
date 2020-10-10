FROM alpine:latest

RUN apk add --no-cache wget nodejs npm

ENV WEBGL2_IDL_URL="https://www.khronos.org/registry/webgl/specs/latest/2.0/webgl2.idl"
ENV WEBGL1_IDL_URL="https://www.khronos.org/registry/webgl/specs/1.0.2/webgl.idl"
ENV OPENGL_H_URL="https://www.khronos.org/registry/OpenGL/api/GL/glcorearb.h"

WORKDIR /tmp
RUN wget ${WEBGL2_IDL_URL} -O webgl2.idl
RUN wget ${WEBGL1_IDL_URL} -O webgl1.idl
RUN wget ${OPENGL_H_URL} -O glcorearb.h

COPY LICENSE /tmp/
COPY generator/* /tmp/

RUN npm install

CMD [ "npm", "--no-update-notifier", "--silent", "start" ]
