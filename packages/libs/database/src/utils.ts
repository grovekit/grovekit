
import assert from 'node:assert';
import { randomBytes, pbkdf2Sync } from 'crypto';
import path from 'node:path';
import url from 'node:url';


export const pgtype_id = 'varchar(11)';

export const packagePath = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');

const KEY_BYTE_LENGTH = 64 as const;
const KEY_ITERATIONS = 100_000 as const;
const KEY_DIGEST_ALG = 'sha512' as const;

export const KEY_CHAR_LENGTH = KEY_BYTE_LENGTH * 2;

export const mkSalt = (): string => {
  return randomBytes(KEY_BYTE_LENGTH)
    .toString('hex');
};

export const mkHash = (salt: string, password: string): string => {
  assert(salt.length === KEY_CHAR_LENGTH, 'invalid salt length');
  return pbkdf2Sync(password, Buffer.from(salt, 'hex'), KEY_ITERATIONS, KEY_BYTE_LENGTH, KEY_DIGEST_ALG)
    .toString('hex');
};


export const APIKEY_BYTE_LENGTH = 32 as const;
export const APIKEY_CHAR_LENGTH = APIKEY_BYTE_LENGTH * 2;

export const mkApikey = (): string => {
  return randomBytes(APIKEY_BYTE_LENGTH).toString('hex');
};
