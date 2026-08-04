/**
 * PlaybackController
 * Controls replay UI and synchronizes with analytics engine
 */

const EventEmitter = require('events');

class PlaybackController extends EventEmitter {
  constructor(replayEngine, analyticsEngine, options = {}) {
    super();
    this.replayEngine = replayEngine;
    this.analyticsEngine = analyticsEngine;
    this.isReplaying = false;
    this.replayResults = [];
  }

  /**
   * Start replay with ticks
   */
  async startReplay(ticks, symbol = 'R_100') {
    try {
      // Reset analytics engine
      this.analyticsEngine.reset();

      // Load ticks into replay engine
      this.replayEngine.loadTicks(ticks);
      this.isReplaying = true;
      this.replayResults = [];

      // Subscribe to replay ticks
      this.replayEngine.on('tick', (data) => {
        this.onReplayTick(data);
      });

      this.replayEngine.on('stopped', () => {
        this.onReplayStopped();
      });

      // Start playback
      this.replayEngine.play();
      this.emit('replay-started', { tickCount: ticks.length });
    } catch (error) {
      this.emit('replay-error', error);
      throw error;
    }
  }

  /**
   * Handle tick during replay
   */
  onReplayTick(data) {
    // Feed tick through analytics engine
    this.analyticsEngine.processTick(data.value);

    // Record snapshot
    const snapshot = this.analyticsEngine.getLastSnapshot();
    if (snapshot) {
      this.replayResults.push({
        index: data.index,
        tick: data.value,
        snapshot,
      });
    }

    // Emit progress
    this.emit('replay-progress', {
      index: data.index,
      total: data.total,
      progress: data.progress,
      currentSnapshot: snapshot,
    });
  }

  /**
   * Handle replay completion
   */
  onReplayStopped() {
    this.isReplaying = false;
    this.emit('replay-completed', {
      tickCount: this.replayResults.length,
      results: this.replayResults,
    });
  }

  /**
   * Pause replay
   */
  pauseReplay() {
    this.replayEngine.pause();
    this.emit('replay-paused');
  }

  /**
   * Resume replay
   */
  resumeReplay() {
    this.replayEngine.resume();
    this.emit('replay-resumed');
  }

  /**
   * Stop replay
   */
  stopReplay() {
    this.replayEngine.stop();
    this.isReplaying = false;
    this.emit('replay-stopped');
  }

  /**
   * Set replay speed
   */
  setReplaySpeed(speed) {
    const result = this.replayEngine.setSpeed(speed);
    if (result) {
      this.emit('replay-speed-changed', { speed });
    }
    return result;
  }

  /**
   * Get replay status
   */
  getReplayStatus() {
    return {
      ...this.replayEngine.getStatus(),
      isReplaying: this.isReplaying,
      resultsCount: this.replayResults.length,
    };
  }

  /**
   * Get replay results
   */
  getReplayResults() {
    return this.replayResults;
  }
}

module.exports = PlaybackController;
