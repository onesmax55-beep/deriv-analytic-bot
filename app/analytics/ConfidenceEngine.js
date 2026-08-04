/**
 * ConfidenceEngine
 * Calculates overall confidence scores for analytics
 */

class ConfidenceEngine {
  constructor(options = {}) {
    this.minDataPoints = options.minDataPoints || 50;
    this.sufficiencyWeights = {
      small: 0.4,    // < 100 points
      medium: 0.7,   // 100-500 points
      large: 1.0,    // > 500 points
    };
  }

  /**
   * Calculate data sufficiency confidence
   */
  calculateDataSufficiency(tickCount) {
    if (tickCount < this.minDataPoints) return 0.1;
    if (tickCount < 100) return this.sufficiencyWeights.small;
    if (tickCount < 500) return this.sufficiencyWeights.medium;
    return this.sufficiencyWeights.large;
  }

  /**
   * Calculate pattern reliability
   */
  calculatePatternReliability(patterns) {
    if (!patterns || Object.keys(patterns).length === 0) return 0;

    let reliabilityScore = 0;
    let patternCount = 0;

    Object.entries(patterns).forEach(([, patternList]) => {
      if (Array.isArray(patternList)) {
        patternList.forEach((pattern) => {
          // Higher frequency = higher reliability
          reliabilityScore += Math.min(1, pattern.frequency * 2);
          patternCount++;
        });
      }
    });

    return patternCount === 0 ? 0 : reliabilityScore / patternCount;
  }

  /**
   * Calculate distribution quality
   */
  calculateDistributionQuality(distribution) {
    if (!distribution) return 0;

    // Check if distribution is reasonably balanced (not heavily skewed)
    const expectedEven = 50;
    const diff = Math.abs(
      (distribution.evenPercentage || 50) - expectedEven
    );
    const quality = 100 - diff;

    return Math.max(0, Math.min(100, quality)) / 100;
  }

  /**
   * Calculate signal strength
   */
  calculateSignalStrength(signals) {
    if (!signals || Object.keys(signals).length === 0) return 0;

    let totalStrength = 0;
    let signalCount = 0;

    Object.values(signals).forEach((signal) => {
      if (signal && signal.confidence !== undefined) {
        totalStrength += signal.confidence;
        signalCount++;
      }
    });

    return signalCount === 0 ? 0 : totalStrength / signalCount / 100;
  }

  /**
   * Calculate streak consistency
   */
  calculateStreakConsistency(streaks) {
    if (!streaks || streaks.length === 0) return 0;

    // If streaks are consistent (similar lengths), confidence is higher
    const lengths = streaks.map((s) => s.count);
    const mean = lengths.reduce((a, b) => a + b) / lengths.length;
    const variance =
      lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) /
      lengths.length;
    const stdDev = Math.sqrt(variance);

    // Lower variance = higher consistency
    const consistency = Math.exp(-stdDev / 10);
    return consistency;
  }

  /**
   * Calculate entropy score (0 = ordered, 1 = random)
   */
  calculateEntropyConfidence(entropy) {
    if (entropy === undefined) return 0.5;
    // Convert entropy to confidence (random data gets lower confidence)
    return 1 - entropy / 10; // Normalized entropy
  }

  /**
   * Calculate momentum quality
   */
  calculateMomentumQuality(momentum) {
    if (!momentum || momentum.momentum === undefined) return 0.5;

    // Strong momentum = higher confidence
    const absChange = Math.abs(momentum.momentum);
    const quality = Math.min(1, absChange / 10);
    return quality;
  }

  /**
   * Composite confidence score (weighted average)
   */
  calculateCompositeConfidence(analysisData) {
    const weights = {
      dataSufficiency: 0.15,
      patternReliability: 0.2,
      distributionQuality: 0.15,
      signalStrength: 0.2,
      streakConsistency: 0.15,
      entropy: 0.1,
      momentum: 0.05,
    };

    let compositeScore = 0;

    if (analysisData.dataSufficiency !== undefined) {
      compositeScore +=
        analysisData.dataSufficiency * weights.dataSufficiency;
    }
    if (analysisData.patternReliability !== undefined) {
      compositeScore +=
        analysisData.patternReliability * weights.patternReliability;
    }
    if (analysisData.distributionQuality !== undefined) {
      compositeScore +=
        analysisData.distributionQuality * weights.distributionQuality;
    }
    if (analysisData.signalStrength !== undefined) {
      compositeScore += analysisData.signalStrength * weights.signalStrength;
    }
    if (analysisData.streakConsistency !== undefined) {
      compositeScore +=
        analysisData.streakConsistency * weights.streakConsistency;
    }
    if (analysisData.entropy !== undefined) {
      compositeScore += analysisData.entropy * weights.entropy;
    }
    if (analysisData.momentum !== undefined) {
      compositeScore += analysisData.momentum * weights.momentum;
    }

    return Math.round(compositeScore * 100);
  }

  /**
   * Get confidence breakdown
   */
  getConfidenceBreakdown(analysisData) {
    return {
      dataSufficiency: analysisData.dataSufficiency
        ? Math.round(analysisData.dataSufficiency * 100)
        : 0,
      patternReliability: analysisData.patternReliability
        ? Math.round(analysisData.patternReliability * 100)
        : 0,
      distributionQuality: analysisData.distributionQuality
        ? Math.round(analysisData.distributionQuality * 100)
        : 0,
      signalStrength: analysisData.signalStrength
        ? Math.round(analysisData.signalStrength * 100)
        : 0,
      streakConsistency: analysisData.streakConsistency
        ? Math.round(analysisData.streakConsistency * 100)
        : 0,
      entropy: analysisData.entropy
        ? Math.round(analysisData.entropy * 100)
        : 0,
      momentum: analysisData.momentum
        ? Math.round(analysisData.momentum * 100)
        : 0,
    };
  }
}

module.exports = ConfidenceEngine;