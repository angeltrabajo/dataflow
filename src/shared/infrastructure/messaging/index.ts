/**
 * Contrato base para el bus de eventos de dominio.
 * Permite la comunicación desacoplada entre features mediante eventos.
 */
export interface DomainEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
}
