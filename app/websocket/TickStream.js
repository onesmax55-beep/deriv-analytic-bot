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

    this.bufferSizes.forEach((size) => {
      this.buffers.set(size, []);
    });
  }

  addTick(tick) {
    this.tickCount++;
    this.lastTick = tick;

    this.buffers.forEach((buffer, size) => {
      buffer.push(tick);
      if (buffer.length > size) {
        buffer.shift();
      }
    });

    this.emit('tick', {
      symbol: this.symbol,
      tick,
      tickCount: this.tickCount,
      buffers: this.getBuffers(),
    });
  }

  getBuffers() {
    const result = {};
    this.buffers.forEach((buffer, size) => {
      result[size] = [...buffer];
    });
    return result;
  }

  getBuffer(size) {
    const buffer = this.buffers.get(size);
    return buffer ? [...buffer] : [];
  }

  getLastTicks(count = 10) {
    const buffer = this.getBuffer(Math.max(...this.bufferSizes));
    return buffer.slice(-count);
  }

  getSize() {
    return this.tickCount;
  }

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

  clear() {
    this.buffers.forEach((buffer) => {
      buffer.length = 0;
    });
    this.tickCount = 0;
    this.lastTick = null;
  }
}

module.exports = TickStream;
