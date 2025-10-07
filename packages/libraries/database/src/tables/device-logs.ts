
import { DB } from '../client.js';
import { Insertable, Updateable } from 'kysely';
import { Selectable } from 'kysely';
import { LOG_LEVEL } from '@grovekit/homie-core';

export interface DeviceLog {
  device_id: string;
  level: LOG_LEVEL;
  message: string;
  logged_at: number;
};

export type SelectableDeviceLog = Selectable<DeviceLog>;
export type InsertableDeviceLog = Insertable<DeviceLog>;
export type UpdateableDeviceLog = Updateable<DeviceLog>;

export const insertDeviceLog = async (db: DB, log: InsertableDeviceLog): Promise<SelectableDeviceLog> => {
  return await db.insertInto('device_logs')
    .values(log)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export interface SelectDeviceLogsOpts {
  offset?: number;
  limit?: number;
  levels?: LOG_LEVEL[];
}

const getSelectDeviceLogsQuery = (db: DB, device_id: string, opts?: SelectDeviceLogsOpts) => {
  let query = db.selectFrom('device_logs')
    .where('device_id', '=', device_id);
  if (opts?.offset) {
    query = query.offset(opts.offset);
  }
  if (opts?.limit) {
    query = query.limit(opts.limit);
  }
  if (opts?.levels && opts?.levels.length > 0) {
    query = query.where('level', 'in', opts.levels);
  }

  return query;
};

export const countDeviceLogsByDeviceId = async (db: DB, device_id: string, opts?: Omit<SelectDeviceLogsOpts, 'offset' | 'limit'>): Promise<number> => {
  const { count } = await getSelectDeviceLogsQuery(db, device_id, opts)
    .select(eb  => eb.fn.countAll().as('count'))
    .executeTakeFirstOrThrow();
  return count as number;
};

export const selectDeviceLogsByDeviceId = async (db: DB, device_id: string, opts?: SelectDeviceLogsOpts): Promise<SelectableDeviceLog[]> => {
  return await getSelectDeviceLogsQuery(db, device_id, opts)
    .orderBy('logged_at', 'desc')
    .selectAll()
    .execute();
};
