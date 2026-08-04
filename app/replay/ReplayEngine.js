/**
 * ReplayEngine
 * Replays historical tick data through analytics pipeline
 */

const EventEmitter = require('events');

class ReplayEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.ticks = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.speed = options.speed || 1; // 1x, 2x, 5x, 10x
    this.tickInterval = options.tickInterval || 50; // ms
    this.playbackTimer = null;
  }

  /**
   * Load ticks for replay
   */
  loadTicks(ticks) {
    if (!Array.isArray(ticks) || ticks.length === 0) {
      throw new Error('Invalid or empty ticks array');
    }
    this.ticks = ticks;
    this.currentIndex = 0;
    this.emit('loaded', { tickCount: ticks.length });
  }

  /**
   * Start playback
   */
  play() {
    if (this.isPlaying && !this.isPaused) return;

    this.isPlaying = true;
    this.isPaused = false;
    this.emit('started');

    this.playback();
  }

  /**
   * Main playback loop
   */
  playback() {
    if (!this.isPlaying || this.isPaused) return;

    if (this.currentIndex >= this.ticks.length) {
      this.stop();
      return;
    }

    const tick = this.ticks[this.currentIndex];
    this.emit('tick', {
      value: tick.value,
      timestamp: tick.timestamp,
      index: this.currentIndex,
      total: this.ticks.length,
      progress: (this.currentIndex / this.ticks.length) * 100,
    });

    this.currentIndex++;

    // Schedule next tick based on speed
    const interval = this.tickInterval / this.speed;
    this.playbackTimer = setTimeout(() => this.playback(), interval);
  }

  /**
   * Pause playback
   */
  pause() {
    if (!this.isPlaying) return;

    this.isPaused = true;
    clearTimeout(this.playbackTimer);
    this.emit('paused', { index: this.currentIndex });
  }

  /**
   * Resume playback
   */
  resume() {
    if (!this.isPaused) return;

    this.isPaused = false;
    this.emit('resumed', { index: this.currentIndex });
    this.playback();
  }

  /**
   * Stop playback
   */
  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    clearTimeout(this.playbackTimer);
    this.currentIndex = 0;
    this.emit('stopped');
  }

  /**
   * Step forward one tick
   */
  stepForward() {
    if (this.currentIndex >= this.ticks.length) return;

    const tick = this.ticks[this.currentIndex];
    this.emit('tick', {
      value: tick.value,
      timestamp: tick.timestamp,
      index: this.currentIndex,
      total: this.ticks.length,
      progress: (this.currentIndex / this.ticks.length) * 100,
    });

    this.currentIndex++;
    this.emit('stepped', { index: this.currentIndex - 1 });
  }

  /**
   * Step backward one tick
   */
  stepBackward() {
    if (this.currentIndex <= 0) return;

    this.currentIndex--;
    const tick = this.ticks[this.currentIndex];
    this.emit('tick', {
      value: tick.value,
      timestamp: tick.timestamp,
      index: this.currentIndex,
      total: this.ticks.length,
      progress: (this.currentIndex / this.ticks.length) * 100,
    });

    this.emit('stepped', { index: this.currentIndex });
  }

  /**
   * Seek to specific index
   */
  seek(index) {
    if (index < 0 || index >= this.ticks.length) return false;

    this.currentIndex = index;
    this.emit('seeked', { index });
    return true;
  }

  /**
   * Set playback speed
   */
  setSpeed(speed) {
    const validSpeeds = [0.5, 1, 2, 5, 10];
    if (!validSpeeds.includes(speed)) return false;

    this.speed = speed;
    this.emit('speed-changed', { speed });
    return true;
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentIndex: this.currentIndex,
      totalTicks: this.ticks.length,
      progress: (this.currentIndex / this.ticks.length) * 100,
      speed: this.speed,
    };
  }
}

module.exports = ReplayEngine;
