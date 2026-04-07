

import { sql, Kysely } from 'kysely';
import { Tables } from '../tables/tables.js';

export async function up(trx: Kysely<Tables>): Promise<void> {

  await trx.schema.createTable('device_logs')
    .addColumn('device_id', 'text', col => col.references('devices.id').notNull())
    .addColumn('level', 'text', col => col.notNull())
    .addColumn('message', 'text', col => col.notNull())
    .addColumn('logged_at', 'bigint', col => col.notNull())
    .execute();

  await sql`SELECT create_hypertable('device_logs', by_range('logged_at', 604_800_000))`.execute(trx);
  await trx.schema.createIndex('device_logs_d_t_idx').on('device_logs').columns(['device_id', 'logged_at']).execute();

  await trx.schema.createTable('device_alerts')
    .addColumn('device_id', 'text', col => col.references('devices.id').notNull())
    .addColumn('alert_id', 'text', col => col.notNull())
    .addColumn('message', 'text', col => col.notNull())
    .addColumn('status', 'text', col => col.notNull())
    .addColumn('created_at', 'bigint', col => col.notNull())
    .addColumn('updated_at', 'bigint', col => col.notNull())
    .execute();

  await sql`SELECT create_hypertable('device_alerts', by_range('created_at', 604_800_000))`.execute(trx);
  await trx.schema.createIndex('device_alerts_d_t_idx').on('device_alerts').columns(['updated_at', 'device_id']).execute();

  await trx.schema.alterTable('devices')
    .addColumn('open_alerts', 'bigint', col => col.notNull().defaultTo(0))
    .addColumn('total_alerts', 'bigint', col => col.notNull().defaultTo(0))
    .execute();

}

export async function down(trx: Kysely<Tables>): Promise<void> {

}
