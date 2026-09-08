/**
 * SubscriptionManager
 * Tracks and manages all active Deriv API subscriptions.
 */

const EventEmitter = require('events');
const { SUBSCRIPTION_STATUS } = require('./protocol');

class SubscriptionManager extends EventEmitter {
  constructor() {
    super();
    this.subscriptions = new Map();
  }

  subscribe(symbol, params, reqId) {
    const subscription = {
      symbol,
      params,
      reqId,
      subscriptionId: null,
      status: SUBSCRIPTION_STATUS.SUBSCRIBING,
      createdAt: Date.now(),
      confirmedAt: null,
      tickCount: 0,
    };
    this.subscriptions.set(reqId, subscription);
    this.emit('subscription-created', { reqId, symbol });
    return subscription;
  }

  confirm(reqId, subscriptionId = null) {
    const subscription = this.subscriptions.get(reqId);
    if (!subscription) return null;
    subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
    subscription.subscriptionId = subscriptionId || null;
    subscription.confirmedAt = Date.now();
    this.emit('subscription-confirmed', {
      reqId,
      symbol: subscription.symbol,
      subscriptionId: subscription.subscriptionId,
      duration: subscription.confirmedAt - subscription.createdAt,
    });
    return subscription;
  }

  recordTick(reqId) {
    const subscription = this.subscriptions.get(reqId);
    if (subscription) subscription.tickCount++;
  }

  fail(reqId, error) {
    const subscription = this.subscriptions.get(reqId);
    if (!subscription) return null;
    subscription.status = SUBSCRIPTION_STATUS.FAILED;
    subscription.error = error;
    this.emit('subscription-failed', { reqId, symbol: subscription.symbol, error });
    return subscription;
  }

  unsubscribe(reqId) {
    const subscription = this.subscriptions.get(reqId);
    if (!subscription) return null;
    subscription.status = SUBSCRIPTION_STATUS.UNSUBSCRIBING;
    this.emit('subscription-unsubscribing', { reqId, symbol: subscription.symbol });
    return subscription;
  }

  remove(reqId) {
    const subscription = this.subscriptions.get(reqId);
    if (!subscription) return null;
    this.subscriptions.delete(reqId);
    this.emit('subscription-removed', {
      reqId,
      symbol: subscription.symbol,
      subscriptionId: subscription.subscriptionId,
      tickCount: subscription.tickCount,
    });
    return subscription;
  }

  get(reqId) { return this.subscriptions.get(reqId); }
  getBySymbol(symbol) { return Array.from(this.subscriptions.values()).filter((sub) => sub.symbol === symbol); }
  getActive() { return Array.from(this.subscriptions.values()).filter((sub) => sub.status === SUBSCRIPTION_STATUS.ACTIVE); }
  getCount() { return this.subscriptions.size; }
  getAll() { return Array.from(this.subscriptions.values()); }
  clear() { this.subscriptions.clear(); }
}

module.exports = SubscriptionManager;
