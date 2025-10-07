
# GROVEKIT

Lightweight, self-hosted, opinionated IoT stack built on the
[Homie MQTT convention][homie], [Node.js] and [TypeScript].

## Table of Contents

- [Goals](#goals)
- [Components](#components)
- [Quick start](#quick-start)
- [Building](#building)
- [Dependencies](#dependencies)
- [License](#license)

## Goals

Ultimately, the goal of Grovekit is to provide an IoT stack that can be
easily grasped in its entirety, dependencies included, by a single person.
This is primarily achieved through the adoption of development practices
that _minimize mental and technical overheads_, including (but not limited
to):

- **Vertical integration**: though published as individual packages, all
  components of Grovekit's stack are type-checked and compiled as a cohesive
  unit. Additionally, _type-driven data validation_ is applied to all I/O
  throughout the stack, ensuring that run-time data shapes match compile-time
  assumptions. This ensures that the stack is always in a consistent state.

- **No frontend/backend separation**: all web-based interfaces are rendered
  server-side, eliminating the mental burden of maintaining separate codebases
  and the performance bottlenecks of intermediate data serializations.
  Client-side JavaScript is only used when strictly necessary and kept strictly
  vanilla, with no need for separate build steps.

- **Manageable dependencies**: the entire stack has a total of 37 run-time
  dependencies, _including indirect ones_. The overall dependency count,
  including build-time dependencies, sits at 72 dependencies. A dependency
  graph of this size enables human review, which is crucial for ensuring
  long-term quality, maintainability, security. Additionally, it fosters
  familiarity, which in turn increases the chances of contributing patches
  upstream.

- **Fewer layers of abstraction**: the stack is tightly coupled to the MQTT
  protocol and [TimescaleDB]. Maintaining an opinionated codebase eliminates
  the need for abstractions like ORMs and surfaces the full extent of MQTT's
  and TimescaleDB's capabilities at the application level.

- **Efficiency before scaling**: given that scalability imposes much greater
  complexity requirements than efficiency, the primary strategy for improving
  the stack's performance is to make it more efficient, resorting to scaling
  only when efficiency cannot be reasonably increased any further.

## Components

Grovekit provides the following services:

- **Control**: management dashboard for browsing, monitoring and controlling
  connected devices.
  See [./packages/services/control](./packages/services/control).
- **Scribe**: background service that keeps track of changes in the state of
  connected devices.
  See [./packages/services/scribe](./packages/services/scribe).

Grovekit also provides the following libraries:

- **homie-client**: a library for publishing and interacting with devices
  implementing the [Homie MQTT convention][homie] via a shared MQTT broker.
  See [./packages/libraries/homie-client](./packages/libraries/homie-client).

## Quick start

TBD

## Building

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



## Dependencies

Grovekit would not be possible without an ecosystem of open-source projects
that share some or all of its underlying principles. Honorable mentions
include, but are not limited to:

- **[hono]**: HTTP framework
- **[kysely]**: query builder
- **[opifex]**: MQTT client
- **[postgres.js]**: PostgreSQL client
- **[@deepkit/type]**: runtime type system

All of these packages have minimal dependency counts (usually zero) and a
strong focus on performance and user experience.

## License

Grovekit is licensed under the MIT License. See the [LICENSE] file for details.

## Author

Grovekit is developed by [jacoscaz](https://github.com/jacoscaz). Contributions
are welcome and encouraged.

[homie]: https://homieiot.github.io
[hono]: https://hono.dev
[TimescaleDB]: https://github.com/timescale/timescaledb
[postgres.js]: https://github.com/porsager/postgres
[kysely]: https://github.com/kysely-org/kysely
[opifex]: https://github.com/seriousme/opifex
[LICENSE]: ./LICENSE
[Node.js]: https://nodejs.org
[TypeScript]: https://www.typescriptlang.org
