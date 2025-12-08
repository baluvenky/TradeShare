/**
 * Simple Event Emitter implementation for trading events
 */

type EventListener = (...args: any[]) => void;

export class TradeEventEmitter {
  private listeners: Map<string, EventListener[]> = new Map();

  /**
   * Register an event listener
   */
  public on(event: string, listener: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  /**
   * Register a one-time event listener
   */
  public once(event: string, listener: EventListener): void {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  /**
   * Emit an event
   */
  public emit(event: string, ...args: any[]): boolean {
    if (!this.listeners.has(event)) {
      return false;
    }

    const eventListeners = this.listeners.get(event)!;
    eventListeners.forEach(listener => {
      listener(...args);
    });

    return true;
  }

  /**
   * Remove an event listener
   */
  public off(event: string, listener: EventListener): void {
    if (!this.listeners.has(event)) {
      return;
    }

    const eventListeners = this.listeners.get(event)!;
    const index = eventListeners.indexOf(listener);

    if (index > -1) {
      eventListeners.splice(index, 1);
    }
  }

  /**
   * Remove all listeners for an event
   */
  public removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get number of listeners for an event
   */
  public listenerCount(event: string): number {
    return this.listeners.get(event)?.length ?? 0;
  }
}
