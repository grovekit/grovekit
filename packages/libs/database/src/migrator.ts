import path, { resolve } from 'path'
import fs from 'fs/promises'
import {
  Migrator,
  FileMigrationProvider
} from 'kysely';
import { type DB, ensureNoTrx, ensureTrx } from './client.js';
import { type Logger } from 'pinetto';

export const migrateToLatest = async (db: DB, logger: Logger) => {

  const migrator = new Migrator({
    db: ensureNoTrx(db),
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: resolve(import.meta.dirname, 'migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      logger.debug('migration %s was executed successfully', it.migrationName);
    } else if (it.status === 'Error') {
      logger.error('failed to execute migration %s', it.migrationName);
    }
  });

  if (error) {
    throw error;
  }

};

export const dropAllTables = async (db: DB) => {
  await ensureTrx(db, async (trx) => {
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
};
