/**
 * Analytics Module Index
 * Exports all analytics components for use throughout the application
 */

const AnalyticsEngine = require('./AnalyticsEngine');
const EventBus = require('./EventBus');
const RollingWindow = require('./RollingWindow');
const Statistics = require('./Statistics');
const ProbabilityEngine = require('./ProbabilityEngine');
const StreakDetector = require('./StreakDetector');
const EvenOddAnalyzer = require('./EvenOddAnalyzer');
const MatchesDiffersAnalyzer = require('./MatchesDiffersAnalyzer');
const RiseFallAnalyzer = require('./RiseFallAnalyzer');
const OverUnderAnalyzer = require('./OverUnderAnalyzer');
const PatternDetector = require('./PatternDetector');
const ConfidenceEngine = require('./ConfidenceEngine');
const SignalEngine = require('./SignalEngine');
const InsightEngine = require('./InsightEngine');

module.exports = {
  // Main orchestrator
  AnalyticsEngine,

  // Event system
  EventBus,

  // Core utilities
  RollingWindow,
  Statistics,
  ProbabilityEngine,
  StreakDetector,

  // Specialized analyzers
  EvenOddAnalyzer,
  MatchesDiffersAnalyzer,
  RiseFallAnalyzer,
  OverUnderAnalyzer,
  PatternDetector,

  // Intelligence engines
  ConfidenceEngine,
  SignalEngine,
  InsightEngine,

  /**
   * Create a new AnalyticsEngine instance
   */
  createEngine: (options) => new AnalyticsEngine(options),
};
