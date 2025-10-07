
export type TypedJSON<T> = string & { __shape: T };

export const typedStringify = <T>(value: T): TypedJSON<T> => { 
    return JSON.stringify(value) as TypedJSON<T>;
};
