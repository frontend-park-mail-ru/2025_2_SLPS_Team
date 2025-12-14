type EventListener<T = unknown> = (payload: T) => void;

export class EventBuss {
  private events: Record<string, EventListener[]> = {};
  private lastEvents: Record<string, unknown> = {};

  on<T = unknown>(event: string, listener: EventListener<T>): void {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener as EventListener);

    if (event in this.lastEvents) {
      listener(this.lastEvents[event] as T);
    }
  }

  emit(event: string): void;
  emit<T = unknown>(event: string, data: T): void;

  emit<T = unknown>(event: string, data?: T): void {
    this.lastEvents[event] = data as unknown;

    const listeners = this.events[event];
    if (!listeners) return;

    listeners.forEach((listener) => listener(data as T));
  }

  off<T = unknown>(event: string, listener: EventListener<T>): void {
    const listeners = this.events[event];
    if (!listeners) return;

    this.events[event] = listeners.filter((l) => l !== (listener as EventListener));
  }

  // опционально
  clear(event?: string): void {
    if (event) {
      delete this.events[event];
      delete this.lastEvents[event];
      return;
    }
    this.events = {};
    this.lastEvents = {};
  }
}

export const EventBus = new EventBuss();
