FROM node:22-alpine

ARG VERSION

RUN mkdir /app
WORKDIR /app
RUN echo "{}" > package.json
RUN npm install --registry=http://127.0.0.1:4873 @grovekit/scribe@$VERSION
CMD ["node_modules/.bin/gk-scribe"]
