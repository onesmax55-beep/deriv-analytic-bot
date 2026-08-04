/**
 * EvenOddAnalyzer
 * Analyzes even/odd distribution and patterns
 */

const RollingWindow = require('./RollingWindow');
const ProbabilityEngine = require('./ProbabilityEngine');
const StreakDetector = require('./StreakDetector');
const Statistics = require('./Statistics');

class EvenOddAnalyzer {
  constructor(options = {}) {
    this.windowSizes = options.windowSizes || [50, 100, 250, 500, 1000];
    this.windows = new Map();
    this.allTicks = [];

    // Initialize windows for each size
    this.windowSizes.forEach((size) => {
      this.windows.set(size, new RollingWindow(size));
    });
  }

  /**
   * Add a tick value
   */
  addTick(value) {
    this.allTicks.push(value);
    this.windows.forEach((window) => {
      window.push(value);
    });
  }

  /**
   * Get even/odd probabilities for a window size
   */
  getProbability(windowSize = 100) {
    const window = this.windows.get(windowSize);
    if (!window) return null;

    return ProbabilityEngine.evenOddProbability(window.getValues());
  }

  /**
   * Get all probabilities for all window sizes
   */
  getProbabilities() {
    const result = {};
    this.windowSizes.forEach((size) => {
      result[size] = this.getProbability(size);
    });
    return result;
  }

  /**
   * Get transition matrix (even->even, even->odd, etc.)
   */
  getTransitionMatrix() {
    if (this.allTicks.length < 2) {
      return {
        'even->even': 0,
        'even->odd': 0,
        'odd->even': 0,
        'odd->odd': 0,
      };
    }

    const transitions = {
      'even->even': 0,
      'even->odd': 0,
      'odd->even': 0,
      'odd->odd': 0,
    };

    for (let i = 0; i < this.allTicks.length - 1; i++) {
      const current = this.allTicks[i] % 2 === 0 ? 'even' : 'odd';
      const next = this.allTicks[i + 1] % 2 === 0 ? 'even' : 'odd';
      transitions[`${current}->${next}`]++;
    }

    // Convert to probabilities
    const total = this.allTicks.length - 1;
    Object.keys(transitions).forEach((key) => {
      transitions[key] = transitions[key] / total;
    });

    return transitions;
  }

  /**
   * Get streak information
   */
  getStreaks() {
    return StreakDetector.detectEvenOddStreaks(this.allTicks);
  }

  /**
   * Get entropy (randomness measure)
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
   * Get rolling averages
   */
  getRollingAverages() {
    const result = {};
    this.windowSizes.forEach((size) => {
      const prob = this.getProbability(size);
      if (prob) {
        result[size] = {
          evenAverage: prob.evenPercentage / 100,
          oddAverage: prob.oddPercentage / 100,
        };
      }
    });
    return result;
  }

  /**
   * Get complete analysis snapshot
   */
  getSnapshot() {
    const streaks = this.getStreaks();
    const lastTick = this.allTicks[this.allTicks.length - 1];
    const lastParity = lastTick % 2 === 0 ? 'even' : 'odd';

    return {
      probabilities: this.getProbabilities(),
      transitionMatrix: this.getTransitionMatrix(),
      entropy: this.getEntropy(),
      currentParity: lastParity,
      currentStreak: streaks.currentStreak,
      longestStreak: streaks.longestStreak,
      streakValue: streaks.currentValue,
      allStreaks: streaks.streaks,
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
  }
}

module.exports = EvenOddAnalyzer;