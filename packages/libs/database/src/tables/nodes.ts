
import { DB } from '../client.js';
import { Insertable, JSONColumnType, Updateable } from 'kysely';
import { Selectable } from 'kysely';
import { TypedJSON } from '@grovekit/utils';

export interface Node {
  id: string;
  device_id: string;
  homie_id: string;
  name: string | null;
  // h_info: JSONColumnType<NodeDescription, TypedJSON<NodeDescription>>;
}

export type SelectableNode = Selectable<Node>;
export type InsertableNode = Insertable<Node>;
export type UpdateableNode = Updateable<Node>;

export const insertNode = async (db: DB, node: InsertableNode): Promise<SelectableNode> => {
  return await db.insertInto('nodes')
    .values(node)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const selectNodeById = async (db: DB, id: string): Promise<SelectableNode | undefined> => {
  return await db.selectFrom('nodes')
    .where('id', '=', id)
    .limit(1)
    .selectAll()
    .executeTakeFirst();
};

export const updateNodeById = async (db: DB, id: string, patch: Omit<UpdateableNode, 'id'>): Promise<SelectableNode> => {
  return await db.updateTable('nodes')
    .where('id', '=', id)
    .set(patch)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const selectNodesByDeviceId = async (db: DB, device_id: string): Promise<SelectableNode[]> => {
  return await db.selectFrom('nodes')
    .where('device_id', '=', device_id)
    .selectAll()
    .execute();
};

export const selectNodeByDeviceAndHomieId = async (db: DB, device_id: string, homie_id: string): Promise<SelectableNode | undefined> => {
  return await db.selectFrom('nodes')
    .where('device_id', '=', device_id)
    .where('homie_id', '=', homie_id)
    .limit(1)
    .selectAll()
    .executeTakeFirst();
};
