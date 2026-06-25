# @grovekit/database

Shared data-access library for the [Grovekit] IoT stack. Provides a
type-safe query builder, a migration runner, and high-level service functions
for all persistent data: devices, nodes, properties, feeds, typed time-series
datapoints, reports, logs, and alerts.

Built on [Kysely] (SQL query builder), [postgres.js] (PostgreSQL client), and
[TimescaleDB] (time-series extension for PostgreSQL).

> Part of the [`grovekit/grovekit`](https://github.com/grovekit/grovekit)
> monorepo. See the root [README](../../README.md) for setup and deployment
> instructions.

## Table of Contents

- [Features](#features)
- [API](#api)
  - [Client](#client)
  - [Migrations](#migrations)
  - [Tables](#tables)
  - [Services](#services)
- [CLI Utilities](#cli-utilities)
- [Usage](#usage)
- [Development](#development)
- [Dependencies](#dependencies)

## Features

- **Type-safe queries** — every table is fully typed via Kysely's generic
  `Tables` interface; all select, insert, update, and delete operations carry
  compile-time guarantees.
- **Automatic migrations** — a [Kysely]-based migration runner applies pending
  SQL migrations in order at application startup.
- **TimescaleDB hypertables** — time-series datapoints for each Homie datatype
  are stored in dedicated hypertables, enabling efficient range queries and
  aggregations via TimescaleDB's `time_bucket_gapfill`.
- **Multi-feed queries** — the `multifeed` service can query and aggregate data
  from multiple feeds of different datatypes in a single SQL statement,
  returning results in either row or columnar format.
- **Transaction helpers** — `ensureTrx` wraps any operation in a transaction
  (or joins an existing one), and `isTrx` / `ensureNoTrx` guard against
  accidental nesting.
- **Runtime type validation** — environment inputs and configuration shapes are
  validated at runtime via [@runtyped/type].

### Feed types

```ts
enum FeedType {
  DEVICE_STATE,    // homie/<device>/$state
  DEVICE_INFO,     // homie/<device>/$description
  PROPERTY_VALUE,  // homie/<device>/<node>/<property>
  PROPERTY_TARGET, // homie/<device>/<node>/<property>/target
  PROPERTY_SET,    // homie/<device>/<node>/<property>/set
}
```

## API

### Client

```ts
import { getDB, DB } from '@grovekit/database';

const db = await getDB({
  hostname: 'localhost',
  port: 5432,
  database: 'grovekit',
  username: 'grovekit',
  password: 'grovekit',
});
```

`getDB` returns a `Kysely<Tables>` instance configured with a [postgres.js]
dialect and custom type serializers/parsers for `timestamp`, `timestamptz`,
`json`, `jsonb`, and `bigint` columns.

#### Transaction helpers

```ts
import { ensureTrx, isTrx, ensureNoTrx } from '@grovekit/database';

// Wrap work in a transaction (or join an existing one):
const result = await ensureTrx(db, async (trx) => {
  // ...
});

// Assert that db is not already a transaction:
const kysely = ensureNoTrx(db);
```

### Migrations

```ts
import { migrateToLatest, dropAllTables } from '@grovekit/database';
import { Logger } from '@grovekit/utils';

const logger = new Logger({ level: 'info' });

// Apply all pending migrations:
await migrateToLatest(db, logger);

// Drop all managed tables (destructive — use with caution):
await dropAllTables(db);
```

Migrations live in `src/migrations/` and are applied in filename order by
Kysely's `FileMigrationProvider`.

### Tables

Each table module exports typed insert/select/update/delete helpers and the
corresponding `Insertable*`, `Selectable*`, and `Updateable*` types derived
from Kysely.

#### `devices`

```ts
import {
  insertDevice,
  selectDeviceById,
  selectDeviceByHomieId,
  updateDeviceById,
  SelectableDevice,
} from '@grovekit/database';
```

#### `nodes`

```ts
import {
  insertNode,
  selectNodesByDeviceId,
  selectNodeByDeviceAndHomieId,
  updateNodeById,
} from '@grovekit/database';
```

#### `properties`

```ts
import {
  insertProperty,
  selectPropertyById,
  selectPropertyByNodeAndHomieId,
  updatePropertyById,
} from '@grovekit/database';
```

#### `feeds`

```ts
import {
  FeedType,
  insertFeed,
  selectFeedByTypeAndTopic,
  updateFeedById,
  SelectableFeed,
} from '@grovekit/database';
```

#### `datapoints`

```ts
import {
  insertDatapointFloat,
  insertDatapointInteger,
  insertDatapointBoolean,
  insertDatapointString,
  insertDatapointEnum,
  insertDatapointJson,
  type DatapointFloat,
  type DatapointInteger,
  type DatapointBoolean,
  type DatapointString,
  type DatapointEnum,
  type DatapointJson,
} from '@grovekit/database';
```

Each `insertDatapoint*` function accepts an array of datapoints for bulk
insertion:

```ts
await insertDatapointFloat(db, [
  { f: feedId, t: Date.now(), v: 23.4 },
  { f: feedId, t: Date.now() + 1000, v: 23.7 },
]);
```

#### `device_logs` and `device_alerts`

```ts
import {
  insertDeviceLog,
  insertDeviceAlert,
  selectDeviceAlertByDeviceIdAndAlertId,
  updateDeviceAlertByDeviceIdAndAlertId,
  countDeviceAlerts,
  ALERT_STATUS,
} from '@grovekit/database';
```

#### `reports`

```ts
import {
  insertReport,
  selectReportById,
  selectReportProperties,
  insertReportProperty,
  updateReportById,
  updateReportPropertyById,
  deleteReportById,
  deleteReportPropertiesByReportId,
} from '@grovekit/database';
```

### Services

Higher-level functions that coordinate multiple table operations within a
single transaction.

#### `devices` service

```ts
import {
  ingestDeviceState,
  ingestDeviceInfo,
  registerDevice,
  registerDeviceNodesAndProperties,
} from '@grovekit/database';

// Called by Scribe when a $state message arrives:
await ingestDeviceState(db, parsedTopic, 'ready');

// Called by Scribe when a $description message arrives:
await ingestDeviceInfo(db, parsedTopic, deviceDescription);
```

`ingestDeviceInfo` upserts the device, all of its nodes, and all of their
properties, creating or updating the corresponding feed records as needed.

#### `alerts` service

```ts
import { ingestDeviceAlert } from '@grovekit/database';

// Opens, updates, or closes an alert; recalculates device alert counters:
await ingestDeviceAlert(db, deviceHomieId, alertId, message);
```

Passing `$null` (the Homie null sentinel) as `message` closes the alert.

#### `reports` service

```ts
import { addPropertiesToReport, removeReport, updateReportOpts } from '@grovekit/database';

// Add one or more properties to a report:
await addPropertiesToReport(db, reportId, [propertyId1, propertyId2]);

// Update report settings and per-series options:
await updateReportOpts(db, reportId, { title, timezone, from, to, aggr_win }, series);

// Delete a report and all its series:
await removeReport(db, reportId);
```

#### `multifeed` service

```ts
import {
  queryMultiFeed,
  queryMultiFeedColumnar,
  queryMultiFeedWithAggregation,
  queryMultiFeedWithAggregationColumnar,
  type FeedOpts,
  type FeedOptsWithAggr,
  type AggregationOp,
  type AggregationUnit,
  type AggregationWindow,
} from '@grovekit/database';

const feeds: FeedOpts[] = [
  { feed_id: 1, datatype: 'float' },
  { feed_id: 2, datatype: 'integer' },
];

// Raw datapoints, row format:
const rows = await queryMultiFeed(db, from, to, 'asc', feeds);
// rows: [{ t: number, v1: number|null, v2: number|null }, ...]

// Raw datapoints, columnar format (for charting):
const [timestamps, ...columns] = await queryMultiFeedColumnar(db, from, to, 'asc', feeds);

// Aggregated datapoints (requires float or integer feeds):
const aggrFeeds: FeedOptsWithAggr[] = [
  { feed_id: 1, datatype: 'float', aggr_op: 'avg', aggr_unit: 'hour' },
];
const aggregated = await queryMultiFeedWithAggregation(
  db, from, to, 'asc', 'day', aggrFeeds
);
```

Aggregated queries use TimescaleDB's `time_bucket_gapfill` function. Supported
aggregation operations: `avg`, `sum`, `min`, `max`. Supported aggregation
windows: `second`, `minute`, `hour`, `day`, `week`, `month`, `year`.

## Dependencies

| Package | Role |
| --- | --- |
| [kysely] | Type-safe SQL query builder |
| [kysely-postgres-js] | Kysely dialect adapter for postgres.js |
| [postgres.js] | PostgreSQL client |
| [@grovekit/homie-core] | Homie type definitions (datatypes, topic shapes) |
| [@grovekit/utils] | Shared utilities — logging, ID generation, typed JSON |
| [@runtyped/type] | Runtime type validation |

## License

[MIT](./LICENSE)


[Grovekit]: https://github.com/grovekit
[TimescaleDB]: https://github.com/timescale/timescaledb
[Kysely]: https://github.com/kysely-org/kysely
[postgres.js]: https://github.com/porsager/postgres
[kysely-postgres-js]: https://github.com/igalklebanov/kysely-postgres-js
[@grovekit/homie-core]: https://github.com/grovekit/homie-core
[@grovekit/utils]: ../utils
[@runtyped/type]: https://github.com/runtyped/runtyped
