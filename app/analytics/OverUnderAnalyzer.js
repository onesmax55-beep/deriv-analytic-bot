/**
 * OverUnderAnalyzer
 * Analyzes over/under threshold distribution patterns
 */

const RollingWindow = require('./RollingWindow');
const StreakDetector = require('./StreakDetector');
const Statistics = require('./Statistics');

class OverUnderAnalyzer {
  constructor(options = {}) {
    this.windowSizes = options.windowSizes || [50, 100, 250, 500, 1000];
    this.threshold = options.threshold || 5; // Default threshold for 0-9 digits
    this.windows = new Map();
    this.allTicks = [];
    this.successRate = new Map();

    // Initialize windows for each threshold
    for (let t = 0; t < 10; t++) {
      this.successRate.set(t, { over: 0, under: 0 });
    }

    this.windowSizes.forEach((size) => {
      this.windows.set(size, new RollingWindow(size));
    });
  }

  /**
   * Set the threshold
   */
  setThreshold(threshold) {
    this.threshold = threshold;
  }

  /**
   * Add a tick value
   */
  addTick(value) {
    this.allTicks.push(value);

    // Track success rate for this threshold
    const overUnderValue = value >= this.threshold ? 'over' : 'under';
    const stats = this.successRate.get(this.threshold);
    stats[overUnderValue]++;

    this.windows.forEach((window) => {
      window.push(value);
    });
  }

  /**
   * Get over/under distribution for current threshold
   */
  getDistribution(threshold = null) {
    const t = threshold || this.threshold;
    if (this.allTicks.length === 0) {
      return {
        threshold: t,
        over: 0,
        under: 0,
        overPercentage: 0,
        underPercentage: 0,
      };
    }

    let overCount = 0;
    let underCount = 0;

    this.allTicks.forEach((tick) => {
      if (tick >= t) overCount++;
      else underCount++;
    });

    const total = this.allTicks.length;

    return {
      threshold: t,
      over: overCount,
      under: underCount,
      total,
      overPercentage: (overCount / total) * 100,
      underPercentage: (underCount / total) * 100,
      overProbability: overCount / total,
      underProbability: underCount / total,
    };
  }

  /**
   * Get historical success rates for all thresholds
   */
  getSuccessRates() {
    const total = this.allTicks.length;
    const rates = {};

    for (let t = 0; t < 10; t++) {
      const stats = this.successRate.get(t);
      rates[t] = {
        threshold: t,
        over: stats.over,
        under: stats.under,
        overPercentage: (stats.over / (stats.over + stats.under)) * 100 || 0,
        underPercentage: (stats.under / (stats.over + stats.under)) * 100 || 0,
      };
    }

    return rates;
  }

  /**
   * Get distribution by rolling window
   */
  getRollingDistribution() {
    const result = {};
    this.windowSizes.forEach((size) => {
      const window = this.windows.get(size);
      if (window && window.isFilled()) {
        const values = window.getValues();
        let overCount = 0;
        let underCount = 0;

        values.forEach((val) => {
          if (val >= this.threshold) overCount++;
          else underCount++;
        });

        result[size] = {
          overPercentage: (overCount / size) * 100,
          underPercentage: (underCount / size) * 100,
        };
      }
    });

    return result;
  }

  /**
   * Get streaks in over/under pattern
   */
  getStreaks() {
    return StreakDetector.detectOverUnderStreaks(
      this.allTicks,
      this.threshold
    );
  }

  /**
   * Get confidence in prediction
   */
  getPredictionConfidence() {
    const dist = this.getDistribution();
    const diff = Math.abs(dist.overPercentage - dist.underPercentage);
    // Confidence increases with deviation from 50/50
    const confidence = (diff / 50) * 100;

    return {
      confidence: Math.min(100, confidence),
      prediction: dist.overPercentage > 50 ? 'over' : 'under',
      margin: diff,
    };
  }

  /**
   * Get extreme cases
   */
  getExtremes() {
    if (this.allTicks.length === 0) return null;

    return {
      min: Math.min(...this.allTicks),
      max: Math.max(...this.allTicks),
      range: Math.max(...this.allTicks) - Math.min(...this.allTicks),
      lastTick: this.allTicks[this.allTicks.length - 1],
    };
  }

  /**
   * Analyze distribution shape
   */
  getDistributionShape() {
    if (this.allTicks.length < 30) return null;

    const values = this.allTicks;
    const skewness = Statistics.skewness(values);
    const kurtosis = Statistics.kurtosis(values);

    let shape = 'normal';
    if (skewness > 0.5) shape = 'right-skewed';
    else if (skewness < -0.5) shape = 'left-skewed';

    if (kurtosis > 1) shape += ' (leptokurtic)';
    else if (kurtosis < -1) shape += ' (platykurtic)';

    return {
      skewness,
      kurtosis,
      shape,
    };
  }

  /**
   * Get complete analysis snapshot
   */
  getSnapshot() {
    return {
      currentThreshold: this.threshold,
      distribution: this.getDistribution(),
      rollingDistribution: this.getRollingDistribution(),
      successRates: this.getSuccessRates(),
      streaks: this.getStreaks(),
      predictionConfidence: this.getPredictionConfidence(),
      extremes: this.getExtremes(),
      distributionShape: this.getDistributionShape(),
      tickCount: this.allTicks.length,
    };
  }

  /**
   * Reset analyzer
   */
  reset() {
    this.allTicks = [];
    this.windows.forEach((window) => {
      window.reset();
    });
    this.successRate.forEach((stats) => {
      stats.over = 0;
      stats.under = 0;
    });
  }
}

module.exports = OverUnderAnalyzer;