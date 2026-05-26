/**
 * Barrel export for shared domain types.
 * Re-exports all domain base classes and interfaces.
 */

export type { Entity } from './Entity';
export { ValueObject } from './ValueObject';
export type { DomainEvent, EventBus } from './DomainEvent';
export type { Repository } from './Repository';
