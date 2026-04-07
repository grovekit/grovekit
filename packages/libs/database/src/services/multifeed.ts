
import { Datatype } from '@grovekit/homie-core';
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

const getMultiFeedBaseQuery = (db: DB, from: number, to: number, dir: 'asc' | 'desc', feeds: FeedOpts[]): [string, string[]] => {
  assert(feeds.length > 0, 'No feeds provided');
  const vars = feeds.map((_, i) => `v${i + 1}`);
  const base = feeds.map((f, i) => `(
    select dp.t, ${vars.map((v, j) => i === j ? `dp.v as ${v}` : `null::float as ${v}`).join(', ')}
    from "${table_by_datatype[f.datatype]}" as dp
    where dp.f = ${f.feed_id}
    and dp.t >= ${from}
    and dp.t < ${to}
    order by dp.t ${dir}
  )`).join(' union ');
  const dedup = `
    select dd.t as t, ${vars.map(v => `max(dd.${v}) as ${v}`).join(', ')}
    from (${base}) as dd
    group by dd.t
    order by dd.t ${dir}
  `;
  return [dedup, vars];
};

export const queryMultiFeed = async (db: DB, from: number, to: number, dir: 'asc' | 'desc', feeds: FeedOpts[]): Promise<MultiFeed[]> => {
  const [base, vars] = getMultiFeedBaseQuery(db, from, to, dir, feeds);
  const query = `
    select u.t, ${vars.map(v => `u.${v}`).join(', ')}
    from (${base}) as u
    where ${vars.map(v => `u.${v} is not null`).join(' or ')}
    order by u.t ${dir}
  `;
  const { rows } = await sql.raw<MultiFeed>(query).execute(db);
  return rows;
}

export const queryMultiFeedColumnar = async (db: DB, from: number, to: number, dir: 'asc' | 'desc', feeds: FeedOpts[]): Promise<MultiFeedColumnar> => {
  const [base, vars] = getMultiFeedBaseQuery(db, from, to, dir, feeds);
  const query = `
    select array_agg(s.t) as t, ${vars.map(v => `array_agg(s.${v}) as ${v}`).join(', ')}
    from (
      select u.t, ${vars.map(v => `u.${v}`).join(', ')}
      from (${base}) as u
      where ${vars.map(v => `u.${v} is not null`).join(' or ')}
      order by u.t ${dir}
    ) as s
  `;
  const { rows: [ row ] } = await sql.raw<RawMultiFeedColumnar>(query).execute(db);
  return [row.t, ...vars.map(v => row[v as keyof RawMultiFeedColumnar])];
}

export interface FeedOptsWithAggr extends FeedOpts {
  datatype: 'integer' | 'float';
  aggr_op: AggregationOp;
  aggr_unit: AggregationUnit;
}

const makeAggrSelectColumn = (ref: string, op: AggregationOp, unit: AggregationUnit) => {
  switch (op) {
    case 'avg':
      return `avg(${ref})`;
    // case 'integral':
    //   return `integral(time_weight('locf', dp.t, ${ref}), ${unit})`;
    case 'max':
      return `max(${ref})`;
    case 'min':
      return `min(${ref})`;
    case 'sum':
      return `sum(${ref})`;
    default:
      throw new Error(`Unsupported aggregation operation: ${op}`);
  }
};


const getMultiFeedBaseAggrQuery = (db: DB, from: number, to: number, dir: 'asc' | 'desc', win: AggregationWindow, feeds: FeedOptsWithAggr[]): [string, string[]] => {
  assert(feeds.length > 0, 'No feeds provided');
  assert(!feeds.find(f => f.datatype !== 'float' && f.datatype !== 'integer'), 'Cannot apply aggregations on non-numerical feeds');
  const vars = feeds.map((_, i) => `v${i + 1}`);
  const base = feeds.map((f, i) => `(
    select time_bucket_gapfill(${AGGR_WINDOW_MILLIS[win]}, dp.t, start => ${from}, finish => ${to}) as _t,
    ${vars.map((v, j) => i === j ? `${makeAggrSelectColumn('dp.v', f.aggr_op, f.aggr_unit)} as ${v}` : `null::float as ${v}`).join(', ')}
    from "${table_by_datatype[f.datatype]}" as dp
    where dp.f = ${f.feed_id}
    and dp.t >= ${from}
    and dp.t < ${to}
    group by _t
    order by _t ${dir}
  )`).join(' union ');
  const dedup = `
    select dd._t as _t, ${vars.map(v => `max(dd.${v}) as ${v}`).join(', ')}
    from (${base}) as dd
    group by dd._t
    order by dd._t ${dir}
  `;
  return [dedup, vars];
};

export const queryMultiFeedWithAggregation = async (db: DB, from: number, to: number, dir: 'asc' | 'desc', win: AggregationWindow, feeds: FeedOptsWithAggr[]): Promise<MultiFeed[]> => {
  const [base, vars] = getMultiFeedBaseAggrQuery(db, from, to, dir, win, feeds);
  const query = `
    select u._t as t, ${vars.map(v => `u.${v} as ${v}`).join(', ')}
    from (${base}) as u
    where ${vars.map(v => `u.${v} is not null`).join(' or ')}
    order by t ${dir}
  `;
  const { rows } = await sql.raw<MultiFeed>(query).execute(db);
  return rows;
};

export const queryMultiFeedWithAggregationColumnar = async (db: DB, from: number, to: number, dir: 'asc' | 'desc', win: AggregationWindow, feeds: FeedOptsWithAggr[]): Promise<MultiFeedColumnar> => {
  const [base, vars] = getMultiFeedBaseAggrQuery(db, from, to, dir, win, feeds);
  const query = `
    select array_agg(s._t) as t, ${vars.map(v => `array_agg(s.${v}) as ${v}`).join(', ')}
    from (
      select u._t, ${vars.map(v => `u.${v}`).join(', ')}
      from (${base}) as u
      where ${vars.map(v => `u.${v} is not null`).join(' or ')}
      order by u._t ${dir}
    ) as s
  `;
  const { rows: [ row ] } = await sql.raw<RawMultiFeedColumnar>(query).execute(db);
  return [row.t, ...vars.map(v => row[v as keyof RawMultiFeedColumnar])];
};
