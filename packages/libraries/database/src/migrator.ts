import path from 'path'
import { promises as fs } from 'fs'
import {
  Migrator,
  FileMigrationProvider
} from 'kysely';
import { DB, ensureNoTrx } from './client.js';
import {packagePath} from './utils.js';


const migrationFolder = path.resolve(packagePath, 'dist', 'migrations');

export const migrateToLatest = async (db: DB) => {
  const migrator = new Migrator({
    db: ensureNoTrx(db),
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder,
    }),
  });
  return await migrator.migrateToLatest();
};
