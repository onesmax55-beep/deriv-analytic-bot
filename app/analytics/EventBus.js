/**
 * EventBus
 * Centralized event emitter for analytics events
 */

const EventEmitter = require('events');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Emit analytics update
   */
  emitAnalyticsUpdate(snapshot) {
    this.emit('analytics:update', snapshot);
  }

  /**
   * Emit high-confidence signal
   */
  emitHighConfidenceSignal(signal) {
    this.emit('signal:high-confidence', signal);
  }

  /**
   * Emit pattern detected
   */
  emitPatternDetected(pattern) {
    this.emit('pattern:detected', pattern);
  }

  /**
   * Emit streak event
   */
  emitStreakEvent(streak) {
    this.emit('streak:event', streak);
  }

  /**
   * Emit anomaly
   */
  emitAnomaly(anomaly) {
    this.emit('anomaly:detected', anomaly);
  }

  /**
   * Emit insight
   */
  emitInsight(insight) {
    this.emit('insight:generated', insight);
  }

  /**
   * Subscribe to all analytics updates
   */
  onAnalyticsUpdate(handler) {
    this.on('analytics:update', handler);
  }

  /**
   * Subscribe to high-confidence signals
   */
  onHighConfidenceSignal(handler) {
    this.on('signal:high-confidence', handler);
  }

  /**
   * Subscribe to pattern detections
   */
  onPatternDetected(handler) {
    this.on('pattern:detected', handler);
  }

  /**
   * Subscribe to streak events
   */
  onStreakEvent(handler) {
    this.on('streak:event', handler);
  }

  /**
   * Subscribe to anomalies
   */
  onAnomaly(handler) {
    this.on('anomaly:detected', handler);
  }

  /**
   * Subscribe to insights
   */
  onInsight(handler) {
    this.on('insight:generated', handler);
  }
}

module.exports = EventBus;