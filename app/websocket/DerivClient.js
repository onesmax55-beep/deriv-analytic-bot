/**
 * DerivClient
 * Low-level WebSocket client implementing Deriv API protocol
 */

const WebSocket = require('ws');
const EventEmitter = require('events');
const {
  DERIV_API_URL,
  buildRequest,
  parseResponse,
  ERROR_CODES,
} = require('./protocol');

class DerivClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.url = options.url || DERIV_API_URL;
    this.websocket = null;
    this.isConnected = false;
    this.requestCallbacks = new Map();
    this.messageBuffer = [];
  }

  /**
   * Connect to Deriv WebSocket
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(this.url);

        this.websocket.onopen = () => {
          this.isConnected = true;
          this.emit('connected');
          this.processBufferedMessages();
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const message = parseResponse(event.data);
            this.handleMessage(message);
          } catch (error) {
            this.emit('parse-error', {
              error: error.message,
              data: event.data,
            });
          }
        };

        this.websocket.onerror = (error) => {
          this.emit('error', {
            error: error.message,
            code: ERROR_CODES.PROTOCOL_ERROR,
          });
          reject(new Error(`WebSocket error: ${error.message}`));
        };

        this.websocket.onclose = () => {
          this.isConnected = false;
          this.websocket = null;
          this.emit('disconnected');
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from Deriv WebSocket
   */
  disconnect() {
    return new Promise((resolve) => {
      if (!this.websocket) {
        resolve();
        return;
      }

      this.websocket.onclose = () => {
        this.isConnected = false;
        this.websocket = null;
        this.emit('disconnected');
        resolve();
      };

      try {
        this.websocket.close();
      } catch (error) {
        this.isConnected = false;
        this.websocket = null;
        resolve();
      }
    });
  }

  /**
   * Send a request and wait for response
   */
  request(type, params = {}) {
    return new Promise((resolve, reject) => {
      const request = buildRequest(type, params);
      const reqId = request.req_id;

      // Set timeout for request
      const timeoutId = setTimeout(() => {
        this.requestCallbacks.delete(reqId);
        reject(
          new Error(
            `Request timeout for ${type} (req_id: ${reqId})`
          )
        );
      }, 30000);

      this.requestCallbacks.set(reqId, (response) => {
        clearTimeout(timeoutId);
        this.requestCallbacks.delete(reqId);

        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response);
        }
      });

      this.send(request);
    });
  }

  /**
   * Send a raw message
   */
  send(message) {
    if (!this.isConnected || !this.websocket) {
      this.messageBuffer.push(message);
      return;
    }

    try {
      this.websocket.send(JSON.stringify(message));
      this.emit('message-sent', message);
    } catch (error) {
      this.emit('send-error', {
        error: error.message,
        message,
      });
    }
  }

  /**
   * Handle incoming message
   */
  handleMessage(message) {
    // Tick subscription messages can carry the original req_id.
    // Forward every tick to the normal message path so the Scanner receives it.
    if (message.tick) {
      this.emit('message', message);
    }

    // Handle response to a normal request.
    if (message.req_id && this.requestCallbacks.has(message.req_id)) {
      const callback = this.requestCallbacks.get(message.req_id);
      callback(message);
      return;
    }

    // Forward all other messages normally.
    if (!message.tick) {
      this.emit('message', message);
    }
  }

  /**
   * Process buffered messages after reconnect
   */
  processBufferedMessages() {
    while (this.messageBuffer.length > 0) {
      const message = this.messageBuffer.shift();
      this.send(message);
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      url: this.url,
      bufferedMessages: this.messageBuffer.length,
      pendingRequests: this.requestCallbacks.size,
    };
  }
}

module.exports = DerivClient;