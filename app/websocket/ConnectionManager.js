/**
 * ConnectionManager
 * Orchestrates the complete Deriv WebSocket connection lifecycle
 * Manages reconnection, subscriptions, and message routing
 */

const EventEmitter = require('events');
const DerivClient = require('./DerivClient');
const SubscriptionManager = require('./SubscriptionManager');
const ReconnectManager = require('./ReconnectManager');
const MessageRouter = require('./MessageRouter');
const Heartbeat = require('./Heartbeat');
const TickStream = require('./TickStream');
const { CONNECTION_STATE } = require('./protocol');

class ConnectionManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = options;
    this.state = CONNECTION_STATE.DISCONNECTED;
    this.isDisconnecting = false;

    this.client = new DerivClient({ url: options.url });
    this.subscriptionManager = new SubscriptionManager();
    this.reconnectManager = new ReconnectManager({
      maxRetries: options.maxRetries || 10,
    });
    this.messageRouter = new MessageRouter();
    this.heartbeat = new Heartbeat({
      interval: options.heartbeatInterval || 30000,
    });

    this.tickStreams = new Map();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.on('connected', () => this.onClientConnected());
    this.client.on('disconnected', () => this.onClientDisconnected());
    this.client.on('error', (error) => this.onClientError(error));
    this.client.on('message', (message) => this.messageRouter.route(message));

    this.messageRouter.on('tick', (message) => this.onTickReceived(message));
    this.messageRouter.on('error', (message) => this.onErrorReceived(message));
    this.messageRouter.on('pong', () => this.onPongReceived());

    this.subscriptionManager.on('subscription-confirmed', (data) => {
      this.emit('subscription-active', data);
    });
    this.subscriptionManager.on('subscription-failed', (data) => {
      this.emit('subscription-error', data);
    });

    this.heartbeat.on('stale', () => this.onHeartbeatStale());

    this.reconnectManager.on('reconnect-attempt', (data) => {
      this.emit('reconnect-attempt', data);
    });
    this.reconnectManager.on('reconnected', () => this.onReconnected());
    this.reconnectManager.on('max-retries-exceeded', () => {
      this.setState(CONNECTION_STATE.CLOSED);
      this.emit('connection-failed');
    });
  }

  async connect() {
    if (
      this.state === CONNECTION_STATE.CONNECTED ||
      this.state === CONNECTION_STATE.CONNECTING
    ) {
      return;
    }

    this.isDisconnecting = false;
    this.setState(CONNECTION_STATE.CONNECTING);

    try {
      await this.client.connect();
    } catch (error) {
      this.setState(CONNECTION_STATE.DISCONNECTED);
      this.emit('connection-error', { error: error.message });
      throw error;
    }
  }

  async disconnect() {
    this.isDisconnecting = true;
    this.heartbeat.stop();
    this.reconnectManager.cancel();

    try {
      await this.client.disconnect();
    } finally {
      this.subscriptionManager.clear();
      this.tickStreams.clear();
      this.setState(CONNECTION_STATE.DISCONNECTED);
      this.isDisconnecting = false;
    }
  }

  async subscribe(symbol) {
    if (this.state !== CONNECTION_STATE.CONNECTED) {
      throw new Error('Not connected to Deriv');
    }

    try {
      const response = await this.client.request('subscribe', { ticks: symbol });
      const reqId = response.req_id;
      this.subscriptionManager.subscribe(symbol, { ticks: symbol }, reqId);

      if (!this.tickStreams.has(symbol)) {
        this.tickStreams.set(symbol, new TickStream(symbol));
      }

      this.subscriptionManager.confirm(reqId);
      this.emit('subscribed', { symbol });
      return response;
    } catch (error) {
      this.emit('subscription-error', { symbol, error: error.message });
      throw error;
    }
  }

  async unsubscribe(symbol) {
    try {
      await this.client.request('unsubscribe', { ticks: symbol });

      const subscriptions = this.subscriptionManager.getBySymbol(symbol);
      subscriptions.forEach((subscription) => {
        this.subscriptionManager.remove(subscription.reqId);
      });

      this.tickStreams.delete(symbol);
      this.emit('unsubscribed', { symbol });
    } catch (error) {
      this.emit('unsubscribe-error', { symbol, error: error.message });
      throw error;
    }
  }

  sendPing() {
    this.client.send({ ping: 1 });
  }

  onClientConnected() {
    this.isDisconnecting = false;
    this.setState(CONNECTION_STATE.CONNECTED);
    this.reconnectManager.reset();
    this.heartbeat.start(() => this.sendPing());
    this.emit('connected');
  }

  onClientDisconnected() {
    this.heartbeat.stop();

    if (this.isDisconnecting || this.state === CONNECTION_STATE.CLOSED) {
      this.setState(CONNECTION_STATE.DISCONNECTED);
      return;
    }

    this.setState(CONNECTION_STATE.RECONNECTING);
    this.reconnectManager.attemptReconnect(async () => {
      await this.client.connect();
    });
  }

  onClientError(error) {
    this.emit('error', error);
  }

  onTickReceived(message) {
    if (!message.tick) return;

    const { quote, epoch, symbol } = message.tick;
    const resolvedSymbol = symbol || message.echo_req?.ticks;
    if (!resolvedSymbol) return;

    const stream = this.tickStreams.get(resolvedSymbol);
    if (!stream) return;

    const tick = {
      symbol: resolvedSymbol,
      quote,
      time: epoch,
    };

    stream.addTick(tick);
    this.emit('tick', tick);
  }

  onErrorReceived(message) {
    this.emit('deriv-error', message.error);
  }

  onPongReceived() {
    this.heartbeat.pong();
  }

  onHeartbeatStale() {
    this.emit('connection-stale');
    this.client.disconnect();
  }

  onReconnected() {
    this.setState(CONNECTION_STATE.CONNECTED);
    const subscriptions = this.reconnectManager.getActiveSubscriptions();
    subscriptions.forEach((params) => {
      this.client.send({ subscribe: 1, ...params });
    });
    this.emit('reconnected');
  }

  setState(newState) {
    this.state = newState;
    this.emit('state-changed', { state: newState });
  }

  getStatus() {
    return {
      state: this.state,
      connected: this.state === CONNECTION_STATE.CONNECTED,
      subscriptions: this.subscriptionManager.getCount(),
      activeStreams: this.tickStreams.size,
      client: this.client.getStatus(),
    };
  }

  getTickStream(symbol) {
    return this.tickStreams.get(symbol);
  }

  getTickStreams() {
    return Array.from(this.tickStreams.values());
  }
}

module.exports = ConnectionManager;
