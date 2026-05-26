/**
 * Base interface for all domain events.
 * Events represent something that happened in the domain.
 */
export interface DomainEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Contract for event bus implementations.
 */
export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(type: string, handler: (event: DomainEvent) => void): void;
}
