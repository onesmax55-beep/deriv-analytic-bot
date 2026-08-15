/**
 * MessageRouter
 * Routes incoming WebSocket messages to appropriate handlers
 */

const EventEmitter = require('events');

class MessageRouter extends EventEmitter {
  constructor() {
    super();
    this.handlers = new Map();
    this.requestHandlers = new Map();
  }

  /**
   * Register a handler for a message type.
   * Keep EventEmitter semantics so callers can also emit(messageType, data)
   * directly in integration tests and internal adapters.
   */
  on(messageType, handler) {
    if (!this.handlers.has(messageType)) {
      this.handlers.set(messageType, []);
    }
    this.handlers.get(messageType).push(handler);
    return super.on(messageType, handler);
  }

  /**
   * Register a handler for a specific request ID
   */
  onceRequest(reqId, handler, timeout = 30000) {
    const wrappedHandler = (message) => {
      clearTimeout(timeoutId);
      this.requestHandlers.delete(reqId);
      handler(message);
    };

    const timeoutId = setTimeout(() => {
      this.requestHandlers.delete(reqId);
      handler({
        error: 'Request timeout',
        req_id: reqId,
      });
    }, timeout);

    this.requestHandlers.set(reqId, wrappedHandler);
  }

  /**
   * Route an incoming message
   */
  route(message) {
    try {
      if (message.req_id && this.requestHandlers.has(message.req_id)) {
        const handler = this.requestHandlers.get(message.req_id);
        handler(message);
        return;
      }

      const messageType = this.getMessageType(message);
      if (messageType && this.handlers.has(messageType)) {
        const handlers = this.handlers.get(messageType);
        handlers.forEach((handler) => {
          try {
            handler(message);
          } catch (error) {
            this.emit('handler-error', {
              messageType,
              error: error.message,
            });
          }
        });
      }

      this.emit('message', message);
    } catch (error) {
      this.emit('routing-error', {
        error: error.message,
        message,
      });
    }
  }

  getMessageType(message) {
    if (message.error) return 'error';
    if (message.pong) return 'pong';
    if (message.ping) return 'ping';
    if (message.tick) return 'tick';
    if (message.ticks) return 'ticks';
    if (message.subscribe) return 'subscribe';
    if (message.authorize) return 'authorize';
    if (message.active_symbols) return 'active_symbols';
    if (message.symbol_properties) return 'symbol_properties';
    return null;
  }

  clear() {
    this.handlers.clear();
    this.requestHandlers.clear();
    this.removeAllListeners();
  }
}

module.exports = MessageRouter;
