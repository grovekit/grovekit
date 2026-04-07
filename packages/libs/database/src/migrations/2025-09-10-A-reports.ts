

import { sql, Kysely } from 'kysely';
import { Tables } from '../tables/tables.js';
import { pgtype_id } from '../utils.js';

export async function up(trx: Kysely<Tables>): Promise<void> {

  await trx.schema.createTable('reports')
    .addColumn('id', pgtype_id, col => col.primaryKey())
    .addColumn('title', 'varchar(256)', col => col.notNull())
    .addColumn('timezone', 'varchar(64)', col => col.notNull())
    .addColumn('from', 'varchar(32)', col => col.notNull())
    .addColumn('to', 'varchar(32)', col => col.notNull())
    .addColumn('aggr_win', 'varchar(32)', col => col.notNull())
    .execute();

  await trx.schema.createTable('report_properties')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('order', 'smallint', col => col.notNull())
    .addColumn('label', 'varchar(256)', col => col.notNull())
    .addColumn('report_id', pgtype_id, col => col.references('reports.id').notNull())
    .addColumn('property_id', pgtype_id, col => col.references('properties.id').notNull())
    .addColumn('color', 'varchar(32)', col => col.notNull())
    .addColumn('style', 'varchar(32)', col => col.notNull())
    .addColumn('aggr_op', 'varchar(32)', col => col.notNull())
    .addColumn('aggr_unit', 'varchar(32)', col => col.notNull())
    .execute();

  await trx.schema.createIndex('idx_unique_report_property')
    .on('report_properties')
    .columns(['report_id', 'property_id']).unique()
    .execute();

}

export async function down(trx: Kysely<Tables>): Promise<void> {

}
