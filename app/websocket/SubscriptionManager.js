/**
 * SubscriptionManager
 * Tracks and manages all active Deriv API subscriptions
 */

const EventEmitter = require('events');
const {
  SUBSCRIPTION_STATUS,
} = require('./protocol');

class SubscriptionManager extends EventEmitter {
  constructor() {
    super();
    this.subscriptions = new Map();
  }

  /**
   * Create a new subscription record
   */
  subscribe(symbol, params, reqId) {
    const subscription = {
      symbol,
      params,
      reqId,
      status: SUBSCRIPTION_STATUS.SUBSCRIBING,
      createdAt: Date.now(),
      confirmedAt: null,
      tickCount: 0,
    };

    this.subscriptions.set(reqId, subscription);

    this.emit('subscription-created', {
      reqId,
      symbol,
    });

    return subscription;
  }

  /**
   * Confirm a subscription (when server responds)
   */
  confirm(reqId) {
    const subscription = this.subscriptions.get(reqId);
    if (!subscription) return null;

    subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
    subscription.confirmedAt = Date.now();

    this.emit('subscription-confirmed', {
      reqId,
      symbol: subscription.symbol,
      duration: subscription.confirmedAt - subscription.createdAt,
    });

    return subscription;
  }

  /**
   * Record a tick for a subscription
   */
  recordTick(reqId) {
    const subscription = this.subscriptions.get(reqId);
    if (subscription) {
      subscription.tickCount++;
    }
  }

  /**
   * Mark subscription as failed
   */
  fail(reqId, error) {
    const subscription = this.subscriptions.get(reqId);
    if (!subscription) return null;

    subscription.status = SUBSCRIPTION_STATUS.FAILED;
    subscription.error = error;

    this.emit('subscription-failed', {
      reqId,
      symbol: subscription.symbol,
      error,
    });

    return subscription;
  }

  /**
   * Unsubscribe from a symbol
   */
  unsubscribe(reqId) {
    const subscription = this.subscriptions.get(reqId);
    if (!subscription) return null;

    subscription.status = SUBSCRIPTION_STATUS.UNSUBSCRIBING;

    this.emit('subscription-unsubscribing', {
      reqId,
      symbol: subscription.symbol,
    });

    return subscription;
  }

  /**
   * Remove subscription from tracking
   */
  remove(reqId) {
    const subscription = this.subscriptions.get(reqId);
    if (!subscription) return null;

    this.subscriptions.delete(reqId);

    this.emit('subscription-removed', {
      reqId,
      symbol: subscription.symbol,
      tickCount: subscription.tickCount,
    });

    return subscription;
  }

  /**
   * Get subscription by request ID
   */
  get(reqId) {
    return this.subscriptions.get(reqId);
  }

  /**
   * Get all subscriptions for a symbol
   */
  getBySymbol(symbol) {
    return Array.from(this.subscriptions.values()).filter(
      (sub) => sub.symbol === symbol
    );
  }

  /**
   * Get all active subscriptions
   */
  getActive() {
    return Array.from(this.subscriptions.values()).filter(
      (sub) => sub.status === SUBSCRIPTION_STATUS.ACTIVE
    );
  }

  /**
   * Get subscription count
   */
  getCount() {
    return this.subscriptions.size;
  }

  /**
   * Get all subscriptions
   */
  getAll() {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Clear all subscriptions
   */
  clear() {
    this.subscriptions.clear();
  }
}

module.exports = SubscriptionManager;