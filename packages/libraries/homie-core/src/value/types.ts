
import { Datatype } from "../payloads.js";

export type ColorValueType =
  | ['rgb', number, number, number]
  | ['hsv', number, number, number]
  | ['xyz', number, number]

export interface ValueType extends Record<Datatype, any> {
  float: number;
  integer: number;
  string: string;
  boolean: boolean;
  color: ColorValueType;
  enum: string;
  datetime: Date;
  duration: string;
  json: string;
}

export type RawValue = string & { __raw: true };
