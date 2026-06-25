import { ValidationErrorItem } from "@runtyped/type";

export const stringifyValidationErrorItem = (item: ValidationErrorItem): string => {
  return `${item.path}: ${item.message} (${item.code})`;
};
