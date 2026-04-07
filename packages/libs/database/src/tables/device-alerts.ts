
import { DB } from '../client.js';
import { Insertable, Updateable } from 'kysely';
import { Selectable } from 'kysely';
import { SelectOpts } from '../types.js';

export enum ALERT_STATUS {
  CLOSED = 'closed',
  OPEN = 'open',
}

export interface DeviceAlert {
  device_id: string;
  alert_id: string;
  message: string;
  status: ALERT_STATUS;
  created_at: number; // bigint
  updated_at: number; // bigint
};

export type SelectableDeviceAlert = Selectable<DeviceAlert>;
export type InsertableDeviceAlert = Insertable<DeviceAlert>;
export type UpdateableDeviceAlert = Updateable<DeviceAlert>;

export type ExtendedSelectableDeviceAlert = SelectableDeviceAlert & {
  device_name: string;
};

export const insertDeviceAlert = async (db: DB, log: InsertableDeviceAlert): Promise<SelectableDeviceAlert> => {
  return await db.insertInto('device_alerts')
    .values(log)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export interface SelectAlertsOpts extends SelectOpts<SelectableDeviceAlert, 'updated_at'> {
  device_id?: string;
  alert_id?: string;
  status?: ALERT_STATUS;
}

const getSelectDeviceAlertsQuery = (db: DB, opts?: SelectAlertsOpts) => {
  let query = db.selectFrom('device_alerts as da');
  if (opts?.device_id) {
    query = query.where('device_id', '=', opts.device_id);
  }
  if (opts?.alert_id) {
    query = query.where('alert_id', '=', opts.alert_id);
  }
  if (opts?.offset) {
    query = query.offset(opts.offset);
  }
  if (opts?.limit) {
    query = query.limit(opts.limit);
  }
   if (opts?.status) {
    query = query.where('status', '=', opts.status);
  }
  if (opts?.order_by) {
    query = query.orderBy(opts.order_by, opts.order_dir ?? 'desc');
  }
  return query;
};

export const countDeviceAlerts = async (db: DB, opts?: Omit<SelectAlertsOpts, 'offset' | 'limit'>): Promise<number> => {
  const { count } = await getSelectDeviceAlertsQuery(db, opts)
    .select(eb  => eb.fn.countAll('da').as('count'))
    .executeTakeFirstOrThrow();
  return count as number;
};

export const selectDeviceAlerts = async (db: DB, opts?: SelectAlertsOpts): Promise<ExtendedSelectableDeviceAlert[]> => {
  return (await getSelectDeviceAlertsQuery(db, opts)
    .orderBy('updated_at', 'desc')
    .innerJoin('devices as d', 'd.id', 'da.device_id')
    .selectAll('da')
    .select('d.name as device_name')
    .execute()) as ExtendedSelectableDeviceAlert[];
};

export const selectDeviceAlertByDeviceIdAndAlertId = async (db: DB, device_id: string, alert_id: string): Promise<SelectableDeviceAlert | undefined> => {
  return await getSelectDeviceAlertsQuery(db, { device_id, alert_id })
    .limit(1)
    .selectAll('da')
    .executeTakeFirst();
};

export const updateDeviceAlertByDeviceIdAndAlertId = async (db: DB, device_id: string, alert_id: string, patch: Pick<UpdateableDeviceAlert, 'status' | 'updated_at' | 'message'>): Promise<SelectableDeviceAlert> => {
  return await db.updateTable('device_alerts')
    .where('device_id', '=', device_id)
    .where('alert_id', '=', alert_id)
    .set({ status: patch.status, updated_at: patch.updated_at })
    .returningAll()
    .executeTakeFirstOrThrow();
};
