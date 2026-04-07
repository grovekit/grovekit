
import { uid } from 'uid';

export const runAsyncMain = (fn: () => Promise<any>) => {
  fn().catch((err) => {
    console.error(err);
    process.exit(1);
  });
};

export const mkId = (): string => {
  return uid(11);
};

export type ArrayOrNot<T> = T | T[];

export const wait = (delay: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
};

export const mapSeriesAsync = async <I, O>(source: I[], iterator: (item: I) => Promise<O>): Promise<O[]>=> {
  const result: O[] = new Array(source.length);
  for (let i = 0, l = source.length; i < l; i += 1) {
    result[i] = await iterator(source[i]);
  }
  return result;
};

export const bigIntToInt = (val: bigint): number => {
  if (val < Number.MIN_SAFE_INTEGER || val > Number.MAX_SAFE_INTEGER) {
    throw new Error(`BigInt value ${val} is too large to be converted to a number`);
  }
  return Number(val);
};

export const indexBy = <K extends string, T extends { [key in K]: string }>(array: T[], key: K): Record<string, T> => {
  return array.reduce((acc, curr) => {
    acc[curr[key]] = curr;
    return acc;
  }, {} as Record<string, T>);
};

export const arrayfy = <T>(value: T | T[]): T[] => {
  return Array.isArray(value) ? value : [value];
};
