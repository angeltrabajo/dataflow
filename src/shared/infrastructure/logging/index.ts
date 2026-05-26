/**
 * Simple logging utility.
 * Can be replaced with more sophisticated logging in production.
 */
export const logger = {
  info: (message: string, data?: unknown) => {
    console.log(`[INFO] ${message}`, data ?? "");
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${message}`, data ?? "");
  },
  error: (message: string, data?: unknown) => {
    console.error(`[ERROR] ${message}`, data ?? "");
  },
};
