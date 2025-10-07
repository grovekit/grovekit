
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
    await trx.schema.dropTable('properties').ifExists().execute();
    await trx.schema.dropTable('nodes').ifExists().execute();
    await trx.schema.dropTable('devices').ifExists().execute();
    await trx.schema.dropTable('report_feeds').ifExists().execute();
    await trx.schema.dropTable('reports').ifExists().execute();
    await trx.schema.dropTable('feed_tags_user').ifExists().execute();
    await trx.schema.dropTable('feed_tags_extension').ifExists().execute();
    await trx.schema.dropTable('feeds').ifExists().execute();
    await trx.schema.dropTable('extensions').ifExists().execute();
    await trx.schema.dropTable('tenants_users').ifExists().execute();
    await trx.schema.dropTable('sessions').ifExists().execute();
    await trx.schema.dropTable('users').ifExists().execute();
    await trx.schema.dropTable('tenants').ifExists().execute();
  });

  await db.destroy();

});
