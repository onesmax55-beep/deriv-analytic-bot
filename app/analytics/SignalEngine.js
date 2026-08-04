/**
 * SignalEngine
 * Converts analytics into normalized, actionable signals
 */

class SignalEngine {
  constructor(options = {}) {
    this.confidenceThreshold = options.confidenceThreshold || 0.6;
  }

  /**
   * Generate even/odd signal
   */
  generateEvenOddSignal(evenOddData) {
    if (!evenOddData) return null;

    const prob = evenOddData.probabilities?.[100];
    if (!prob) return null;

    const bias = prob.evenPercentage - prob.oddPercentage;
    const direction = bias > 5 ? 'even' : bias < -5 ? 'odd' : 'neutral';

    return {
      type: 'even_odd',
      direction,
      bias: Math.abs(bias),
      confidence: Math.min(100, Math.abs(bias) * 2),
      evenPercentage: prob.evenPercentage,
      oddPercentage: prob.oddPercentage,
    };
  }

  /**
   * Generate rise/fall signal
   */
  generateRiseFallSignal(riseFallData) {
    if (!riseFallData) return null;

    const ratio = riseFallData.riseFallRatio;
    if (!ratio) return null;

    const bias = ratio.risePercentage - ratio.fallPercentage;
    const direction = bias > 5 ? 'rise' : bias < -5 ? 'fall' : 'neutral';

    // Boost confidence with momentum
    let confidence = Math.min(100, Math.abs(bias) * 2);
    if (riseFallData.momentum?.momentumPercentage) {
      confidence = Math.min(
        100,
        confidence * (1 + Math.abs(riseFallData.momentum.momentumPercentage) / 100)
      );
    }

    return {
      type: 'rise_fall',
      direction,
      bias: Math.abs(bias),
      confidence: Math.round(confidence),
      risePercentage: ratio.risePercentage,
      fallPercentage: ratio.fallPercentage,
    };
  }

  /**
   * Generate over/under signal
   */
  generateOverUnderSignal(overUnderData) {
    if (!overUnderData) return null;

    const dist = overUnderData.distribution;
    if (!dist) return null;

    const bias = dist.overPercentage - dist.underPercentage;
    const direction = bias > 5 ? 'over' : bias < -5 ? 'under' : 'neutral';

    return {
      type: 'over_under',
      direction,
      threshold: dist.threshold,
      bias: Math.abs(bias),
      confidence: Math.min(100, Math.abs(bias) * 2),
      overPercentage: dist.overPercentage,
      underPercentage: dist.underPercentage,
    };
  }

  /**
   * Generate streak signal
   */
  generateStreakSignal(streakData, type = 'even_odd') {
    if (!streakData || !streakData.currentStreak) return null;

    const streakType = type === 'rise_fall' ? 'directional' : 'parity';
    const confidence = Math.min(
      100,
      streakData.currentStreak * 10 + 30
    );

    return {
      type: `streak_${type}`,
      streakType,
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      currentValue: streakData.currentValue,
      confidence,
      strength: streakData.currentStreak / Math.max(3, streakData.longestStreak),
    };
  }

  /**
   * Generate pattern signal
   */
  generatePatternSignal(patternData) {
    if (!patternData) return null;

    const patterns = patternData.patterns || {};
    const topPatterns = [];

    // Collect top patterns by frequency
    Object.values(patterns).forEach((patternList) => {
      if (Array.isArray(patternList)) {
        topPatterns.push(...patternList.slice(0, 3));
      }
    });

    if (topPatterns.length === 0) return null;

    // Sort by frequency
    topPatterns.sort((a, b) => b.frequency - a.frequency);

    return {
      type: 'pattern',
      patternDetected: topPatterns.length > 0,
      topPatterns: topPatterns.slice(0, 5),
      confidence: Math.min(100, topPatterns[0].frequency * 100 * 2),
      anomalies: patternData.anomalies?.slice(0, 3) || [],
    };
  }

  /**
   * Generate volatility signal
   */
  generateVolatilitySignal(volatilityData) {
    if (!volatilityData) return null;

    const vol = volatilityData.volatility;
    if (!vol) return null;

    let level = 'low';
    if (vol.volatilityLevel === 'medium') level = 'medium';
    else if (vol.volatilityLevel === 'high') level = 'high';

    return {
      type: 'volatility',
      level,
      standardDeviation: vol.standardDeviation,
      coefficient: vol.coefficient,
      confidence: level === 'high' ? 85 : level === 'medium' ? 65 : 40,
    };
  }

  /**
   * Generate all signals
   */
  generateAllSignals(fullAnalysis) {
    const signals = {};

    if (fullAnalysis.evenOdd) {
      signals.evenOdd = this.generateEvenOddSignal(fullAnalysis.evenOdd);
      signals.evenOddStreak = this.generateStreakSignal(
        fullAnalysis.evenOdd.streaks,
        'even_odd'
      );
    }

    if (fullAnalysis.riseFall) {
      signals.riseFall = this.generateRiseFallSignal(fullAnalysis.riseFall);
      signals.riseFallStreak = this.generateStreakSignal(
        fullAnalysis.riseFall.streaks,
        'rise_fall'
      );
    }

    if (fullAnalysis.overUnder) {
      signals.overUnder = this.generateOverUnderSignal(fullAnalysis.overUnder);
    }

    if (fullAnalysis.patterns) {
      signals.pattern = this.generatePatternSignal(fullAnalysis.patterns);
    }

    if (fullAnalysis.riseFall) {
      signals.volatility = this.generateVolatilitySignal(fullAnalysis);
    }

    return Object.fromEntries(
      Object.entries(signals).filter(([, signal]) => signal !== null)
    );
  }
}

module.exports = SignalEngine;