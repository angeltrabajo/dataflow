import type { Entity } from './Entity';

/**
 * Base contract for all repositories.
 * Repositories abstract data persistence.
 */
export interface Repository<T extends Entity> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
}
