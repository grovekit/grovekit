import { ValidationErrorItem } from "@deepkit/type";

export const stringifyValidationErrorItem = (item: ValidationErrorItem): string => {
  return `${item.path}: ${item.message} (${item.code})`;
};
