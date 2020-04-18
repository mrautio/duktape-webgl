FROM duktape-webgl-bootstrap:latest

WORKDIR /tmp

ADD WebGL WebGL
ADD bootstrap bootstrap
COPY * ./

RUN npm install

ENV DUKWEBGL_BOOTSTRAP_EXEC_ONLY=TRUE

CMD [ "sh", "docker_entrypoint.sh" ]
