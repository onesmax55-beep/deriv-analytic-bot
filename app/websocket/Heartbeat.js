/**
 * Heartbeat
 * Keeps the WebSocket connection alive by sending periodic pings
 * and detecting stale connections
 */

const EventEmitter = require('events');

class Heartbeat extends EventEmitter {
  constructor(options = {}) {
    super();
    this.interval = options.interval || 30000; // 30 seconds
    this.timeout = options.timeout || 5000;    // 5 seconds to respond
    this.timerId = null;
    this.timeoutId = null;
    this.isActive = false;
    this.lastPingTime = null;
  }

  /**
   * Start the heartbeat
   */
  start(sendPingFn) {
    if (this.isActive) return;
    this.isActive = true;

    this.timerId = setInterval(() => {
      this.lastPingTime = Date.now();
      sendPingFn();

      // Set timeout to detect unresponsive connection
      this.timeoutId = setTimeout(() => {
        const elapsed = Date.now() - this.lastPingTime;
        this.emit('stale', {
          elapsed,
          timeout: this.timeout,
        });
      }, this.timeout);
    }, this.interval);
  }

  /**
   * Handle pong response
   */
  pong() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.emit('pong');
  }

  /**
   * Stop the heartbeat
   */
  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.isActive = false;
  }

  /**
   * Check if connection is healthy
   */
  isHealthy() {
    return this.isActive && !this.timeoutId;
  }
}

module.exports = Heartbeat;