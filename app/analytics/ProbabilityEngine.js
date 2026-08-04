/**
 * ProbabilityEngine
 * Calculates rolling probabilities and Bayesian updates
 */

class ProbabilityEngine {
  /**
   * Calculate probability distribution
   */
  static distribution(values) {
    if (!values || values.length === 0) return {};

    const frequency = {};
    values.forEach((val) => {
      frequency[val] = (frequency[val] || 0) + 1;
    });

    const distribution = {};
    const total = values.length;

    Object.entries(frequency).forEach(([val, count]) => {
      distribution[val] = {
        count,
        probability: count / total,
        percentage: (count / total) * 100,
      };
    });

    return distribution;
  }

  /**
   * Calculate even/odd probabilities
   */
  static evenOddProbability(values) {
    if (!values || values.length === 0) {
      return { even: 0, odd: 0 };
    }

    let evenCount = 0;
    let oddCount = 0;

    values.forEach((val) => {
      if (val % 2 === 0) {
        evenCount++;
      } else {
        oddCount++;
      }
    });

    const total = values.length;

    return {
      even: evenCount / total,
      odd: oddCount / total,
      evenCount,
      oddCount,
      evenPercentage: (evenCount / total) * 100,
      oddPercentage: (oddCount / total) * 100,
    };
  }

  /**
   * Calculate expected value
   */
  static expectedValue(values, probabilities = null) {
    if (!values || values.length === 0) return 0;

    if (!probabilities) {
      return values.reduce((a, b) => a + b) / values.length;
    }

    return values.reduce((sum, val, i) => sum + val * probabilities[i], 0);
  }

  /**
   * Calculate confidence interval (95%)
   */
  static confidenceInterval(values, confidence = 0.95) {
    if (!values || values.length < 2) {
      return { lower: 0, upper: 0, margin: 0 };
    }

    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      (values.length - 1);
    const stdErr = Math.sqrt(variance / values.length);

    // Z-score for 95% confidence
    const z = confidence === 0.95 ? 1.96 : 2.576; // 99%
    const margin = z * stdErr;

    return {
      mean,
      lower: mean - margin,
      upper: mean + margin,
      margin,
      stdErr,
    };
  }

  /**
   * Bayesian update: P(A|B) = P(B|A) * P(A) / P(B)
   */
  static bayesianUpdate(priorA, likelihoodB, marginB) {
    if (marginB === 0) return priorA;
    return (likelihoodB * priorA) / marginB;
  }

  /**
   * Calculate transition probabilities (Markov chain)
   */
  static transitionProbabilities(values, states = null) {
    if (!values || values.length < 2) return {};

    // Auto-detect states if not provided
    if (!states) {
      states = [...new Set(values)];
    }

    const transitions = {};
    states.forEach((state) => {
      transitions[state] = {};
      states.forEach((nextState) => {
        transitions[state][nextState] = 0;
      });
    });

    // Count transitions
    for (let i = 0; i < values.length - 1; i++) {
      const current = values[i];
      const next = values[i + 1];
      if (transitions[current]) {
        transitions[current][next]++;
      }
    }

    // Normalize to probabilities
    Object.entries(transitions).forEach(([state, nextStates]) => {
      const total = Object.values(nextStates).reduce((a, b) => a + b, 0);
      if (total > 0) {
        Object.keys(nextStates).forEach((nextState) => {
          transitions[state][nextState] /= total;
        });
      }
    });

    return transitions;
  }

  /**
   * Calculate probability of streak continuation
   */
  static streakContinuationProbability(currentValue, transitionProbs) {
    if (!transitionProbs[currentValue]) return 0.5;
    return transitionProbs[currentValue][currentValue] || 0.5;
  }

  /**
   * Chi-square test for independence
   */
  static chiSquareTest(observed, expected) {
    if (
      !observed ||
      !expected ||
      observed.length !== expected.length ||
      observed.length === 0
    ) {
      return { chiSquare: 0, pValue: 1 };
    }

    let chiSquare = 0;
    observed.forEach((obs, i) => {
      const exp = expected[i];
      if (exp > 0) {
        chiSquare += Math.pow(obs - exp, 2) / exp;
      }
    });

    return { chiSquare, pValue: chiSquare }; // Simplified p-value
  }
}

module.exports = ProbabilityEngine;