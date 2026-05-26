/**
 * Validate that a required string field is not empty.
 */
export const requiredString = (value: unknown, fieldName: string): string[] => {
  const errors: string[] = [];
  if (!value || (typeof value === "string" && value.trim().length === 0)) {
    errors.push(`${fieldName} es obligatorio`);
  }
  return errors;
};

/**
 * Validate that a value is within a numeric range.
 */
export const validateRange = (value: number | undefined, min: number | undefined, max: number | undefined, fieldName: string): string[] => {
  const errors: string[] = [];
  if (value !== undefined) {
    if (min !== undefined && value < min) errors.push(`${fieldName} debe ser mayor o igual a ${min}`);
    if (max !== undefined && value > max) errors.push(`${fieldName} debe ser menor o igual a ${max}`);
  }
  return errors;
};

/**
 * Convert any value to a number, returning 0 for invalid values.
 */
export const toNumber = (val: unknown): number => {
  if (typeof val === "number") return val;
  if (val == null || val === "") return 0;
  const num = parseFloat(String(val));
  return isNaN(num) ? 0 : num;
};
