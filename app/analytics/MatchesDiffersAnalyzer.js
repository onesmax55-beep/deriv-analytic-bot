/**
 * MatchesDiffersAnalyzer
 * Analyzes digit matching and differing patterns
 */

const RollingWindow = require('./RollingWindow');
const Statistics = require('./Statistics');
const ProbabilityEngine = require('./ProbabilityEngine');

class MatchesDiffersAnalyzer {
  constructor(options = {}) {
    this.windowSizes = options.windowSizes || [50, 100, 250, 500, 1000];
    this.windows = new Map();
    this.allTicks = [];
    this.digitFrequency = {};
    this.digitPairs = [];

    // Initialize windows
    this.windowSizes.forEach((size) => {
      this.windows.set(size, new RollingWindow(size));
    });

    // Initialize digit frequency (0-9)
    for (let i = 0; i < 10; i++) {
      this.digitFrequency[i] = 0;
    }
  }

  /**
   * Add a tick value
   */
  addTick(value) {
    const digit = value % 10;
    this.allTicks.push(digit);
    this.digitFrequency[digit]++;

    // Track digit pairs for matching/differing
    if (this.allTicks.length > 1) {
      const prevDigit = this.allTicks[this.allTicks.length - 2];
      this.digitPairs.push({
        pair: [prevDigit, digit],
        matches: prevDigit === digit,
      });
    }

    this.windows.forEach((window) => {
      window.push(digit);
    });
  }

  /**
   * Get digit frequency analysis
   */
  getDigitFrequency() {
    const total = this.allTicks.length;
    const frequency = {};
    const sorted = [];

    Object.entries(this.digitFrequency).forEach(([digit, count]) => {
      frequency[digit] = {
        count,
        percentage: (count / total) * 100,
      };
      sorted.push({ digit: parseInt(digit), count, percentage: (count / total) * 100 });
    });

    // Sort by frequency
    sorted.sort((a, b) => b.count - a.count);

    return {
      frequency,
      sorted,
      expectedFrequency: 100 / 10, // 10%
    };
  }

  /**
   * Get hot (over-represented) and cold (under-represented) digits
   */
  getHotColdDigits(threshold = 12) {
    const freq = this.getDigitFrequency();
    const expected = freq.expectedFrequency;

    const hot = [];
    const cold = [];

    Object.entries(freq.frequency).forEach(([digit, data]) => {
      if (data.percentage > threshold) {
        hot.push({
          digit: parseInt(digit),
          percentage: data.percentage,
          deviation: data.percentage - expected,
        });
      } else if (data.percentage < expected * 0.8) {
        cold.push({
          digit: parseInt(digit),
          percentage: data.percentage,
          deviation: expected - data.percentage,
        });
      }
    });

    return { hot, cold };
  }

  /**
   * Get missing digits
   */
  getMissingDigits() {
    const missing = [];
    for (let i = 0; i < 10; i++) {
      if (this.digitFrequency[i] === 0) {
        missing.push(i);
      }
    }
    return missing;
  }

  /**
   * Get matches vs differs ratio
   */
  getMatchesDiffersRatio() {
    if (this.digitPairs.length === 0) {
      return {
        matches: 0,
        differs: 0,
        matchPercentage: 0,
        differPercentage: 0,
      };
    }

    const matches = this.digitPairs.filter((p) => p.matches).length;
    const differs = this.digitPairs.length - matches;

    return {
      matches,
      differs,
      total: this.digitPairs.length,
      matchPercentage: (matches / this.digitPairs.length) * 100,
      differPercentage: (differs / this.digitPairs.length) * 100,
    };
  }

  /**
   * Get repeat digit detection (same digit consecutively)
   */
  getRepeatingDigits() {
    const repeating = {};
    for (let i = 0; i < 10; i++) {
      repeating[i] = 0;
    }

    for (let i = 0; i < this.allTicks.length - 1; i++) {
      if (this.allTicks[i] === this.allTicks[i + 1]) {
        repeating[this.allTicks[i]]++;
      }
    }

    return repeating;
  }

  /**
   * Get entropy score for each window size
   */
  getEntropy() {
    const result = {};
    this.windowSizes.forEach((size) => {
      const window = this.windows.get(size);
      if (window && window.isFilled()) {
        result[size] = Statistics.entropy(window.getValues());
      }
    });
    return result;
  }

  /**
   * Get chi-square test for randomness
   */
  getChiSquareRandomness() {
    const total = this.allTicks.length;
    const observed = Object.values(this.digitFrequency);
    const expected = Array(10).fill(total / 10);

    return ProbabilityEngine.chiSquareTest(observed, expected);
  }

  /**
   * Get complete analysis snapshot
   */
  getSnapshot() {
    return {
      digitFrequency: this.getDigitFrequency(),
      hotColdDigits: this.getHotColdDigits(),
      missingDigits: this.getMissingDigits(),
      matchesDiffers: this.getMatchesDiffersRatio(),
      repeatingDigits: this.getRepeatingDigits(),
      entropy: this.getEntropy(),
      randomnessTest: this.getChiSquareRandomness(),
      tickCount: this.allTicks.length,
    };
  }

  /**
   * Reset analyzer
   */
  reset() {
    this.allTicks = [];
    this.digitPairs = [];
    this.windows.forEach((window) => {
      window.reset();
    });
    Object.keys(this.digitFrequency).forEach((key) => {
      this.digitFrequency[key] = 0;
    });
  }
}

module.exports = MatchesDiffersAnalyzer;