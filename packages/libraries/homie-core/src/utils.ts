
import { ValidationErrorItem } from "@deepkit/type";
import { DeviceStateTopic, WithRaw } from "./topics.js";

export const getAutodiscoveryTopic = (prefix: string) => {
  return `${prefix}/5/+/$state`;
};

export const getDeviceWildcardTopic = (parsed: WithRaw<DeviceStateTopic>): string => {
  if (parsed.type !== 'device_state' || !parsed.raw.endsWith('/$state')) {
    throw new Error('invalid topic');
  }
  return `${parsed.raw.slice(0, -6)}#`;
};

export type NumberParser = (value: string) => number;

export const maybeParseNumber = (value: string, parse: NumberParser): number | undefined => {
  const parsed = parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const stringifyValidationErrorItem = (item: ValidationErrorItem): string => {
  return `${item.path}: ${item.message} (${item.code})`;
};
