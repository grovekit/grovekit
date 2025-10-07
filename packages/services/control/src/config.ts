import { is, ValidationErrorItem } from "@deepkit/type";
import { stringifyValidationErrorItem } from "@grovekit/utils";

export interface Config {
  http_bind_port: number;
  http_bind_addr: string;
}

export const getConfigFromEnv = (env: Record<string, string | undefined>): Config => {
  const config = {
    http_bind_port: env.GK_HTTP_PORT ? parseInt(env.GK_HTTP_PORT) : undefined,
    http_bind_addr: env.GK_HTTP_ADDR,
  };
  const errors: ValidationErrorItem[] = [];
  if (!is<Config>(config, undefined, errors)) {
    throw new Error(`Invalid configuration: ${errors.map(stringifyValidationErrorItem).join(', ')}`);
  }
  return config;
};
