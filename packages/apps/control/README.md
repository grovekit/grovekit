# @grovekit/control

Server-side-rendered management dashboard for the [Grovekit] IoT stack.
Connects to an MQTT broker via the [Homie MQTT convention] and to
[TimescaleDB] to provide a live, browser-based interface for monitoring and
controlling all connected Homie devices.

> Part of the [`grovekit/grovekit`](https://github.com/grovekit/grovekit)
> monorepo. See the root [README](../../README.md) for setup and deployment
> instructions.

## Table of Contents

- [Features](#features)
- [Configuration](#configuration)
- [Usage](#usage)
- [Dependencies](#dependencies)

## Features

- **Device list** — browse all auto-discovered Homie devices and their current
  connection state at a glance.
- **Device detail** — inspect every node and property of a device, view current
  values, and issue property set commands directly from the browser.
- **Live data feed** — real-time stream of incoming property value and target
  updates pushed to the browser as a server-sent event feed.
- **Alerts** — view open and historical alerts raised by devices via the Homie
  `$log/alert` extension.
- **Reports** — define named, configurable charts over any combination of
  device properties with configurable time ranges, aggregation windows
  (second / minute / hour / day / week / month / year), aggregation functions
  (avg / sum / min / max), per-series colours and labels, and IANA timezone
  support. Export any report as a CSV file.
- **Server-side rendering** — all HTML is rendered on the server using
  [Hono]'s JSX engine. Client-side JavaScript is kept to a strict minimum and
  is entirely vanilla.
- **Automatic database migration** — applies any pending [TimescaleDB]
  migrations at startup before accepting requests.

## Configuration

Control is configured entirely through environment variables.

| Variable | Default | Description |
| --- | --- | --- |
| `GK_LOG_LEVEL` | `info` | Log verbosity: `trace`, `debug`, `info`, `warn`, or `error` |
| `GK_DASH_BIND_ADDR` | `localhost` | Address the HTTP server listens on |
| `GK_DASH_BIND_PORT` | `8080` | Port the HTTP server listens on |
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
deployment.

## Dependencies

| Package | Role |
| --- | --- |
| [Hono] | HTTP framework and JSX-based server-side rendering |
| [@hono/node-server] | Node.js HTTP adapter for Hono |
| [@grovekit/homie-client] | Homie MQTT client — device and property discovery, property set commands |
| [@grovekit/database] | Data-access layer — devices, feeds, reports, datapoints, alerts |
| [@grovekit/utils] | Shared utilities — config, logging, datetime, TypedJSON |
| [date-fns] / [date-fns-tz] | Date formatting and timezone-aware rendering |
| [lru-cache] | In-memory caching of frequently-read database records |
| [csv-stringify] | Streaming CSV generation for report exports |
| [@deepkit/type] | Runtime type validation for environment variables and config |
| [debug] | Scoped debug logging |
| [loopyloop] | Resilient async event loops |
| [pinetto] | Structured logger (via `@grovekit/utils`) |
| [uid] | Short unique ID generation |
| [yurl] | URL construction utilities |

## License

[MIT](./LICENSE)


[Grovekit]: https://github.com/grovekit
[Homie MQTT convention]: https://homieiot.github.io
[Hono]: https://hono.dev
[TimescaleDB]: https://github.com/timescale/timescaledb
[Node.js]: https://nodejs.org
[TypeScript]: https://www.typescriptlang.org
[@grovekit/homie-client]: https://github.com/grovekit/homie-client
[@grovekit/database]: ../../libs/database
[@grovekit/utils]: ../../libs/utils
[@hono/node-server]: https://github.com/honojs/node-server
[date-fns]: https://date-fns.org
[date-fns-tz]: https://github.com/marnusw/date-fns-tz
[lru-cache]: https://github.com/isaacs/node-lru-cache
[csv-stringify]: https://csv.js.org/stringify
[@deepkit/type]: https://deepkit.io/en/documentation/runtime-types/getting-started
[debug]: https://github.com/debug-js/debug
[loopyloop]: https://github.com/nicolo-ribaudo/loopyloop
[pinetto]: https://github.com/nicolo-ribaudo/pinetto
[uid]: https://github.com/lukeed/uid
[yurl]: https://github.com/nicolo-ribaudo/yurl
