import { is, ValidationErrorItem } from "@deepkit/type";
import { stringifyValidationErrorItem } from "@grovekit/utils";

export interface DBOpts {
  url: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  hostname?: string;
}

export const getDBOptsFromEnv = (env: Record<string, string | undefined>): DBOpts => {
  const opts = {
    url: env.GK_DB_URL,
    port: env.GK_DB_PORT ? parseInt(env.GK_DB_PORT) : undefined,
    username: env.GK_DB_USERNAME,
    password: env.GK_DB_PASSWORD,
    database: env.GK_DB_DATABASE,
    hostname: env.GK_DB_HOSTNAME,
  };
  const errors: ValidationErrorItem[] = [];
  if (!is<DBOpts>(opts, undefined, errors)) {
    throw new Error(`Invalid client options: ${errors.map(stringifyValidationErrorItem).join(', ')}`);
  }
  return opts;
};
