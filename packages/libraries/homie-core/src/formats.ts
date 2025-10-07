
import { Datatype, PropertyDescription } from "./payloads.js";

type NumberParser = (value: string) => number;

export interface BaseFormat {
  readonly datatype: Datatype;
}

export interface NumericFormat extends BaseFormat {
  readonly datatype: 'integer' | 'float';
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
}

export interface EnumFormat extends BaseFormat {
  readonly datatype: 'enum';
  readonly values: [first: string, ...rest: string[]];
}

export interface BooleanFormat extends BaseFormat {
  readonly datatype: 'boolean';
  readonly values?: [false: string, true: string];
}

export interface ColorFormat extends BaseFormat {
  readonly datatype: 'color';
  readonly formats: ('rgb' | 'hsv' | 'xyz')[];
}

export interface StringFormat extends BaseFormat {
  readonly datatype: 'string';
}

export interface DatetimeFormat extends BaseFormat {
  readonly datatype: 'datetime';
}

export interface DurationFormat extends BaseFormat {
  readonly datatype: 'duration';
}

export interface JsonFormat extends BaseFormat {
  readonly datatype: 'json';
  readonly schema?: {};
}

export type PropertyFormat =
  | NumericFormat
  | EnumFormat
  | BooleanFormat
  | ColorFormat
  | StringFormat
  | DatetimeFormat
  | DurationFormat
  | JsonFormat;

export const DEVICE_STATE_FORMAT: EnumFormat = {
  datatype: 'enum',
  values: ['init', 'ready', 'disconnected', 'sleeping', 'lost'],
};

export const DEVICE_INFO_FORMAT: JsonFormat = {
  datatype: 'json'
};

export const getBooleanPropertyFormat = (datatype: 'boolean', format: string | undefined): BooleanFormat => {
  if (format) {
    const values = format.split(',').filter(v => v !== '');
    if (values.length === 2) {
      return { datatype, values } as BooleanFormat;
    }
  }
  return { datatype };
};

export const getNumericPropertyFormat = (datatype: 'integer' | 'float', format: string | undefined, parse: NumberParser): NumericFormat => {
  if (format) {
    let min: number | undefined = undefined;
    let max: number | undefined = undefined;
    let step: number | undefined = undefined;
    const values = format.split(':');
    if (values.length > 0) min = parse(values[0]);
    if (values.length > 1) max = parse(values[1]);
    if (values.length > 2) step = parse(values[2]);
    return { datatype, min, max, step };
  }
  return { datatype };
};

export const getEnumPropertyFormat = (datatype: 'enum', format: string | undefined): EnumFormat => {
  if (format) {
    const values = format.split(',').filter(v => v !== '');
    if (values.length > 0) {
      return { datatype, values } as EnumFormat
    }
  }
  throw new Error('invalid enum format');
};

export const getColorPropertyFormat = (datatype: 'color', format: string | undefined): ColorFormat => {
  if (format) {
    const formats = format.split(',')
      .filter(v => v === 'rgb' || v === 'hsv' || v === 'xyz');
    return { datatype, formats };
  }
  throw new Error('invalid color format');
};

export const getPropertyFormat = <D extends Datatype>(info: PropertyDescription<D>): PropertyFormat => {
  const { datatype, format } = info;
  switch (datatype) {
    case 'boolean':
      return getBooleanPropertyFormat(datatype, format);
    case 'integer':
      return getNumericPropertyFormat(datatype, format, parseInt);
    case 'float':
      return getNumericPropertyFormat(datatype, format, parseFloat);
    case 'enum':
      return getEnumPropertyFormat(datatype, format);
    case 'color':
      return getColorPropertyFormat(datatype, format);
    case 'string':
      return { datatype };
    case 'datetime':
      return { datatype };
    case 'duration':
      return { datatype };
    case 'json':
      return { datatype };
  }
};
