
# Grovekit: building and running locally




Clone the repository:

```sh
git clone https://github.com/grovekit/grovekit
cd grovekit
```

Install the dependencies of all components:

```sh
npm install
```

Launch the TypeScript compiler for the entire project:

```sh
npm run ts:watch
```

In a different terminal, launch the **scribe** service:

```sh
export GK_DB_URL="postgresql://ucp:ucp@127.0.0.1:5433/ucp"
export GK_LOG_LEVEL="trace"
export GK_HOMIE_URL="mqtt://127.0.0.1:1884"

cd packages/services/scribe
node --watch --enable-source-maps dist/server.js
```

In a different terminal, launch the **control** service:

```sh
export GK_DB_URL="postgresql://ucp:ucp@127.0.0.1:5433/ucp"
export GK_LOG_LEVEL="trace"
export GK_HTTP_PORT=8089
export GK_HTTP_ADDR=127.0.0.1
export GK_HOMIE_URL="mqtt://127.0.0.1:1884"

cd packages/services/control
npm run scss:build
node --watch --enable-source-maps dist/server.js
```

The dashboard will be accessible at `http://127.0.0.1:8089`.
