#!/usr/bin/env node
import { getDB } from '../client.js';
import { getDBOptsFromEnv } from '../config.js';
import { runAsyncMain  } from '@grovekit/utils';

runAsyncMain(async () => {

  const db = await getDB(getDBOptsFromEnv(process.env));

  await db.transaction().execute(async (trx) => {
    await trx.schema.dropTable('kysely_migration_lock').ifExists().execute();
    await trx.schema.dropTable('kysely_migration').ifExists().execute();
    await trx.schema.dropTable('datapoints_bool').ifExists().execute();
    await trx.schema.dropTable('datapoints_float').ifExists().execute();
    await trx.schema.dropTable('datapoints_integer').ifExists().execute();
    await trx.schema.dropTable('datapoints_string').ifExists().execute();
    await trx.schema.dropTable('datapoints_enum').ifExists().execute();
    await trx.schema.dropTable('datapoints_json').ifExists().execute();
    await trx.schema.dropTable('report_properties').ifExists().execute();
    await trx.schema.dropTable('reports').ifExists().execute();
    await trx.schema.dropTable('properties').ifExists().execute();
    await trx.schema.dropTable('nodes').ifExists().execute();
    await trx.schema.dropTable('device_alerts').ifExists().execute();
    await trx.schema.dropTable('device_logs').ifExists().execute();
    await trx.schema.dropTable('devices').ifExists().execute();
    await trx.schema.dropTable('feeds').ifExists().execute();
  });

  await db.destroy();

});
