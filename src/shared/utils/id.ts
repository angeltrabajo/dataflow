/**
 * Generate a unique identifier.
 * Uses timestamp + random for uniqueness without external dependencies.
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

/**
 * Generate a prefixed unique identifier (e.g., "proj-abc123").
 */
export const generatePrefixedId = (prefix: string): string => {
  return `${prefix}-${generateId()}`;
};
