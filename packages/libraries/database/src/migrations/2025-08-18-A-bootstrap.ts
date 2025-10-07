
import { sql, Kysely } from 'kysely';
import { pgtype_id } from '../utils.js';
import { Tables } from '../tables/tables.js';

export async function up(trx: Kysely<Tables>): Promise<void> {

  await sql`CREATE EXTENSION IF NOT EXISTS timescaledb;`.execute(trx);

  // ========================================================================
  //                                Feeds
  // ========================================================================

  await trx.schema.createTable('feeds')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('type', 'varchar(24)', col => col.notNull())
    .addColumn('topic', 'varchar(512)', col => col.unique().notNull())
    .addColumn('datatype', 'varchar(24)', col => col.notNull())
    .execute();

  await trx.schema.createIndex('feeds_by_type_and_topic')
    .on('feeds')
    .columns(['type', 'topic'])
    .execute();

  // ========================================================================
  //                                Feed Data
  // ========================================================================


  type DatapointTableValueColumnType = 'boolean' | 'text' | 'real' | 'integer' | 'smallint' | 'json';

  const mkDatapointsTableBuilder = async (table_name: string, value_type: DatapointTableValueColumnType) => {
    await trx.schema.createTable(table_name)
      .addColumn('t', 'bigint', col => col.notNull())
      .addColumn('f', 'bigint', col => col.references('feeds.id').notNull())
      .addColumn('v', value_type, col => col.notNull())
      .execute();
    await sql`SELECT create_hypertable(${table_name}, by_range('t', 86_400_000))`.execute(trx);
    await trx.schema.createIndex(`${table_name}_f_t_idx`).on(table_name).columns(['f', 't']).execute();
  };

  await mkDatapointsTableBuilder('datapoints_bool', 'boolean');
  await mkDatapointsTableBuilder('datapoints_string', 'text');
  await mkDatapointsTableBuilder('datapoints_float', 'real');
  await mkDatapointsTableBuilder('datapoints_integer', 'integer');
  await mkDatapointsTableBuilder('datapoints_enum', 'smallint');
  await mkDatapointsTableBuilder('datapoints_json', 'json');

  // ========================================================================
  //                              Devices
  // ========================================================================

  await trx.schema.createTable('devices')
    .addColumn('id', pgtype_id, col => col.primaryKey())
    .addColumn('name', 'varchar(128)', col => col)
    .addColumn('type', 'varchar(128)', col => col)
    .addColumn('root_id', pgtype_id, col => col.references('devices.id'))
    .addColumn('parent_id', pgtype_id, col => col.references('devices.id'))
    .addColumn('homie_id', 'varchar(128)', col => col.notNull())
    // .addColumn('h_info', 'jsonb', col => col)
    .addColumn('state', 'varchar(24)', col => col)
    .addColumn('info_fid', 'bigint', col => col.notNull().references('feeds.id'))
    .addColumn('state_fid', 'bigint', col => col.notNull().references('feeds.id'))
    .addColumn('updated_at', 'timestamptz', col => col.notNull())
    .execute();

  await trx.schema.createIndex('unique_homie_device_id')
    .on('devices').columns(['homie_id']).unique().execute();

  // ========================================================================
  //                               Nodes
  // ========================================================================

  await trx.schema.createTable('nodes')
    .addColumn('id', pgtype_id, col => col.primaryKey())
    .addColumn('device_id', pgtype_id, col => col.notNull().references('devices.id'))
    .addColumn('homie_id', 'varchar(128)', col => col.notNull())
    .addColumn('name', 'varchar(128)', col => col)
    // .addColumn('h_info', 'jsonb', col => col.notNull())
    .execute();

  await trx.schema.createIndex('unique_homie_device_node')
    .on('nodes').columns(['device_id', 'homie_id']).unique().execute();

  // ========================================================================
  //                             Properties
  // ========================================================================

  await trx.schema.createTable('properties')
    .addColumn('id', pgtype_id, col => col.primaryKey())
    .addColumn('name', 'varchar(128)', col => col)
    .addColumn('device_id', pgtype_id, col => col.notNull().references('devices.id'))
    .addColumn('node_id', pgtype_id, col => col.notNull().references('nodes.id'))
    .addColumn('homie_id', 'varchar(128)', col => col.notNull())
    // .addColumn('h_info', 'jsonb', col => col.notNull())
    .addColumn('set_fid', 'bigint', col => col.notNull())
    .addColumn('value_fid', 'bigint', col => col.notNull())
    .addColumn('target_fid', 'bigint', col => col.notNull())
    .addColumn('unit', 'varchar(24)', col => col)
    .addColumn('datatype', 'varchar(24)', col => col.notNull())
    .addColumn('format', 'jsonb', col => col.notNull())
    .addColumn('settable', 'boolean', col => col.notNull())
    .addColumn('retained', 'boolean', col => col.notNull())
    .execute();

  await trx.schema.createIndex('unique_homie_node_property')
    .on('properties').columns(['node_id', 'homie_id']).unique().execute();

  await trx.schema.createIndex('device_properties')
    .on('properties').columns(['device_id']).execute();



}

export async function down(trx: Kysely<any>): Promise<void> {
  // Migration code
}
