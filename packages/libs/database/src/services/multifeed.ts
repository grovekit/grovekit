import { Datatype } from '@grovekit/homie-core';
import { RawBuilder } from 'kysely';
import { DB, sql } from '../client.js';
import assert from 'node:assert';

export const AGGR_OPS: AggregationOp[] = ['avg', 'sum', 'min', 'max'/*, 'integral'*/];

export type AggregationOp = 'avg' | 'sum' | 'min' | 'max';

export const AGGR_UNITS: AggregationUnit[] = ['second', 'minute', 'hour'];

export type AggregationUnit = 'second' | 'minute' | 'hour';

export const AGGR_WINDOW: AggregationWindow[] = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year'];

export type AggregationWindow = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

const AGGR_WINDOW_MILLIS: Record<AggregationWindow, number> = {
  second: 1000,
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
};

const table_by_datatype = {
  float: 'datapoints_float',
  integer: 'datapoints_integer',
  string: 'datapoints_string',
  boolean: 'datapoints_boolean',
  enum: 'datapoints_enum',
  json: 'datapoints_json',
  color: 'datapoints_color',
  datetime: 'datapoints_datetime',
  duration: 'datapoints_duration',
} satisfies Record<Datatype, string>;

export interface FeedOpts {
  feed_id: number;
  datatype: Datatype;
}

export interface MultiFeed {
  t: number;
  [key: `v${number}`]: number | string | boolean | null;
}

export type ColumnarValues = (number | null)[] | (string | null)[] | (boolean | null)[];

export type MultiFeedColumnar = [t: number[], ...values: ColumnarValues[]];

interface RawMultiFeedColumnar {
  t: number[];
  [key: `v${number}`]: ColumnarValues;
}

/**
 * Safely returns a SQL direction keyword.
 */
const sqlDir = (dir: 'asc' | 'desc'): RawBuilder<unknown> => {
  if (dir === 'asc') return sql`asc`;
  if (dir === 'desc') return sql`desc`;
  throw new Error(`Invalid direction: ${dir}`);
};

/**
 * Safely returns a SQL table reference for the given datatype.
 */
const sqlTable = (datatype: Datatype): RawBuilder<unknown> => {
  const table = table_by_datatype[datatype];
  if (!table) throw new Error(`Invalid datatype: ${datatype}`);
  return sql.table(table);
};

/**
 * Builds the base multi-feed query that unions data from multiple feeds.
 */
const getMultiFeedBaseQuery = (from: number, to: number, dir: 'asc' | 'desc', feeds: FeedOpts[]): [RawBuilder<unknown>, string[]] => {
  assert(feeds.length > 0, 'No feeds provided');

  const vars = feeds.map((_, i) => `v${i + 1}`);
  const direction = sqlDir(dir);

  // Build each feed subquery
  const subqueries = feeds.map((f, i) => {
    const columns = vars.map((v, j) => {
      if (i === j) {
        return sql`dp.v as ${sql.id(v)}`;
      } else {
        return sql`null::float as ${sql.id(v)}`;
      }
    });

    return sql`(
      select dp.t, ${sql.join(columns, sql`, `)}
      from ${sqlTable(f.datatype)} as dp
      where dp.f = ${f.feed_id}
      and dp.t >= ${from}
      and dp.t < ${to}
      order by dp.t ${direction}
    )`;
  });

  const base = sql.join(subqueries, sql` union `);

  // Deduplicate by timestamp, taking max of each value column
  const dedupColumns = vars.map(v => sql`max(dd.${sql.id(v)}) as ${sql.id(v)}`);
  const dedup = sql`
    select dd.t as t, ${sql.join(dedupColumns, sql`, `)}
    from (${base}) as dd
    group by dd.t
    order by dd.t ${direction}
  `;

  return [dedup, vars];
};

export const queryMultiFeed = async (db: DB, from: number, to: number, dir: 'asc' | 'desc', feeds: FeedOpts[]): Promise<MultiFeed[]> => {
  const [base, vars] = getMultiFeedBaseQuery(from, to, dir, feeds);
  const direction = sqlDir(dir);

  const selectColumns = vars.map(v => sql`u.${sql.id(v)}`);
  const whereConditions = vars.map(v => sql`u.${sql.id(v)} is not null`);

  const query = sql<MultiFeed>`
    select u.t, ${sql.join(selectColumns, sql`, `)}
    from (${base}) as u
    where ${sql.join(whereConditions, sql` or `)}
    order by u.t ${direction}
  `;

  const { rows } = await query.execute(db);
  return rows;
};

export const queryMultiFeedColumnar = async (db: DB, from: number, to: number, dir: 'asc' | 'desc', feeds: FeedOpts[]): Promise<MultiFeedColumnar> => {
  const [base, vars] = getMultiFeedBaseQuery(from, to, dir, feeds);
  const direction = sqlDir(dir);

  const innerSelectColumns = vars.map(v => sql`u.${sql.id(v)}`);
  const whereConditions = vars.map(v => sql`u.${sql.id(v)} is not null`);
  const aggColumns = vars.map(v => sql`array_agg(s.${sql.id(v)}) as ${sql.id(v)}`);

  const query = sql<RawMultiFeedColumnar>`
    select array_agg(s.t) as t, ${sql.join(aggColumns, sql`, `)}
    from (
      select u.t, ${sql.join(innerSelectColumns, sql`, `)}
      from (${base}) as u
      where ${sql.join(whereConditions, sql` or `)}
      order by u.t ${direction}
    ) as s
  `;

  const { rows: [row] } = await query.execute(db);
  return [row.t, ...vars.map(v => row[v as keyof RawMultiFeedColumnar])] as MultiFeedColumnar;
};

export interface FeedOptsWithAggr extends FeedOpts {
  datatype: 'integer' | 'float';
  aggr_op: AggregationOp;
  aggr_unit: AggregationUnit;
}

/**
 * Returns the SQL aggregation expression for the given operation.
 */
const makeAggrSelectColumn = (ref: RawBuilder<unknown>, op: AggregationOp): RawBuilder<unknown> => {
  switch (op) {
    case 'avg':
      return sql`avg(${ref})`;
    case 'max':
      return sql`max(${ref})`;
    case 'min':
      return sql`min(${ref})`;
    case 'sum':
      return sql`sum(${ref})`;
    default:
      throw new Error(`Unsupported aggregation operation: ${op}`);
  }
};

/**
 * Validates and returns the aggregation window, throwing if invalid.
 */
const validateAggrWindow = (win: AggregationWindow): number => {
  const millis = AGGR_WINDOW_MILLIS[win];
  if (millis === undefined) throw new Error(`Invalid aggregation window: ${win}`);
  return millis;
};

/**
 * Builds the base multi-feed aggregation query.
 */
const getMultiFeedBaseAggrQuery = (from: number, to: number, dir: 'asc' | 'desc', win: AggregationWindow, feeds: FeedOptsWithAggr[]): [RawBuilder<unknown>, string[]] => {
  assert(feeds.length > 0, 'No feeds provided');
  assert(!feeds.find(f => f.datatype !== 'float' && f.datatype !== 'integer'), 'Cannot apply aggregations on non-numerical feeds');

  const vars = feeds.map((_, i) => `v${i + 1}`);
  const direction = sqlDir(dir);
  const windowMillis = validateAggrWindow(win);

  // Build each feed subquery with time bucketing
  const subqueries = feeds.map((f, i) => {
    const columns = vars.map((v, j) => {
      if (i === j) {
        const aggrExpr = makeAggrSelectColumn(sql`dp.v`, f.aggr_op);
        return sql`${aggrExpr} as ${sql.id(v)}`;
      } else {
        return sql`null::float as ${sql.id(v)}`;
      }
    });

    return sql`(
      select time_bucket_gapfill(${windowMillis}, dp.t, start => ${from}, finish => ${to}) as _t,
      ${sql.join(columns, sql`, `)}
      from ${sqlTable(f.datatype)} as dp
      where dp.f = ${f.feed_id}
      and dp.t >= ${from}
      and dp.t < ${to}
      group by _t
      order by _t ${direction}
    )`;
  });

  const base = sql.join(subqueries, sql` union `);

  // Deduplicate by time bucket, taking max of each value column
  const dedupColumns = vars.map(v => sql`max(dd.${sql.id(v)}) as ${sql.id(v)}`);
  const dedup = sql`
    select dd._t as _t, ${sql.join(dedupColumns, sql`, `)}
    from (${base}) as dd
    group by dd._t
    order by dd._t ${direction}
  `;

  return [dedup, vars];
};

export const queryMultiFeedWithAggregation = async (db: DB, from: number, to: number, dir: 'asc' | 'desc', win: AggregationWindow, feeds: FeedOptsWithAggr[]): Promise<MultiFeed[]> => {
  const [base, vars] = getMultiFeedBaseAggrQuery(from, to, dir, win, feeds);
  const direction = sqlDir(dir);

  const selectColumns = vars.map(v => sql`u.${sql.id(v)} as ${sql.id(v)}`);
  const whereConditions = vars.map(v => sql`u.${sql.id(v)} is not null`);

  const query = sql<MultiFeed>`
    select u._t as t, ${sql.join(selectColumns, sql`, `)}
    from (${base}) as u
    where ${sql.join(whereConditions, sql` or `)}
    order by t ${direction}
  `;

  const { rows } = await query.execute(db);
  return rows;
};

export const queryMultiFeedWithAggregationColumnar = async (db: DB, from: number, to: number, dir: 'asc' | 'desc', win: AggregationWindow, feeds: FeedOptsWithAggr[]): Promise<MultiFeedColumnar> => {
  const [base, vars] = getMultiFeedBaseAggrQuery(from, to, dir, win, feeds);
  const direction = sqlDir(dir);

  const innerSelectColumns = vars.map(v => sql`u.${sql.id(v)}`);
  const whereConditions = vars.map(v => sql`u.${sql.id(v)} is not null`);
  const aggColumns = vars.map(v => sql`array_agg(s.${sql.id(v)}) as ${sql.id(v)}`);

  const query = sql<RawMultiFeedColumnar>`
    select array_agg(s._t) as t, ${sql.join(aggColumns, sql`, `)}
    from (
      select u._t, ${sql.join(innerSelectColumns, sql`, `)}
      from (${base}) as u
      where ${sql.join(whereConditions, sql` or `)}
      order by u._t ${direction}
    ) as s
  `;

  const { rows: [row] } = await query.execute(db);
  return [row.t, ...vars.map(v => row[v as keyof RawMultiFeedColumnar])] as MultiFeedColumnar;
};
