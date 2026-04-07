# @grovekit/scribe

Headless background service for the [Grovekit] IoT stack. Connects to an MQTT
broker via the [Homie MQTT convention] and durably persists all device state
changes, property value updates, log messages, and alerts into [TimescaleDB].

> Part of the [`grovekit/grovekit`](https://github.com/grovekit/grovekit)
> monorepo. See the root [README](../../README.md) for setup and deployment
> instructions.

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Data Model](#data-model)
- [Configuration](#configuration)
- [Usage](#usage)
- [Development](#development)
- [Dependencies](#dependencies)

## Features

- **Homie auto-discovery** — automatically discovers all devices, nodes, and
  properties advertising themselves on the `homie/` MQTT topic prefix.
- **Device state tracking** — records every device lifecycle state transition
  (`init`, `ready`, `sleeping`, `lost`, `disconnected`) to the database.
- **Device info ingestion** — parses and stores the full Homie device
  description (nodes, properties, datatypes, units, settable/retained flags)
  whenever a device publishes its `$description`.
- **Typed datapoint ingestion** — routes each incoming property value and
  property target update to the correct typed time-series table
  (`float`, `integer`, `boolean`, `string`, `enum`, `json`) based on the
  property's declared Homie datatype.
- **Batch ingestion** — datapoints are accumulated in in-memory batches and
  flushed to the database in bulk, reducing per-message round-trip overhead.
- **Device log ingestion** — stores log messages published by devices via the
  Homie `$log` extension.
- **Alert ingestion** — tracks open and closed device alerts published via the
  Homie `$alert` extension, maintaining per-device open and total alert counts.
- **LRU caching** — frequently-accessed feed and device records are cached in
  memory (60 s TTL, up to 10 000 entries each) to avoid redundant database
  lookups on hot MQTT topics.
- **Automatic database migration** — applies any pending [TimescaleDB]
  migrations at startup before subscribing to the broker.

## Configuration

Scribe is configured entirely through environment variables.

| Variable | Default | Description |
| --- | --- | --- |
| `GK_LOG_LEVEL` | `info` | Log verbosity: `trace`, `debug`, `info`, `warn`, or `error` |
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

## Usage

See the root [README](../../README.md#quick-start) for the full Docker Compose
deployment. Scribe starts automatically after TimescaleDB is available and
Control has completed the database migrations.

## Dependencies

| Package | Role |
| --- | --- |
| [@grovekit/homie-client] | Homie MQTT client — auto-discovery, device/property event callbacks |
| [@grovekit/database] | Data-access layer — device upserts, feed lookups, datapoint inserts, alert management |
| [@grovekit/utils] | Shared utilities — config, logging, `BatchWorker` |
| [@grovekit/homie-core] | Homie type definitions and topic utilities |
| [lru-cache] | In-memory caching of feed and device records |
| [debug] | Scoped debug logging |

## License

[MIT](./LICENSE)


[Grovekit]: https://github.com/grovekit
[Homie MQTT convention]: https://homieiot.github.io
[TimescaleDB]: https://github.com/timescale/timescaledb
[Node.js]: https://nodejs.org
[TypeScript]: https://www.typescriptlang.org
[@grovekit/homie-client]: https://github.com/grovekit/homie-client
[@grovekit/homie-core]: https://github.com/grovekit/homie-core
[@grovekit/database]: ../../libs/database
[@grovekit/utils]: ../../libs/utils
[lru-cache]: https://github.com/isaacs/node-lru-cache
[debug]: https://github.com/debug-js/debug
