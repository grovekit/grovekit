
import { ArrayOrNot, TypedJSON } from '@grovekit/utils';
import { DB } from '../client.js';
import { Datatype } from '@grovekit/homie-core';

export interface BaseDatapoint {
  f: number;
  t: number;
}

export interface DatapointInteger extends BaseDatapoint {
  v: number;
}

export interface DatapointFloat extends BaseDatapoint {
  v: number;
}

export interface DatapointBoolean extends BaseDatapoint {
  v: boolean;
}

export interface DatapointString extends BaseDatapoint {
  v: string;
}

export interface DatapointEnum extends BaseDatapoint {
  v: number; // smallint
}

export interface DatapointColor extends BaseDatapoint {
  s: 'rgb' | 'hsv';
  v: string; // short string
}

export interface DatapointDatetime extends BaseDatapoint {
  v: string; // timestamptz
}

export interface DatapointDuration extends BaseDatapoint {
  v: string; // interval
}

export interface DatapointJson extends BaseDatapoint {
  v: TypedJSON<any>; // interval
}

export const insertDatapointFloat = async (db: DB, points: ArrayOrNot<DatapointFloat>) => {
  await db.insertInto('datapoints_float').values(points).execute();
};

export const selectDatapointsFloat = async (db: DB, feed_id: number, from: number, to: number, dir: 'asc' | 'desc') => {
  return db.selectFrom('datapoints_float as df')
    .where('df.t', '>=', from)
    .where('df.t', '<', to)
    .where('df.f', '=', feed_id)
    .orderBy('df.t', dir);
};

export const insertDatapointEnum = async (db: DB, points: ArrayOrNot<DatapointEnum>) => {
  await db.insertInto('datapoints_enum').values(points).execute();
};

export const selectDatapointsEnum = async (db: DB, feed_id: number, from: number, to: number, dir: 'asc' | 'desc') => {
  return db.selectFrom('datapoints_enum as de')
    .where('de.t', '>=', from)
    .where('de.t', '<', to)
    .where('de.f', '=', feed_id)
    .orderBy('de.t', dir);
};

export const insertDatapointInteger = async (db: DB, points: ArrayOrNot<DatapointInteger>) => {
  await db.insertInto('datapoints_integer').values(points).execute();
};

export const selectDatapointsInteger = async (db: DB, feed_id: number, from: number, to: number, dir: 'asc' | 'desc') => {
  return db.selectFrom('datapoints_integer as di')
    .where('di.t', '>=', from)
    .where('di.t', '<', to)
    .where('di.f', '=', feed_id)
    .orderBy('di.t', dir);
};

export const insertDatapointBoolean = async (db: DB, points: ArrayOrNot<DatapointBoolean>) => {
  await db.insertInto('datapoints_bool').values(points).execute();
};

export const selectDatapointsBoolean = async (db: DB, feed_id: number, from: number, to: number, dir: 'asc' | 'desc') => {
  return db.selectFrom('datapoints_bool as db')
    .where('db.t', '>=', from)
    .where('db.t', '<', to)
    .where('db.f', '=', feed_id)
    .orderBy('db.t', dir);
};

export const insertDatapointJson = async (db: DB, points: ArrayOrNot<DatapointJson>) => {
  await db.insertInto('datapoints_json').values(points).execute();
};

export const selectDatapointsJson = async (db: DB, feed_id: number, from: number, to: number, dir: 'asc' | 'desc') => {
  return db.selectFrom('datapoints_json as dj')
    .where('dj.t', '>=', from)
    .where('dj.t', '<', to)
    .where('dj.f', '=', feed_id)
    .orderBy('dj.t', dir);
};

export const insertDatapointString = async (db: DB, points: ArrayOrNot<DatapointString>) => {
  await db.insertInto('datapoints_string').values(points).execute();
};

export const selectDatapointsString = async (db: DB, feed_id: number, from: number, to: number, dir: 'asc' | 'desc') => {
  return db.selectFrom('datapoints_string as ds')
    .where('ds.t', '>=', from)
    .where('ds.t', '<', to)
    .where('ds.f', '=', feed_id)
    .orderBy('ds.t', dir);
};

export const selectFeedDatapoints = async (db: DB, feed_id: number, datatype: Datatype, from: number, to: number, dir: 'asc' | 'desc') => {
  switch (datatype) {
    case 'float':
      return selectDatapointsFloat(db, feed_id, from, to, dir);
    case 'integer':
      return selectDatapointsInteger(db, feed_id, from, to, dir);
    case 'string':
      return selectDatapointsString(db, feed_id, from, to, dir);
    case 'enum':
      return selectDatapointsEnum(db, feed_id, from, to, dir);
    case 'json':
      return selectDatapointsJson(db, feed_id, from, to, dir);
    default:
      throw new Error(`Unsupported datatype: ${datatype}`);
  }
};
