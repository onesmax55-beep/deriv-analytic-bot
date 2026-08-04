/**
 * RollingWindow
 * Efficient circular buffer for O(1) insertion and fast statistical queries
 */

class RollingWindow {
  constructor(size) {
    this.size = size;
    this.buffer = new Array(size);
    this.index = 0;
    this.isFull = false;
    this.sum = 0;
    this.squaredSum = 0;
    this.count = 0;
  }

  /**
   * Add a value to the window
   */
  push(value) {
    const oldValue = this.buffer[this.index];

    // Update sums for efficient calculation
    if (this.isFull) {
      this.sum -= oldValue;
      this.squaredSum -= oldValue * oldValue;
    } else {
      this.count++;
    }

    this.buffer[this.index] = value;
    this.sum += value;
    this.squaredSum += value * value;
    this.index = (this.index + 1) % this.size;

    if (this.index === 0) {
      this.isFull = true;
    }
  }

  /**
   * Get all values in insertion order
   */
  getValues() {
    if (!this.isFull) {
      return this.buffer.slice(0, this.count);
    }

    const result = new Array(this.size);
    for (let i = 0; i < this.size; i++) {
      result[i] = this.buffer[(this.index + i) % this.size];
    }
    return result;
  }

  /**
   * Get the last N values
   */
  getLast(n = 1) {
    const values = this.getValues();
    return values.slice(-n);
  }

  /**
   * Get mean (average)
   */
  getMean() {
    const len = this.isFull ? this.size : this.count;
    return len === 0 ? 0 : this.sum / len;
  }

  /**
   * Get variance
   */
  getVariance() {
    const len = this.isFull ? this.size : this.count;
    if (len === 0) return 0;

    const mean = this.getMean();
    return this.squaredSum / len - mean * mean;
  }

  /**
   * Get standard deviation
   */
  getStdDev() {
    return Math.sqrt(this.getVariance());
  }

  /**
   * Get median
   */
  getMedian() {
    const values = [...this.getValues()].sort((a, b) => a - b);
    const len = values.length;
    if (len === 0) return 0;
    if (len % 2 === 0) {
      return (values[len / 2 - 1] + values[len / 2]) / 2;
    }
    return values[Math.floor(len / 2)];
  }

  /**
   * Get mode (most frequent value)
   */
  getMode() {
    const values = this.getValues();
    if (values.length === 0) return null;

    const frequency = {};
    let maxCount = 0;
    let mode = values[0];

    values.forEach((val) => {
      frequency[val] = (frequency[val] || 0) + 1;
      if (frequency[val] > maxCount) {
        maxCount = frequency[val];
        mode = val;
      }
    });

    return mode;
  }

  /**
   * Get min value
   */
  getMin() {
    return Math.min(...this.getValues());
  }

  /**
   * Get max value
   */
  getMax() {
    return Math.max(...this.getValues());
  }

  /**
   * Get count of values in window
   */
  getCount() {
    return this.isFull ? this.size : this.count;
  }

  /**
   * Check if window is full
   */
  isFilled() {
    return this.isFull;
  }

  /**
   * Reset the window
   */
  reset() {
    this.buffer = new Array(this.size);
    this.index = 0;
    this.isFull = false;
    this.sum = 0;
    this.squaredSum = 0;
    this.count = 0;
  }
}

module.exports = RollingWindow;