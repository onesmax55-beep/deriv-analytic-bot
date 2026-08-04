/**
 * ReconnectManager
 * Handles automatic reconnection with exponential backoff
 * and restoration of subscriptions
 */

const EventEmitter = require('events');

class ReconnectManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxRetries = options.maxRetries || 10;
    this.initialDelay = options.initialDelay || 1000;   // 1 second
    this.maxDelay = options.maxDelay || 60000;           // 60 seconds
    this.backoffMultiplier = options.backoffMultiplier || 2;

    this.retryCount = 0;
    this.timerId = null;
    this.isRetrying = false;
    this.activeSubscriptions = new Map();
  }

  /**
   * Register a subscription to be restored after reconnect
   */
  registerSubscription(symbol, params) {
    this.activeSubscriptions.set(symbol, params);
  }

  /**
   * Remove a subscription from tracking
   */
  unregisterSubscription(symbol) {
    this.activeSubscriptions.delete(symbol);
  }

  /**
   * Get all active subscriptions to restore
   */
  getActiveSubscriptions() {
    return Array.from(this.activeSubscriptions.values());
  }

  /**
   * Clear all tracked subscriptions
   */
  clearSubscriptions() {
    this.activeSubscriptions.clear();
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateDelay(retryCount) {
    const delay = Math.min(
      this.initialDelay * Math.pow(this.backoffMultiplier, retryCount),
      this.maxDelay
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Attempt reconnection
   */
  async attemptReconnect(connectFn) {
    if (this.isRetrying || this.retryCount >= this.maxRetries) {
      return false;
    }

    this.isRetrying = true;
    const delay = this.calculateDelay(this.retryCount);

    return new Promise((resolve) => {
      this.timerId = setTimeout(async () => {
        try {
          this.emit('reconnect-attempt', {
            attempt: this.retryCount + 1,
            delay,
          });

          await connectFn();
          this.reset();
          this.emit('reconnected');
          resolve(true);
        } catch (error) {
          this.retryCount++;
          this.isRetrying = false;

          if (this.retryCount < this.maxRetries) {
            this.emit('reconnect-failed', {
              attempt: this.retryCount,
              error: error.message,
              nextDelay: this.calculateDelay(this.retryCount),
            });
            resolve(false);
          } else {
            this.emit('max-retries-exceeded', {
              totalAttempts: this.retryCount,
            });
            resolve(false);
          }
        }
      }, delay);
    });
  }

  /**
   * Reset reconnection state
   */
  reset() {
    this.retryCount = 0;
    this.isRetrying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Cancel ongoing reconnection attempt
   */
  cancel() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.isRetrying = false;
  }
}

module.exports = ReconnectManager;