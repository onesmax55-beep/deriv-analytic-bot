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

    // Initialize components
    this.client = new DerivClient({
      url: options.url,
    });
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

  /**
   * Set up internal event handlers
   */
  setupEventHandlers() {
    // Client events
    this.client.on('connected', () => this.onClientConnected());
    this.client.on('disconnected', () => this.onClientDisconnected());
    this.client.on('error', (error) => this.onClientError(error));

    // Message routing
    this.messageRouter.on('tick', (message) =>
      this.onTickReceived(message)
    );
    this.messageRouter.on('error', (message) =>
      this.onErrorReceived(message)
    );
    this.messageRouter.on('pong', () => this.onPongReceived());

    // Subscription events
    this.subscriptionManager.on('subscription-confirmed', (data) => {
      this.emit('subscription-active', data);
    });
    this.subscriptionManager.on('subscription-failed', (data) => {
      this.emit('subscription-error', data);
    });

    // Heartbeat events
    this.heartbeat.on('stale', () => this.onHeartbeatStale());

    // Reconnection events
    this.reconnectManager.on('reconnect-attempt', (data) => {
      this.emit('reconnect-attempt', data);
    });
    this.reconnectManager.on('reconnected', () => {
      this.onReconnected();
    });
    this.reconnectManager.on('max-retries-exceeded', () => {
      this.setState(CONNECTION_STATE.CLOSED);
      this.emit('connection-failed');
    });
  }

  /**
   * Connect to Deriv
   */
  async connect() {
    if (
      this.state === CONNECTION_STATE.CONNECTED ||
      this.state === CONNECTION_STATE.CONNECTING
    ) {
      return;
    }

    this.setState(CONNECTION_STATE.CONNECTING);

    try {
      await this.client.connect();
    } catch (error) {
      this.setState(CONNECTION_STATE.DISCONNECTED);
      this.emit('connection-error', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Disconnect from Deriv
   */
  async disconnect() {
    this.heartbeat.stop();
    this.reconnectManager.cancel();
    await this.client.disconnect();
    this.setState(CONNECTION_STATE.DISCONNECTED);
  }

  /**
   * Subscribe to a tick stream
   */
  async subscribe(symbol) {
    if (this.state !== CONNECTION_STATE.CONNECTED) {
      throw new Error('Not connected to Deriv');
    }

    try {
      const response = await this.client.request('subscribe', {
        ticks: symbol,
      });

      const reqId = response.req_id;
      this.subscriptionManager.subscribe(symbol, { ticks: symbol }, reqId);

      // Create tick stream if not exists
      if (!this.tickStreams.has(symbol)) {
        this.tickStreams.set(symbol, new TickStream(symbol));
      }

      this.subscriptionManager.confirm(reqId);
      this.emit('subscribed', { symbol });

      return response;
    } catch (error) {
      this.emit('subscription-error', {
        symbol,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Unsubscribe from a tick stream
   */
  async unsubscribe(symbol) {
    try {
      await this.client.request('unsubscribe', {
        ticks: symbol,
      });

      this.tickStreams.delete(symbol);
      this.emit('unsubscribed', { symbol });
    } catch (error) {
      this.emit('unsubscribe-error', {
        symbol,
        error: error.message,
      });
    }
  }

  /**
   * Send a ping to keep connection alive
   */
  sendPing() {
    this.client.send({ ping: 1 });
  }

  /**
   * Handle client connected event
   */
  onClientConnected() {
    this.setState(CONNECTION_STATE.CONNECTED);
    this.reconnectManager.reset();
    this.heartbeat.start(() => this.sendPing());
    this.emit('connected');
  }

  /**
   * Handle client disconnected event
   */
  onClientDisconnected() {
    if (this.state === CONNECTION_STATE.CLOSED) return;

    this.setState(CONNECTION_STATE.RECONNECTING);
    this.heartbeat.stop();

    // Attempt reconnection
    this.reconnectManager.attemptReconnect(async () => {
      await this.client.connect();
    });
  }

  /**
   * Handle client error
   */
  onClientError(error) {
    this.emit('error', error);
  }

  /**
   * Handle tick received
   */
  onTickReceived(message) {
    if (!message.tick) return;

    const { tick, symbol } = message.tick;
    const stream = this.tickStreams.get(symbol);

    if (stream) {
      stream.addTick({
        symbol,
        quote: tick.quote,
        time: tick.epoch,
      });

      this.emit('tick', {
        symbol,
        quote: tick.quote,
        time: tick.epoch,
      });
    }
  }

  /**
   * Handle error received
   */
  onErrorReceived(message) {
    this.emit('deriv-error', message.error);
  }

  /**
   * Handle pong response
   */
  onPongReceived() {
    this.heartbeat.pong();
  }

  /**
   * Handle heartbeat stale
   */
  onHeartbeatStale() {
    this.emit('connection-stale');
    this.client.disconnect();
  }

  /**
   * Handle reconnection success
   */
  onReconnected() {
    this.setState(CONNECTION_STATE.CONNECTED);

    // Restore subscriptions
    const subscriptions = this.reconnectManager.getActiveSubscriptions();
    subscriptions.forEach((params) => {
      this.client.send({
        subscribe: 1,
        ...params,
      });
    });

    this.emit('reconnected');
  }

  /**
   * Set connection state
   */
  setState(newState) {
    this.state = newState;
    this.emit('state-changed', { state: newState });
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      state: this.state,
      connected: this.state === CONNECTION_STATE.CONNECTED,
      subscriptions: this.subscriptionManager.getCount(),
      activeStreams: this.tickStreams.size,
      client: this.client.getStatus(),
    };
  }

  /**
   * Get tick stream
   */
  getTickStream(symbol) {
    return this.tickStreams.get(symbol);
  }

  /**
   * Get all tick streams
   */
  getTickStreams() {
    return Array.from(this.tickStreams.values());
  }
}

module.exports = ConnectionManager;