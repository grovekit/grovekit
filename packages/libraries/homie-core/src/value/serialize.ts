
import { RawValue } from './types.js';

import {
  BooleanFormat,
  DatetimeFormat,
  EnumFormat,
  PropertyFormat,
  NumericFormat,
  ColorFormat,
} from '../formats.js';

export const serializeEnumValue = (value: any, format: EnumFormat): RawValue | undefined => {
  if (format.values.includes(value)) {
    return value;
  }
  throw new Error(`Invalid enum value: ${value}`);
};

export const serializeBooleanValue = (value: any, format: BooleanFormat): RawValue | undefined => {
  if (typeof value === 'boolean') {
    return String(value) as RawValue;
  }
  throw new Error(`Invalid boolean value: ${value}`);
};

export const serializeNumericValue = (value: any, format: NumericFormat): RawValue | undefined => {
  if (typeof value === 'string') {
    switch (format.datatype) {
      case 'integer': value = parseInt(value); break;
      case 'float': value = parseFloat(value); break;
    }
  }
  if (typeof value === 'number' && !Number.isNaN(value)) {
    if (typeof format.min === 'number' && value < format.min) throw new Error('invalid value (below min)');
    if (typeof format.max === 'number' && value > format.max) throw new Error('invalid value (above max)');
    return String(value) as RawValue;
  }
  throw new Error(`Invalid numeric value: ${value}`);
};

export const serializeColorValue = (value: any, format: ColorFormat): RawValue | undefined => {
  if (Array.isArray(value)) {
    return value.join(',') as RawValue;
  }
  return undefined;
};

export const serializeDatetimeValue = (value: any, format: DatetimeFormat): RawValue | undefined => {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString() as RawValue;
  }
  throw new Error('Invalid datetime value');
};

export const serializeValue = (value: any, format: PropertyFormat): RawValue | undefined => {
  switch (format.datatype) {
    case 'string':
      return value as RawValue;
    case 'boolean':
      return serializeBooleanValue(value, format);
    case 'integer':
    case 'float':
      return serializeNumericValue(value, format);
    case 'enum':
      return serializeEnumValue(value, format);
    case 'color':
      return serializeColorValue(value, format);
    case 'datetime':
      return serializeDatetimeValue(value, format);
    case 'duration':
    case 'json':
      return undefined;
  }
};
