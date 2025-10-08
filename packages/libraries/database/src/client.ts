
import { IsolationLevel, Kysely, sql, Sql, Transaction } from 'kysely';
import { Tables } from './tables/tables.js';
import { PostgresJSDialect } from 'kysely-postgres-js';
import { DBOpts } from './config.js';
import postgres from 'postgres';

export { sql, Sql };

export type DB = Kysely<Tables> | Transaction<Tables>;

export const getDB = async (opts: DBOpts): Promise<DB> => {
  const _url = new URL(opts.url);
  const dialect_client = postgres({
    database: opts.database ?? _url.pathname.replaceAll('/', ''),
    username: opts.username ?? _url.username,
    password: opts.password ?? _url.password,
    hostname: opts.hostname ?? _url.hostname,
    port: opts.port ?? (_url.port ? parseInt(_url.port) : 5432),
    types: {
      timestamp: {
        to: 1114,
        from: [1114],
        serialize: (v: string) => v,
        parse: (v: string) => v,
      },
      timestamptz: {
        to: 1184,
        from: [1184],
        serialize: (v: string) => v,
        parse: (v: string) => v,
      },
      jsonb: {
        to: 3802,
        from: [3802],
        serialize: (v: string) => v,
        parse: (v: string) => JSON.parse(v),
      },
      json: {
        to: 114,
        from: [114],
        serialize: (v: string) => v,
        parse: (v: string) => JSON.parse(v),
      },
      bigint: {
        to: 20,
        from: [20],
        serialize: (v: number) => {
          if (v < Number.MIN_SAFE_INTEGER || v > Number.MAX_SAFE_INTEGER) {
            throw new Error(`Value ${v} out of range for the number type`);
          }
          return v.toString();
        },
        parse: (v: string) => {
          const raw = BigInt(v);
          if (raw < Number.MIN_SAFE_INTEGER || raw > Number.MAX_SAFE_INTEGER) {
            throw new Error(`Value ${v} out of range for the number type`);
          }
          return Number(raw);
        },
      },
    },
  });
  const db = new Kysely<Tables>({
    dialect: new PostgresJSDialect({
      postgres: dialect_client,
    }),
    log: ['query', 'error'],
  });
  ___setDriverClient(db, dialect_client);
  return db;
};

export const isTrx = (db: DB): db is Transaction<Tables> => {
  return db instanceof Transaction;
};

export const ensureNoTrx = (db: DB): Kysely<Tables> => {
  if (isTrx(db)) {
    throw new Error('transaction');
  }
  return db;
};

export const ensureTrx = async <T>(db: DB, callback: (trx: Transaction<Tables>) => Promise<T>, isolationLevel?: IsolationLevel): Promise<T> => {
  if (isTrx(db)) {
    return await callback(db);
  }
  let trx = db.transaction();
  if (isolationLevel) {
    trx = trx.setIsolationLevel(isolationLevel);
  }
  return await trx.execute(callback);
};

const POSTGRES_CLIENT = Symbol('POSTGRES_CLIENT');

export const ___getPostgresClient = (db: DB): postgres.Sql => {
  db = ensureNoTrx(db);
  return (db as any)[POSTGRES_CLIENT];
};

const ___setDriverClient = (db: Kysely<Tables>, raw: postgres.Sql) => {
  (db as any)[POSTGRES_CLIENT] = raw;
};
