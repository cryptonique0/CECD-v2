// resilienceService.ts
// Offline-first, local sync, mesh networking, circuit breaker, and retry patterns

import { loggerService } from './loggerService';

export interface OfflineQueueItem {
  id: string;
  type: 'incident' | 'message' | 'triage' | 'update';
  payload: any;
  timestamp: number;
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerConfig {
  failureThreshold?: number;
  successThreshold?: number;
  timeout?: number;
  cooldownPeriod?: number;
}

export interface RetryConfig {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private config: Required<CircuitBreakerConfig>;

  constructor(
    private name: string,
    config: CircuitBreakerConfig = {}
  ) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      successThreshold: config.successThreshold || 2,
      timeout: config.timeout || 60000,
      cooldownPeriod: config.cooldownPeriod || 30000
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.cooldownPeriod) {
        this.state = CircuitState.HALF_OPEN;
        loggerService.info('CircuitBreaker', `${this.name} entering HALF_OPEN state`);
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), this.config.timeout)
        )
      ]);

      if (this.state === CircuitState.HALF_OPEN) {
        this.successCount++;
        if (this.successCount >= this.config.successThreshold) {
          this.reset();
          loggerService.info('CircuitBreaker', `${this.name} circuit closed`);
        }
      } else {
        this.failureCount = 0;
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.config.failureThreshold) {
        this.state = CircuitState.OPEN;
        loggerService.warn('CircuitBreaker', `${this.name} circuit opened after ${this.failureCount} failures`);
      }

      throw error;
    }
  }

  private reset() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
  }

  getState() {
    return this.state;
  }

  getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

class ResilienceService {
  private offlineQueue: OfflineQueueItem[] = [];
  private isOnline: boolean = true;
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private defaultRetryConfig: Required<RetryConfig> = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  };

  setOnlineStatus(status: boolean) {
    this.isOnline = status;
    loggerService.info('ResilienceService', `Online status changed: ${status}`);
    if (status) this.syncQueue();
  }

  queueItem(type: OfflineQueueItem['type'], payload: any) {
    const item: OfflineQueueItem = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type,
      payload,
      timestamp: Date.now()
    };
    this.offlineQueue.push(item);
    loggerService.debug('ResilienceService', `Queued offline item: ${item.id}`, { type });
  }

  getQueue(): OfflineQueueItem[] {
    return this.offlineQueue;
  }

  // Sync queued items when online
  syncQueue() {
    if (!this.isOnline || this.offlineQueue.length === 0) return;

    loggerService.info('ResilienceService', `Syncing ${this.offlineQueue.length} offline items`);
    // TODO: Implement real sync logic (API calls, local DB)
    this.offlineQueue = [];
  }

  // Mesh networking stub
  broadcastToMesh(payload: any) {
    loggerService.info('ResilienceService', 'Broadcasting to mesh network');
    // TODO: Integrate with mesh network library (e.g., WebRTC, Bluetooth, LoRa)
    return true;
  }

  /**
   * Retry with exponential backoff
   */
  async retry<T>(
    fn: () => Promise<T>,
    config: RetryConfig = {}
  ): Promise<T> {
    const cfg = { ...this.defaultRetryConfig, ...config };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < cfg.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < cfg.maxAttempts - 1) {
          const delay = Math.min(
            cfg.baseDelay * Math.pow(cfg.backoffMultiplier, attempt) + Math.random() * 1000,
            cfg.maxDelay
          );

          loggerService.warn(
            'ResilienceService',
            `Retry attempt ${attempt + 1}/${cfg.maxAttempts} failed, waiting ${delay}ms`,
            { error: lastError.message }
          );

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    loggerService.error(
      'ResilienceService',
      `All ${cfg.maxAttempts} retry attempts failed`,
      lastError || new Error('Unknown error')
    );

    throw lastError || new Error('Max retry attempts exceeded');
  }

  /**
   * Execute with circuit breaker
   */
  async executeWithCircuitBreaker<T>(
    name: string,
    fn: () => Promise<T>,
    config: CircuitBreakerConfig = {}
  ): Promise<T> {
    let breaker = this.circuitBreakers.get(name);

    if (!breaker) {
      breaker = new CircuitBreaker(name, config);
      this.circuitBreakers.set(name, breaker);
    }

    return breaker.execute(fn);
  }

  /**
   * Get circuit breaker metrics
   */
  getCircuitBreakerMetrics(name: string) {
    const breaker = this.circuitBreakers.get(name);
    return breaker?.getMetrics() || null;
  }

  /**
   * Get all circuit breaker metrics
   */
  getAllCircuitBreakerMetrics() {
    const metrics: Record<string, any> = {};

    for (const [name, breaker] of this.circuitBreakers.entries()) {
      metrics[name] = breaker.getMetrics();
    }

    return metrics;
  }

  /**
   * Reset specific circuit breaker
   */
  resetCircuitBreaker(name: string) {
    this.circuitBreakers.delete(name);
    loggerService.info('ResilienceService', `Circuit breaker reset: ${name}`);
  }

  /**
   * Fallback on error
   */
  async withFallback<T>(
    fn: () => Promise<T>,
    fallback: T | (() => Promise<T>)
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      loggerService.warn(
        'ResilienceService',
        'Primary operation failed, using fallback',
        { error: (error as Error).message }
      );

      if (typeof fallback === 'function') {
        return fallback();
      }

      return fallback;
    }
  }
}

export const resilienceService = new ResilienceService();
