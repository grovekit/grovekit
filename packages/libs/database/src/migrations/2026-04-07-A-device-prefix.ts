

import { sql, Kysely } from 'kysely';
import { Tables } from '../tables/tables.js';
import { pgtype_id } from '../utils.js';

export async function up(trx: Kysely<Tables>): Promise<void> {

  await trx.schema.alterTable('devices')
    .addColumn('homie_prefix', 'varchar(128)', col => col.notNull().defaultTo('homie'))
    .execute();

  await trx.schema.alterTable('devices')
    .alterColumn('homie_prefix', col => col.dropDefault())
    .execute();

  await trx.schema.dropIndex('unique_homie_device_id')
    .execute();

  await trx.schema.createIndex('unique_homie_device_id')
    .on('devices').columns(['homie_prefix', 'homie_id'])
    .unique()
    .execute();
}

export async function down(trx: Kysely<Tables>): Promise<void> {

}
