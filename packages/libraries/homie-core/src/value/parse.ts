
import {
  ColorValueType,
  RawValue,
} from '../value/types.js';

import {
  BooleanFormat,
  EnumFormat,
  PropertyFormat,
  NumericFormat,
} from '../formats.js';

import { maybeParseNumber } from '../utils.js';

export const parseEnumValue = <F extends EnumFormat>(raw: RawValue, format: F): F['values'][number] | undefined => {
  if (format.values.includes(raw)) {
    return raw;
  }
  return undefined;
};

export const parseBooleanValue = (raw: RawValue, format: BooleanFormat): boolean | undefined => {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return undefined;
};

export const parseNumericValue = (raw: RawValue, format: NumericFormat): number | undefined => {
  const parsed = maybeParseNumber(raw, format.datatype === 'integer' ? parseInt : parseFloat);
  return parsed;
};

export const parseColorValue = (raw: RawValue): ColorValueType => {
  const parts = raw.split(',');
  switch (parts[0]) {
    case 'rgb': return parts as ColorValueType;
    case 'hsv': return parts as ColorValueType;
    case 'xyz': return parts as ColorValueType;
    default:
      throw new Error(`Invalid color format: ${raw}`);
  }
};

export const parseDatetimeValue = (raw: RawValue): Date | undefined => {
  const date = new Date(raw);
  if (!Number.isNaN(date.valueOf())) {
    return date;
  }
  return undefined;
};

export const parseValue = <F extends PropertyFormat>(raw: RawValue, format: F) => {
  switch (format.datatype) {
    case 'string':
      return raw as string;
    case 'boolean':
      return parseBooleanValue(raw, format);
    case 'integer':
    case 'float':
      return parseNumericValue(raw, format);
    case 'enum':
      return parseEnumValue(raw, format);
    case 'color':
      return parseColorValue(raw);
    case 'datetime':
      return parseDatetimeValue(raw);
    case 'duration':
    case 'json':
      return undefined;
  }
};
