/**
 * PatternDetector
 * Identifies recurring patterns and anomalies in data
 */

const Statistics = require('./Statistics');

class PatternDetector {
  constructor(options = {}) {
    this.minPatternLength = options.minPatternLength || 3;
    this.maxPatternLength = options.maxPatternLength || 10;
    this.allTicks = [];
    this.patterns = new Map();
  }

  /**
   * Add a tick value
   */
  addTick(value) {
    this.allTicks.push(value);
    this.detectPatterns();
  }

  /**
   * Detect repeating subsequences
   */
  detectPatterns() {
    if (this.allTicks.length < this.minPatternLength) return;

    this.patterns.clear();

    for (
      let patternLen = this.minPatternLength;
      patternLen <= Math.min(this.maxPatternLength, this.allTicks.length / 2);
      patternLen++
    ) {
      const patternMap = {};

      for (let i = 0; i <= this.allTicks.length - patternLen; i++) {
        const pattern = this.allTicks.slice(i, i + patternLen).join(',');
        patternMap[pattern] = (patternMap[pattern] || 0) + 1;
      }

      Object.entries(patternMap).forEach(([pattern, count]) => {
        if (count > 1) {
          const key = `len${patternLen}`;
          if (!this.patterns.has(key)) {
            this.patterns.set(key, []);
          }
          this.patterns.get(key).push({
            pattern: pattern.split(',').map(Number),
            count,
            frequency: count / (this.allTicks.length - patternLen + 1),
          });
        }
      });
    }
  }

  /**
   * Get all detected patterns
   */
  getPatterns() {
    const result = {};
    this.patterns.forEach((patterns, key) => {
      result[key] = patterns.sort((a, b) => b.count - a.count).slice(0, 10); // Top 10
    });
    return result;
  }

  /**
   * Detect alternating sequences (e.g., even, odd, even, odd)
   */
  detectAlternating() {
    if (this.allTicks.length < 4) return null;

    const parities = this.allTicks.map((v) => v % 2);
    let maxAltLength = 0;
    let currentAltLength = 1;

    for (let i = 1; i < parities.length; i++) {
      if (parities[i] !== parities[i - 1]) {
        currentAltLength++;
        maxAltLength = Math.max(maxAltLength, currentAltLength);
      } else {
        currentAltLength = 1;
      }
    }

    return {
      longestAlternation: maxAltLength,
      expectedRandomness: 'moderate',
    };
  }

  /**
   * Detect cyclic behavior
   */
  detectCyclic() {
    if (this.allTicks.length < 10) return null;

    const autocorrs = [];
    for (let lag = 1; lag <= Math.min(20, this.allTicks.length / 2); lag++) {
      const corr = Statistics.autocorrelation(this.allTicks, lag);
      autocorrs.push({ lag, correlation: corr });
    }

    // Find peaks in autocorrelation
    const peaks = autocorrs.filter(
      (ac, i) =>
        i > 0 &&
        i < autocorrs.length - 1 &&
        ac.correlation > autocorrs[i - 1].correlation &&
        ac.correlation > autocorrs[i + 1].correlation &&
        ac.correlation > 0.3
    );

    return {
      cycleDetected: peaks.length > 0,
      potentialCycles: peaks.map((p) => p.lag),
      autocorrelations: autocorrs,
    };
  }

  /**
   * Detect rare events
   */
  detectRareEvents(threshold = 0.1) {
    if (this.allTicks.length === 0) return [];

    const freq = {};
    this.allTicks.forEach((val) => {
      freq[val] = (freq[val] || 0) + 1;
    });

    const rareEvents = [];
    Object.entries(freq).forEach(([val, count]) => {
      const probability = count / this.allTicks.length;
      if (probability < threshold) {
        rareEvents.push({
          value: parseInt(val),
          count,
          probability,
          rarity: 1 - probability,
        });
      }
    });

    return rareEvents.sort((a, b) => b.rarity - a.rarity);
  }

  /**
   * Detect compression (reduced volatility) and expansion (increased volatility)
   */
  detectCompressionExpansion(windowSize = 50) {
    if (this.allTicks.length < windowSize * 2) return null;

    // Calculate recent and previous volatility
    const recent = this.allTicks.slice(-windowSize);
    const previous = this.allTicks.slice(-windowSize * 2, -windowSize);

    const recentStd = Math.sqrt(
      recent.reduce((sum, val, i) => sum + Math.pow(val - recent[0], 2), 0) /
        recent.length
    );
    const previousStd = Math.sqrt(
      previous.reduce((sum, val, i) => sum + Math.pow(val - previous[0], 2), 0) /
        previous.length
    );

    const volatilityChange = ((recentStd - previousStd) / previousStd) * 100;

    return {
      recentVolatility: recentStd,
      previousVolatility: previousStd,
      volatilityChange,
      state: volatilityChange > 10 ? 'expansion' : volatilityChange < -10 ? 'compression' : 'stable',
    };
  }

  /**
   * Detect anomalies using Z-score
   */
  detectAnomalies(threshold = 3) {
    if (this.allTicks.length < 10) return [];

    const zScores = Statistics.zScore(this.allTicks);
    const anomalies = [];

    zScores.forEach((z, i) => {
      if (Math.abs(z) > threshold) {
        anomalies.push({
          index: i,
          value: this.allTicks[i],
          zScore: z,
          severity: Math.abs(z),
        });
      }
    });

    return anomalies.sort((a, b) => b.severity - a.severity);
  }

  /**
   * Get complete pattern analysis snapshot
   */
  getSnapshot() {
    return {
      patterns: this.getPatterns(),
      alternating: this.detectAlternating(),
      cyclic: this.detectCyclic(),
      rareEvents: this.detectRareEvents(),
      compressionExpansion: this.detectCompressionExpansion(),
      anomalies: this.detectAnomalies(),
      tickCount: this.allTicks.length,
    };
  }

  /**
   * Reset detector
   */
  reset() {
    this.allTicks = [];
    this.patterns.clear();
  }
}

module.exports = PatternDetector;