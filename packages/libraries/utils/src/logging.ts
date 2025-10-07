
import { is, ValidationErrorItem } from '@deepkit/type';
import { Logger, LogLevel } from 'pinetto';

export interface LoggerOpts {
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
}

export const getLoggerOptsFromEnv = (env: Record<string, string | undefined>): LoggerOpts => {
  const opts = {
    level: env.GK_LOG_LEVEL,
  };
  const errors: ValidationErrorItem[] = [];
  if (!is<LoggerOpts>(opts)) {
    throw new Error(`Invalid logger options: ${errors.map(e => e.message).join(', ')}`);
  }
  return opts;
};

export { Logger, LogLevel };
