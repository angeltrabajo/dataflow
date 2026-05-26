/**
 * Result type for explicit error handling.
 * Replaces exceptions for control flow with type-safe success/error discrimination.
 */
export type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; errors: E[] };

/**
 * Helper to create a success result.
 */
export const ok = <T>(data: T): Result<T> => ({ success: true, data });

/**
 * Helper to create a failure result.
 */
export const fail = <T, E = string>(errors: E[]): Result<T, E> => ({ success: false, errors });

/**
 * Type guard to check if a result is successful.
 */
export const isSuccess = <T, E>(result: Result<T, E>): result is { success: true; data: T } => {
  return result.success === true;
};
