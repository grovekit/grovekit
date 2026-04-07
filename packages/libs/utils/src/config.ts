import { cast } from "@deepkit/type";

export interface Env {
  GK_LOG_LEVEL?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  GK_DASH_BIND_PORT?: number;
  GK_DASH_BIND_ADDR?: string;
  GK_DB_PORT?: number;
  GK_DB_USERNAME?: string;
  GK_DB_PASSWORD?: string;
  GK_DB_DATABASE?: string;
  GK_DB_HOSTNAME?: string;
  GK_BROKER_PORT?: number;
  GK_BROKER_PROTOCOL?: 3 | 5;
  GK_BROKER_CLIENTID?: string;
  GK_BROKER_HOSTNAME?: string;
  GK_BROKER_USERNAME?: string;
  GK_BROKER_PASSWORD?: string;
}

export const getEnv = (): Env => {
  return cast<Env>(process.env);
};

export interface Config {
  log_level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  dash_bind_port: number;
  dash_bind_addr: string;
  db_port: number;
  db_username?: string;
  db_password?: string;
  db_database: string;
  db_hostname: string;
  broker_port: number;
  broker_protocol: 3 | 5;
  broker_hostname: string;
  broker_clientid?: string;
  broker_username?: string;
  broker_password?: string;
}

export const getConfigFromEnv = (): Config => {
  const env = getEnv();
  const config: Config = {
    log_level: env.GK_LOG_LEVEL ?? 'info',
    dash_bind_port: env.GK_DASH_BIND_PORT ?? 8080,
    dash_bind_addr: env.GK_DASH_BIND_ADDR ?? 'localhost',
    db_port: env.GK_DB_PORT ?? 5432,
    db_username: env.GK_DB_USERNAME,
    db_password: env.GK_DB_PASSWORD,
    db_database: env.GK_DB_DATABASE ?? 'grovekit',
    db_hostname: env.GK_DB_HOSTNAME ?? 'localhost',
    broker_port: env.GK_BROKER_PORT ?? 1883,
    broker_protocol: env.GK_BROKER_PROTOCOL ?? 3,
    broker_clientid: env.GK_BROKER_CLIENTID,
    broker_hostname: env.GK_BROKER_HOSTNAME ?? 'localhost',
    broker_username: env.GK_BROKER_USERNAME,
    broker_password: env.GK_BROKER_PASSWORD,
  };
  return cast<Config>(config);
};
