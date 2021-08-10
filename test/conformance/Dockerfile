FROM duktape-webgl-bootstrap:latest

WORKDIR /tmp

COPY .babelrc package.json package-lock.json ./
RUN npm ci

ADD WebGL WebGL
ADD bootstrap bootstrap
COPY docker_entrypoint.sh test.js ./

ENV DUKWEBGL_BOOTSTRAP_EXEC_ONLY=TRUE

CMD [ "bash", "docker_entrypoint.sh" ]
