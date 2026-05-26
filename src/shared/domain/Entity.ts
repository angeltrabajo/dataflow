/**
 * Base interface for all domain entities.
 * Entities have a unique identity and lifecycle.
 */
export interface Entity {
  id: string;
  createdAt: string;
  updatedAt: string;
}
