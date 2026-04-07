
import { GeneratedAlways } from 'kysely';
import { DB } from '../client.js';
import { Insertable, Selectable, Updateable } from 'kysely';
import { Datatype } from '@grovekit/homie-core';

export enum FeedType {
  DEVICE_INFO = 'device_info',
  DEVICE_STATE = 'device_state',
  PROPERTY_VALUE = 'property_value',
  PROPERTY_TARGET = 'property_target',
  PROPERTY_SET = 'property_set',
}

export interface Feed {
  id: GeneratedAlways<number>;
  type: FeedType;
  topic: string;
  datatype: Datatype;
}

export type SelectableFeed = Selectable<Feed>;
export type InsertableFeed = Insertable<Feed>;
export type UpdateableFeed = Updateable<Feed>;

export const insertFeed = async (db: DB, feed: InsertableFeed): Promise<SelectableFeed> => {
  return await db.insertInto('feeds')
    .values(feed)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const selectFeedById = async (db: DB, id: number): Promise<SelectableFeed | undefined> => {
  return await db.selectFrom('feeds')
    .where('id', '=', id)
    .limit(1)
    .selectAll()
    .executeTakeFirst();
};

export const selectFeedByTypeAndTopic = async (db: DB, type: FeedType, topic: string): Promise<SelectableFeed | undefined> => {
  return await db.selectFrom('feeds')
    .where('type', '=', type)
    .where('topic', '=', topic)
    .limit(1)
    .selectAll()
    .executeTakeFirst();
};

export const updateFeedById = async (db: DB, id: number, patch: Omit<UpdateableFeed, 'id'>): Promise<SelectableFeed> => {
  return await db.updateTable('feeds')
    .where('id', '=', id)
    .set(patch)
    .returningAll()
    .executeTakeFirstOrThrow();
};
