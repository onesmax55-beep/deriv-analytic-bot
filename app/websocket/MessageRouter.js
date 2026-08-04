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
   * Register a handler for a message type
   */
  on(messageType, handler) {
    if (!this.handlers.has(messageType)) {
      this.handlers.set(messageType, []);
    }
    this.handlers.get(messageType).push(handler);
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
      // Check if this is a response to a specific request
      if (message.req_id && this.requestHandlers.has(message.req_id)) {
        const handler = this.requestHandlers.get(message.req_id);
        handler(message);
        return;
      }

      // Determine message type and route to handlers
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

      // Always emit raw message
      this.emit('message', message);
    } catch (error) {
      this.emit('routing-error', {
        error: error.message,
        message,
      });
    }
  }

  /**
   * Determine message type from message structure
   */
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

  /**
   * Clear all handlers
   */
  clear() {
    this.handlers.clear();
    this.requestHandlers.clear();
  }
}

module.exports = MessageRouter;