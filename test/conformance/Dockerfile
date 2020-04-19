FROM duktape-webgl-bootstrap:latest

WORKDIR /tmp

COPY .babelrc package.json ./
RUN npm install

ADD WebGL WebGL
ADD bootstrap bootstrap
COPY docker_entrypoint.sh test.js ./

ENV DUKWEBGL_BOOTSTRAP_EXEC_ONLY=TRUE

CMD [ "sh", "docker_entrypoint.sh" ]
