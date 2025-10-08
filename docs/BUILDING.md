
# Grovekit: building and running locally

Clone the repository:

```sh
git clone https://github.com/grovekit/grovekit
cd grovekit
```

Start the `mosquitto` and `timescaledb` services using Docker Compose:

```sh
cd docker
docker compose up -d mosquitto timescaledb
cd ..
```

Install the dependencies of all components:

```sh
npm install
```

Make sure that `@deepkit/type-compiler`'s post-install script is executed:

```sh
./node_modules/.bin/deepkit-type-install
```

Launch the TypeScript compiler for the entire project:

```sh
npm run ts:watch
```

In a different terminal, run the database migration scripts (set the
environment variables according to your local setup):

```sh
export GK_DB_URL="postgresql://grovekit:grovekit@127.0.0.1:5433/grovekit"
cd packages/libraries/database
node ./dist/bin/db-migrate.js
```

In a different terminal, launch the **scribe** service (set the environment
variables according to your local setup):

```sh
export GK_DB_URL="postgresql://grovekit:grovekit@127.0.0.1:5433/grovekit"
export GK_LOG_LEVEL="trace"
export GK_HOMIE_URL="mqtt://127.0.0.1:1884"

cd packages/services/scribe
node --watch --enable-source-maps dist/server.js
```

In a different terminal, launch the **control** service (set the environment
variables according to your local setup):

```sh
export GK_DB_URL="postgresql://grovekit:grovekit@127.0.0.1:5433/grovekit"
export GK_LOG_LEVEL="trace"
export GK_HTTP_PORT=8089
export GK_HTTP_ADDR=127.0.0.1
export GK_HOMIE_URL="mqtt://127.0.0.1:1884"

cd packages/services/control
npm run scss:build
node --watch --enable-source-maps dist/server.js
```

The dashboard will be accessible at `http://127.0.0.1:8089`.
