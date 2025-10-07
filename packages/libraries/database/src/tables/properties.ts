
import { Datatype } from '@grovekit/homie-core';
import { PropertyFormat } from '@grovekit/homie-core';
import { DB } from '../client.js';
import { Insertable, JSONColumnType, Updateable, Selectable, sql } from 'kysely';
import { TypedJSON } from '@grovekit/utils';
import { SelectOpts } from '../types.js';

export interface Property {
  id: string;
  device_id: string;
  node_id: string;
  name: string | null;
  homie_id: string;
  // info: JSONColumnType<PropertyDescription, TypedJSON<PropertyDescription>>;
  set_fid: number;
  value_fid: number;
  target_fid: number;
  unit: string | null;
  datatype: Datatype;
  settable: boolean;
  retained: boolean;
  format: JSONColumnType<PropertyFormat, TypedJSON<PropertyFormat>>;
}

export type SelectableProperty = Selectable<Property>;
export type InsertableProperty = Insertable<Property>;
export type UpdateableProperty = Updateable<Property>;

export type ExtendedSelectableProperty = SelectableProperty & {
  value: string | null;
  device_name: string | null;
};

export interface SelectPropertyOpts extends SelectOpts<SelectableProperty, 'name' | 'unit'> {
  id?: string | string[];
  device_id?: string;
}

const getSelectPropertiesWithValuesQuery = (db: DB, opts?: SelectPropertyOpts) => {
  let query = db.selectFrom('properties as p')
    .innerJoin('feeds as f', 'f.id', 'p.value_fid')
    .innerJoin('devices as d', 'd.id', 'p.device_id')
    .select(eb => sql<string | null>`(
      case
        when f.datatype = 'float' then (select df.v from datapoints_float as df where df.f = f.id order by df.t desc limit 1)::text
        when f.datatype = 'integer' then (select di.v from datapoints_integer as di where di.f = f.id order by di.t desc limit 1)::text
        when f.datatype = 'boolean' then (select db.v from datapoints_bool as db where db.f = f.id order by db.t desc limit 1)::text
        when f.datatype = 'string' then (select ds.v from datapoints_string as ds where ds.f = f.id order by ds.t desc limit 1)::text
        else null::text
      end
    )`.as('value'));
  if (opts?.id) {
    query = Array.isArray(opts.id)
      ? query.where('p.id', 'in', opts.id)
      : query.where('p.id', '=', opts.id);
  }
  if (opts?.device_id) {
    query = query.where('p.device_id', '=', opts.device_id);
  }
  if (typeof opts?.limit === 'number') {
    query = query.limit(opts.limit);
  }
  if (typeof opts?.offset === 'number') {
    query = query.offset(opts.offset);
  }
  if (opts?.order_by) {
    query = query.orderBy(opts.order_by, opts.order_dir ?? 'asc');
  }
  return query;
};

export const insertProperty = async (db: DB, node: InsertableProperty): Promise<SelectableProperty> => {
  return await db.insertInto('properties')
    .values(node)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const selectPropertyById = async (db: DB, id: string): Promise<ExtendedSelectableProperty | undefined> => {
  const query = getSelectPropertiesWithValuesQuery(db, { id })
    .limit(1)
    .selectAll('p')
    .select('d.name as device_name');
  return await query.executeTakeFirst();
};

export const selectPropertiesByIds = async (db: DB, ids: string[]): Promise<ExtendedSelectableProperty[]> => {
  const query = getSelectPropertiesWithValuesQuery(db, { id: ids })
    .selectAll('p')
    .select('d.name as device_name');
  return await query.execute();
};

export const selectPropertiesByDeviceId = async (db: DB, device_id: string, opts?: SelectPropertyOpts): Promise<ExtendedSelectableProperty[]> => {
  let query = getSelectPropertiesWithValuesQuery(db, opts)
    .where('p.device_id', '=', device_id)
    .selectAll('p')
    .select('d.name as device_name');
  return await query.execute();
};

export const updatePropertyById = async (db: DB, id: string, patch: Omit<UpdateableProperty, 'id'>): Promise<SelectableProperty> => {
  return await db.updateTable('properties')
    .where('id', '=', id)
    .set(patch)
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const selectPropertyByNodeAndHomieId = async (db: DB, node_id: string, homie_id: string): Promise<SelectableProperty | undefined> => {
  return await getSelectPropertiesWithValuesQuery(db)
    .where('p.node_id', '=', node_id)
    .where('p.homie_id', '=', homie_id)
    .limit(1)
    .selectAll('p')
    .select('d.name as device_name')
    .executeTakeFirst();
};
