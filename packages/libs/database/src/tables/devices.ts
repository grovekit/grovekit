
import { DB } from '../client.js';
import { Insertable, Updateable } from 'kysely';
import { Selectable } from 'kysely';
import { SelectOpts } from '../types.js';
import { DEVICE_STATE } from '@grovekit/homie-core';

export interface Device {
  id: string;
  name: string | null;
  type: string | null;
  root_id: string | null;
  parent_id: string | null;
  homie_id: string;
  homie_prefix: string;
  // h_info: JSONColumnType<DeviceDescription | null, TypedJSON<DeviceDescription> | null>;
  state: DEVICE_STATE | null;
  info_fid: number;
  state_fid: number;
  updated_at: number;
  open_alerts: number;
  total_alerts: number;
};

export type SelectableDevice = Selectable<Device>;
export type InsertableDevice = Insertable<Device>;
export type UpdateableDevice = Updateable<Device>;

export interface SelectDevicesOpts extends SelectOpts<Device, 'name' | 'state' | 'open_alerts' | 'total_alerts' | 'homie_prefix'> {
  state?: DEVICE_STATE;
}

export const insertDevice = async (db: DB, device: InsertableDevice): Promise<SelectableDevice> => {
  return await db.insertInto('devices')
    .values(device)
    .returningAll()
    .executeTakeFirstOrThrow();
};

const getSelectDevicesQuery = (db: DB, opts?: SelectDevicesOpts) => {
  let query = db.selectFrom('devices as d')
  if (opts?.order_by) {
    query = query.orderBy(opts.order_by, opts.order_dir ?? 'asc');
  }
  if (opts?.limit) {
    query = query.limit(opts.limit);
  }
  if (opts?.offset) {
    query = query.offset(opts.offset);
  }
  if (opts?.state) {
    query = query.where('state', '=', opts.state);
  }
  return query;
};

export const countDevices = async (db: DB, opts?: SelectDevicesOpts): Promise<number> => {
  const query = getSelectDevicesQuery(db, opts)
    .select(eb => eb.fn.count('id').as('count'));
  const { count } = await query.executeTakeFirstOrThrow();
  return count as number;
};

export const selectDevices = async (db: DB, opts?: SelectDevicesOpts): Promise<SelectableDevice[]> => {
  const query = getSelectDevicesQuery(db, opts)
    .selectAll('d');
  return await query.execute();
};

export const updateDeviceById = async (db: DB, id: string, patch: Omit<UpdateableDevice, 'id'>): Promise<SelectableDevice> => {
  return await db.updateTable('devices')
    .where('id', '=', id)
    .set(patch)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const selectDeviceById = async (db: DB, id: string): Promise<SelectableDevice | undefined> => {
  return await getSelectDevicesQuery(db)
    .where('id', '=', id)
    .limit(1)
    .selectAll('d')
    .executeTakeFirst();
};

export const selectDeviceByHomieId = async (db: DB, homie_prefix: string, homie_id: string): Promise<SelectableDevice | undefined> => {
  return await getSelectDevicesQuery(db)
    .where('homie_prefix', '=', homie_prefix)
    .where('homie_id', '=', homie_id)
    .limit(1)
    .selectAll('d')
    .executeTakeFirst();
};
