/**
 * InsightEngine
 * Generates human-readable insights from analytics data
 */

class InsightEngine {
  constructor() {
    this.insights = [];
  }

  /**
   * Generate insights from even/odd analysis
   */
  generateEvenOddInsights(evenOddData) {
    if (!evenOddData) return [];

    const insights = [];
    const prob = evenOddData.probabilities?.[250];
    if (!prob) return insights;

    const bias = Math.abs(prob.evenPercentage - prob.oddPercentage);

    if (bias > 8) {
      const leader = prob.evenPercentage > 50 ? 'even' : 'odd';
      insights.push(
        `${leader.charAt(0).toUpperCase() + leader.slice(1)} frequency exceeds its rolling average by ${bias.toFixed(1)}% over the last 250 ticks.`
      );
    }

    if (evenOddData.streaks?.currentStreak > 5) {
      insights.push(
        `${evenOddData.streaks.currentValue} streak has reached ${evenOddData.streaks.currentStreak} consecutive occurrences.`
      );
    }

    return insights;
  }

  /**
   * Generate insights from rise/fall analysis
   */
  generateRiseFallInsights(riseFallData) {
    if (!riseFallData) return [];

    const insights = [];
    const ratio = riseFallData.riseFallRatio;
    if (!ratio) return insights;

    const bias = Math.abs(ratio.risePercentage - ratio.fallPercentage);

    if (bias > 8) {
      const direction = ratio.risePercentage > 50 ? 'rise' : 'fall';
      insights.push(
        `${direction.charAt(0).toUpperCase() + direction.slice(1)} momentum is strengthening with ${ratio[`${direction}Percentage`].toFixed(1)}% directional bias.`
      );
    }

    const momentum = riseFallData.momentum;
    if (momentum && Math.abs(momentum.momentumPercentage) > 5) {
      const trend = momentum.momentumPercentage > 0 ? 'upward' : 'downward';
      insights.push(
        `Market showing ${trend} momentum with ${Math.abs(momentum.momentumPercentage).toFixed(1)}% change.`
      );
    }

    if (riseFallData.trendStrength) {
      if (riseFallData.trendStrength.trendStrength > 70) {
        insights.push('Strong directional trend detected with high conviction.');
      } else if (riseFallData.trendStrength.trendStrength < 30) {
        insights.push('Weak trend signal indicates consolidation phase.');
      }
    }

    return insights;
  }

  /**
   * Generate insights from over/under analysis
   */
  generateOverUnderInsights(overUnderData) {
    if (!overUnderData) return [];

    const insights = [];
    const dist = overUnderData.distribution;
    if (!dist) return insights;

    const bias = Math.abs(dist.overPercentage - dist.underPercentage);

    if (bias > 8) {
      const leader = dist.overPercentage > 50 ? 'over' : 'under';
      insights.push(
        `${leader} threshold (${dist.threshold}) shows ${bias.toFixed(1)}% bias in recent data.`
      );
    }

    return insights;
  }

  /**
   * Generate insights from pattern analysis
   */
  generatePatternInsights(patternData) {
    if (!patternData) return [];

    const insights = [];
    const patterns = patternData.patterns || {};

    // Check for repeating patterns
    Object.entries(patterns).forEach(([lengthKey, patternList]) => {
      if (
        Array.isArray(patternList) &&
        patternList.length > 0 &&
        patternList[0].frequency > 0.05
      ) {
        const len = lengthKey.replace('len', '');
        insights.push(
          `Repeating ${len}-tick pattern detected with ${(patternList[0].frequency * 100).toFixed(1)}% frequency.`
        );
      }
    });

    // Check for anomalies
    if (patternData.anomalies && patternData.anomalies.length > 0) {
      insights.push(
        `${patternData.anomalies.length} statistical anomalies detected in recent ticks.`
      );
    }

    // Check for compression/expansion
    if (patternData.compressionExpansion) {
      const ce = patternData.compressionExpansion;
      if (ce.state === 'expansion') {
        insights.push(
          `Volatility expanding significantly (${ce.volatilityChange.toFixed(1)}% increase).`
        );
      } else if (ce.state === 'compression') {
        insights.push(
          `Market consolidating with ${Math.abs(ce.volatilityChange).toFixed(1)}% volatility decrease.`
        );
      }
    }

    return insights;
  }

  /**
   * Generate volatility insights
   */
  generateVolatilityInsights(volatilityData) {
    if (!volatilityData) return [];

    const insights = [];
    const vol = volatilityData.volatility;
    if (!vol) return insights;

    if (vol.volatilityLevel === 'high') {
      insights.push(
        `High volatility environment detected (StdDev: ${vol.standardDeviation.toFixed(2)}).`
      );
    } else if (vol.volatilityLevel === 'low') {
      insights.push(
        `Low volatility period - market showing stability (StdDev: ${vol.standardDeviation.toFixed(2)}).`
      );
    }

    return insights;
  }

  /**
   * Generate warning insights
   */
  generateWarningInsights(fullAnalysis) {
    const warnings = [];

    // Data sufficiency warning
    if (fullAnalysis.tickCount && fullAnalysis.tickCount < 50) {
      warnings.push(
        'Insufficient data - increase sample size for reliable analysis.'
      );
    }

    // Conflicting signals warning
    if (fullAnalysis.signals) {
      const signals = Object.values(fullAnalysis.signals).filter(
        (s) => s && s.confidence > 60
      );
      if (signals.length === 0) {
        warnings.push('No high-confidence signals currently - market uncertainty.');
      }
    }

    return warnings;
  }

  /**
   * Generate all insights
   */
  generateAllInsights(fullAnalysis) {
    const allInsights = [];

    if (fullAnalysis.evenOdd) {
      allInsights.push(...this.generateEvenOddInsights(fullAnalysis.evenOdd));
    }

    if (fullAnalysis.riseFall) {
      allInsights.push(...this.generateRiseFallInsights(fullAnalysis.riseFall));
    }

    if (fullAnalysis.overUnder) {
      allInsights.push(...this.generateOverUnderInsights(fullAnalysis.overUnder));
    }

    if (fullAnalysis.patterns) {
      allInsights.push(...this.generatePatternInsights(fullAnalysis.patterns));
    }

    // Volatility insights from riseFall (contains volatility data)
    if (fullAnalysis.riseFall) {
      allInsights.push(...this.generateVolatilityInsights(fullAnalysis));
    }

    allInsights.push(...this.generateWarningInsights(fullAnalysis));

    return allInsights;
  }
}

module.exports = InsightEngine;