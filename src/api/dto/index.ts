/**
 * Data Transfer Objects for API routes.
 * These define the shape of request/response bodies
 * for communication between client and server.
 */

/**
 * Generic API request wrapper.
 */
export interface ApiRequest<T> {
  action: string;
  payload: T;
}

/**
 * Generic API response wrapper using the Result pattern.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}
