# GROVEKIT CONTROL & SCRIBE

Monorepo containing the **Control** and **Scribe** components of the
[Grovekit] IoT stack — a lightweight, self-hosted, opinionated IoT platform
built on the [Homie MQTT convention], [Node.js] and [TypeScript].

> **Status:** pre-alpha. Production use is highly discouraged.

## Table of Contents

- [Overview](#overview)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [License](#license)

## Overview

This repository houses two runtime applications and the shared libraries they
depend on:

| Package | Type | Description |
| --- | --- | --- |
| [`@grovekit/control`](./packages/apps/control) | App | Server-side-rendered management dashboard for browsing, monitoring, and controlling connected Homie devices. Exposes a live data feed, an alerts view, and a configurable reports system with CSV export. |
| [`@grovekit/scribe`](./packages/apps/scribe) | App | Headless background service that subscribes to MQTT topics via the Homie convention, auto-discovers devices and their properties, and durably persists all datapoints and state changes to [TimescaleDB]. |
| [`@grovekit/database`](./packages/libs/database) | Library | Shared data-access layer built on [Kysely] and [postgres.js]. Provides a type-safe query builder, a migration runner, and high-level service functions for devices, feeds, alerts, reports, and time-series datapoints. |
| [`@grovekit/utils`](./packages/libs/utils) | Library | Shared utilities: runtime configuration from environment variables, structured logging, a batching worker, async helpers, datetime utilities, and typed JSON helpers. |

### Architecture

**Scribe** connects to the MQTT broker, enables Homie auto-discovery, and
durably stores every device state change, property value update, log message,
and alert into TimescaleDB. It runs entirely headlessly.

**Control** connects to both the MQTT broker and TimescaleDB. It serves a
server-side-rendered web interface that allows operators to inspect device
states, browse time-series charts, configure reports, manage alerts, and
issue property set commands directly from the browser.

**TimescaleDB** stores all relational data (devices, nodes, properties, feeds,
reports) and typed time-series hypertables for each Homie datatype (float,
integer, boolean, string, enum, JSON).

## Repository Structure

```
.
├── docker/                  # Docker auxiliary config files
│   └── configs/mosquitto/   # Mosquitto broker configuration
├── packages/
│   ├── apps/
│   │   ├── control/         # @grovekit/control — management dashboard
│   │   └── scribe/          # @grovekit/scribe  — data ingestion service
│   └── libs/
│       ├── database/        # @grovekit/database — shared data-access layer
│       └── utils/           # @grovekit/utils    — shared utilities
├── docker-compose.yml       # Full-stack deployment configuration
├── Dockerfile               # Multi-stage build for both apps
├── package.json             # Root workspace manifest
├── tsconfig.base.jsonc      # Shared TypeScript base configuration
└── tsconfig.build.json      # Composite build entry point
```

## Prerequisites

- [Docker] and [Docker Compose] (v2+)
- A `.env` file at the repository root (copy from `.env-example`)

## Quick Start

```sh
# 1. Clone the repository
git clone https://github.com/grovekit/grovekit.git
cd grovekit

# 2. Create and edit your environment file
cp .env-example .env

# 3. If you do not have a broker already
docker compose --profile broker up

# 4. Build and start all services in the background
docker compose up --build -d

# 5. Open the Control dashboard at http://localhost:8080
#    URL may change dependending on your environment variables
```

The stack starts three containers:

| Container | Role | Default exposed port |
| --- | --- | --- |
| `timescaledb` | Database | `GK_TSCALE_BIND_PORT` |
| `control` | Management dashboard | `GK_DASH_BIND_PORT` |
| `scribe` | Data ingestion | _(none)_ |

Additionally, step 3. starts the `mosquitto` container:

| Container | Role | Default exposed port |
| --- | --- | --- |
| `mosquitto` | MQTT broker | `GK_BROKER_BIND_PORT` |

## Environment Variables

All variables are read from the environment (or the `.env` file when running
via Docker Compose).

### Docker Compose host-binding variables

These control which host address and port each container service is bound to
on the Docker host. They are **only** used by `docker-compose.yml`.

| Variable | Default | Description |
| --- | --- | --- |
| `GK_BROKER_BIND_ADDR` | `127.0.0.1` | Host address to expose the MQTT broker on |
| `GK_BROKER_BIND_PORT` | `1883` | Host port to expose the MQTT broker on |
| `GK_TSCALE_BIND_ADDR` | `127.0.0.1` | Host address to expose TimescaleDB on |
| `GK_TSCALE_BIND_PORT` | `5432` | Host port to expose TimescaleDB on |
| `GK_DASH_BIND_ADDR` | `127.0.0.1` | Host address to expose the Control dashboard on |
| `GK_DASH_BIND_PORT` | `8080` | Host port to expose the Control dashboard on |

### Application runtime variables

These are passed into the `control` and `scribe` containers (and used directly
when running outside Docker).

| Variable | Default | Description |
| --- | --- | --- |
| `GK_LOG_LEVEL` | `info` | Log verbosity: `trace`, `debug`, `info`, `warn`, or `error` |
| `GK_DASH_BIND_ADDR` | `localhost` | Address the Control HTTP server listens on inside its container |
| `GK_DASH_BIND_PORT` | `8080` | Port the Control HTTP server listens on inside its container |
| `GK_DB_HOSTNAME` | `localhost` | TimescaleDB hostname |
| `GK_DB_PORT` | `5432` | TimescaleDB port |
| `GK_DB_DATABASE` | `grovekit` | Database name |
| `GK_DB_USERNAME` | _(none)_ | Database username |
| `GK_DB_PASSWORD` | _(none)_ | Database password |
| `GK_BROKER_HOSTNAME` | `localhost` | MQTT broker hostname |
| `GK_BROKER_PORT` | `1883` | MQTT broker port |
| `GK_BROKER_PROTOCOL` | `3` | MQTT protocol version (`3` or `5`) |
| `GK_BROKER_CLIENTID` | _(none)_ | MQTT client ID (auto-generated if omitted) |
| `GK_BROKER_USERNAME` | _(none)_ | MQTT broker username |
| `GK_BROKER_PASSWORD` | _(none)_ | MQTT broker password |

## Development

Pre-requisites:

- [Node.js] 24 or later
- A running [TimescaleDB] instance (PostgreSQL 17 + TimescaleDB 2.x)
- A running MQTT broker compatible with the [Homie MQTT convention]

To install dependencies and build the project:

```sh
npm install        # Install dependencies
npm run ts:build   # Build all packages
npm run ts:watch   # Watch mode (incremental rebuild)
npm run ts:clean   # Clean build artifacts
```

### Workspace layout

This is an npm workspaces monorepo. Each package under `packages/` is an
independent workspace that can be built and tested on its own. The root
`tsconfig.build.json` orchestrates a composite TypeScript build across all
packages in dependency order.

## License

[MIT](./LICENSE)


[Grovekit]: https://github.com/grovekit
[Homie MQTT convention]: https://homieiot.github.io
[Node.js]: https://nodejs.org
[TypeScript]: https://www.typescriptlang.org
[Hono]: https://hono.dev
[TimescaleDB]: https://github.com/timescale/timescaledb
[postgres.js]: https://github.com/porsager/postgres
[Kysely]: https://github.com/kysely-org/kysely
[Mosquitto]: https://mosquitto.org
[Docker]: https://www.docker.com
[Docker Compose]: https://docs.docker.com/compose/
