
import { getDB } from '../client.js';
import {runAsyncMain} from '@grovekit/utils';
import { migrateToLatest } from '../migrator.js';
import {getDBOptsFromEnv} from '../config.js';
import { readFile } from 'node:fs/promises';
import { is } from '@deepkit/type';

runAsyncMain(async () => {

  const db = await getDB(getDBOptsFromEnv(process.env));

  const { error, results } = await migrateToLatest(db);

  let exit_code = 0;

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === 'Error') {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error('failed to migrate');
    console.error(error);
    exit_code = 1;
  }

  await db.destroy();
  process.exit(exit_code);

});
