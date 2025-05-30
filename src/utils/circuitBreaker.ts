
interface CircuitBreakerConfig {
  maxEventsPerWindow: number;
  windowSizeMs: number;
  recoveryTimeMs: number;
}

interface EventRecord {
  timestamp: number;
  count: number;
}

export class CircuitBreaker {
  private events: EventRecord[] = [];
  private isOpen: boolean = false;
  private lastOpenTime: number = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  recordEvent(): boolean {
    const now = Date.now();
    
    // Clean old events outside the window
    this.cleanOldEvents(now);
    
    // If circuit is open, check if we can recover
    if (this.isOpen) {
      if (now - this.lastOpenTime > this.config.recoveryTimeMs) {
        console.log('[CIRCUIT_BREAKER] Attempting recovery...');
        this.isOpen = false;
        this.events = []; // Reset events on recovery
      } else {
        console.log('[CIRCUIT_BREAKER] Circuit still open, blocking event');
        return false; // Circuit is open, block the event
      }
    }
    
    // Record the new event
    this.events.push({ timestamp: now, count: 1 });
    
    // Check if we should open the circuit
    const totalEvents = this.events.reduce((sum, event) => sum + event.count, 0);
    
    if (totalEvents > this.config.maxEventsPerWindow) {
      console.log(`[CIRCUIT_BREAKER] Too many events (${totalEvents}), opening circuit`);
      this.isOpen = true;
      this.lastOpenTime = now;
      return false;
    }
    
    return true; // Event allowed
  }

  private cleanOldEvents(currentTime: number) {
    const cutoff = currentTime - this.config.windowSizeMs;
    this.events = this.events.filter(event => event.timestamp > cutoff);
  }

  isCircuitOpen(): boolean {
    // Check if we can recover first
    if (this.isOpen && Date.now() - this.lastOpenTime > this.config.recoveryTimeMs) {
      this.isOpen = false;
      this.events = [];
    }
    return this.isOpen;
  }

  reset() {
    this.isOpen = false;
    this.events = [];
    this.lastOpenTime = 0;
  }
}

// Global circuit breaker instance for paper trade subscriptions
export const paperTradeCircuitBreaker = new CircuitBreaker({
  maxEventsPerWindow: 15, // Max 15 events in 5 seconds
  windowSizeMs: 5000,     // 5 second window
  recoveryTimeMs: 10000   // 10 second recovery time
});
