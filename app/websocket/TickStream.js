/**
 * TickStream
 * Maintains rolling tick buffers at multiple granularities
 * and publishes new ticks to subscribers
 */

const EventEmitter = require('events');

class TickStream extends EventEmitter {
  constructor(symbol, options = {}) {
    super();
    this.symbol = symbol;
    this.bufferSizes = options.bufferSizes || [50, 100, 250, 500, 1000];
    this.buffers = new Map();
    this.tickCount = 0;
    this.lastTick = null;

    // Initialize buffers
    this.bufferSizes.forEach((size) => {
      this.buffers.set(size, []);
    });
  }

  /**
   * Add a new tick to all buffers
   */
  addTick(tick) {
    this.tickCount++;
    this.lastTick = tick;

    // Add to all buffers
    this.buffers.forEach((buffer, size) => {
      buffer.push(tick);

      // Keep buffer at max size
      if (buffer.length > size) {
        buffer.shift();
      }
    });

    // Emit tick added event
    this.emit('tick', {
      symbol: this.symbol,
      tick,
      tickCount: this.tickCount,
      buffers: this.getBuffers(),
    });
  }

  /**
   * Get all buffers as objects
   */
  getBuffers() {
    const result = {};
    this.buffers.forEach((buffer, size) => {
      result[size] = [...buffer];
    });
    return result;
  }

  /**
   * Get buffer by size
   */
  getBuffer(size) {
    const buffer = this.buffers.get(size);
    return buffer ? [...buffer] : [];
  }

  /**
   * Get the last N ticks
   */
  getLastTicks(count = 10) {
    const buffer = this.getBuffer(Math.max(...this.bufferSizes));
    return buffer.slice(-count);
  }

  /**
   * Get stream statistics
   */
  getStats() {
    return {
      symbol: this.symbol,
      tickCount: this.tickCount,
      lastTick: this.lastTick,
      bufferStatus: Object.fromEntries(
        Array.from(this.buffers.entries()).map(([size, buffer]) => [
          size,
          buffer.length,
        ])
      ),
    };
  }

  /**
   * Clear all buffers
   */
  clear() {
    this.buffers.forEach((buffer) => {
      buffer.length = 0;
    });
    this.tickCount = 0;
    this.lastTick = null;
  }
}

module.exports = TickStream;