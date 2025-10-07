
export type Datatype =
  | 'string'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'enum'
  | 'color'
  | 'datetime'
  | 'duration'
  | 'json'

export interface PropertyDescription<D extends Datatype = Datatype> {
  readonly name?: string;
  readonly datatype: D;
  readonly format?: string;
  readonly settable?: boolean;
  readonly retained?: boolean;
  readonly unit?: string;
}

export interface NodeDescription {
  readonly name?: string;
  readonly type?: string;
  readonly properties?: Record<string, PropertyDescription>;
}

export interface DeviceDescription {
  readonly homie: `${number}.${number}`;
  readonly version: number;
  readonly nodes?: Record<string, NodeDescription>;
  readonly name?: string;
  readonly type?: string;
  readonly children?: string[];
  readonly root?: string;
  readonly parent?: string;
  readonly extensions?: string[];
}
