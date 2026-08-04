/**
 * AnalyticsEngine
 * Main orchestrator that coordinates all analytics modules
 * Consumes tick data and produces comprehensive analytics snapshots
 */

const EventEmitter = require('events');
const EventBus = require('./EventBus');
const EvenOddAnalyzer = require('./EvenOddAnalyzer');
const MatchesDiffersAnalyzer = require('./MatchesDiffersAnalyzer');
const RiseFallAnalyzer = require('./RiseFallAnalyzer');
const OverUnderAnalyzer = require('./OverUnderAnalyzer');
const PatternDetector = require('./PatternDetector');
const ConfidenceEngine = require('./ConfidenceEngine');
const SignalEngine = require('./SignalEngine');
const InsightEngine = require('./InsightEngine');

class AnalyticsEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.symbol = options.symbol || 'R_100';
    this.windowSizes = options.windowSizes || [50, 100, 250, 500, 1000];
    this.updateInterval = options.updateInterval || 500; // ms

    // Initialize all analyzers
    this.evenOddAnalyzer = new EvenOddAnalyzer({
      windowSizes: this.windowSizes,
    });
    this.matchesDiffersAnalyzer = new MatchesDiffersAnalyzer({
      windowSizes: this.windowSizes,
    });
    this.riseFallAnalyzer = new RiseFallAnalyzer({
      windowSizes: this.windowSizes,
    });
    this.overUnderAnalyzer = new OverUnderAnalyzer({
      windowSizes: this.windowSizes,
      threshold: 5,
    });
    this.patternDetector = new PatternDetector();

    // Initialize engines
    this.confidenceEngine = new ConfidenceEngine();
    this.signalEngine = new SignalEngine();
    this.insightEngine = new InsightEngine();
    this.eventBus = new EventBus();

    // State
    this.tickCount = 0;
    this.lastSnapshot = null;
    this.lastUpdateTime = 0;
    this.isRunning = false;
  }

  /**
   * Process an incoming tick
   */
  processTick(tickValue) {
    if (typeof tickValue !== 'number') {
      this.emit('error', { error: 'Invalid tick value' });
      return;
    }

    // Update all analyzers
    this.evenOddAnalyzer.addTick(tickValue);
    this.matchesDiffersAnalyzer.addTick(tickValue);
    this.riseFallAnalyzer.addTick(tickValue);
    this.overUnderAnalyzer.addTick(tickValue);
    this.patternDetector.addTick(tickValue);

    this.tickCount++;

    // Generate snapshot at configured interval
    const now = Date.now();
    if (now - this.lastUpdateTime >= this.updateInterval) {
      this.generateSnapshot();
      this.lastUpdateTime = now;
    }
  }

  /**
   * Generate complete analytics snapshot
   */
  generateSnapshot() {
    if (this.tickCount === 0) return null;

    const snapshot = {
      timestamp: new Date().toISOString(),
      symbol: this.symbol,
      tickCount: this.tickCount,

      // Raw analyzer outputs
      evenOdd: this.evenOddAnalyzer.getSnapshot(),
      matchesDiffers: this.matchesDiffersAnalyzer.getSnapshot(),
      riseFall: this.riseFallAnalyzer.getSnapshot(),
      overUnder: this.overUnderAnalyzer.getSnapshot(),
      patterns: this.patternDetector.getSnapshot(),
    };

    // Calculate confidence components
    const confidenceData = {
      dataSufficiency: this.confidenceEngine.calculateDataSufficiency(
        this.tickCount
      ),
      patternReliability: this.confidenceEngine.calculatePatternReliability(
        snapshot.patterns.patterns
      ),
      distributionQuality: this.confidenceEngine.calculateDistributionQuality(
        snapshot.evenOdd.probabilities?.[100]
      ),
      streakConsistency: this.confidenceEngine.calculateStreakConsistency(
        snapshot.evenOdd.streaks?.streaks || []
      ),
      entropy: this.confidenceEngine.calculateEntropyConfidence(
        snapshot.patterns.anomalies?.length
      ),
      momentum: this.confidenceEngine.calculateMomentumQuality(
        snapshot.riseFall.momentum
      ),
    };

    // Generate signals
    const signals = this.signalEngine.generateAllSignals(snapshot);

    // Calculate overall confidence
    const confidence = this.confidenceEngine.calculateCompositeConfidence(
      confidenceData
    );

    // Generate insights
    const insights = this.insightEngine.generateAllInsights(snapshot);

    // Complete snapshot
    snapshot.signals = signals;
    snapshot.confidence = confidence;
    snapshot.confidenceBreakdown = this.confidenceEngine.getConfidenceBreakdown(
      confidenceData
    );
    snapshot.insights = insights;

    this.lastSnapshot = snapshot;

    // Emit events
    this.eventBus.emitAnalyticsUpdate(snapshot);
    this.emit('snapshot', snapshot);

    // Emit high-confidence signals
    Object.values(signals).forEach((signal) => {
      if (signal && signal.confidence > 70) {
        this.eventBus.emitHighConfidenceSignal(signal);
        this.emit('high-confidence-signal', signal);
      }
    });

    // Emit pattern events
    if (snapshot.patterns.patterns && Object.keys(snapshot.patterns.patterns).length > 0) {
      this.eventBus.emitPatternDetected({
        timestamp: snapshot.timestamp,
        patterns: snapshot.patterns.patterns,
      });
    }

    // Emit streak events
    if (snapshot.evenOdd.streaks?.currentStreak > 3) {
      this.eventBus.emitStreakEvent({
        timestamp: snapshot.timestamp,
        type: 'even_odd',
        streak: snapshot.evenOdd.streaks.currentStreak,
        value: snapshot.evenOdd.streaks.currentValue,
      });
    }

    return snapshot;
  }

  /**
   * Get the last generated snapshot
   */
  getLastSnapshot() {
    return this.lastSnapshot;
  }

  /**
   * Get current analysis status
   */
  getStatus() {
    return {
      symbol: this.symbol,
      tickCount: this.tickCount,
      hasSnapshot: this.lastSnapshot !== null,
      lastSnapshotTime: this.lastSnapshot?.timestamp,
      confidence: this.lastSnapshot?.confidence || 0,
      signalCount: this.lastSnapshot
        ? Object.keys(this.lastSnapshot.signals).length
        : 0,
    };
  }

  /**
   * Get event bus for external subscriptions
   */
  getEventBus() {
    return this.eventBus;
  }

  /**
   * Subscribe to analytics updates
   */
  onAnalyticsUpdate(handler) {
    this.eventBus.onAnalyticsUpdate(handler);
  }

  /**
   * Subscribe to high-confidence signals
   */
  onHighConfidenceSignal(handler) {
    this.eventBus.onHighConfidenceSignal(handler);
  }

  /**
   * Subscribe to pattern detection
   */
  onPatternDetected(handler) {
    this.eventBus.onPatternDetected(handler);
  }

  /**
   * Subscribe to streak events
   */
  onStreakEvent(handler) {
    this.eventBus.onStreakEvent(handler);
  }

  /**
   * Subscribe to insights
   */
  onInsight(handler) {
    this.eventBus.onInsight(handler);
  }

  /**
   * Set over/under threshold
   */
  setOverUnderThreshold(threshold) {
    this.overUnderAnalyzer.setThreshold(threshold);
  }

  /**
   * Reset all analyzers
   */
  reset() {
    this.evenOddAnalyzer.reset();
    this.matchesDiffersAnalyzer.reset();
    this.riseFallAnalyzer.reset();
    this.overUnderAnalyzer.reset();
    this.patternDetector.reset();
    this.tickCount = 0;
    this.lastSnapshot = null;
    this.lastUpdateTime = 0;
    this.emit('reset');
  }

  /**
   * Get detailed analyzer states
   */
  getAnalyzerStates() {
    return {
      evenOdd: this.evenOddAnalyzer.getSnapshot(),
      matchesDiffers: this.matchesDiffersAnalyzer.getSnapshot(),
      riseFall: this.riseFallAnalyzer.getSnapshot(),
      overUnder: this.overUnderAnalyzer.getSnapshot(),
      patterns: this.patternDetector.getSnapshot(),
    };
  }
}

module.exports = AnalyticsEngine;