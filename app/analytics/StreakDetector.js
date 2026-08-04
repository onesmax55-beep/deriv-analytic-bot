/**
 * StreakDetector
 * Identifies and tracks streaks in the data
 */

class StreakDetector {
  /**
   * Detect current streak and longest streak
   */
  static detectStreaks(values) {
    if (!values || values.length === 0) {
      return {
        currentStreak: 0,
        currentValue: null,
        longestStreak: 0,
        longestValue: null,
        streaks: [],
      };
    }

    const streaks = [];
    let currentValue = values[0];
    let currentCount = 1;
    let longestStreak = 1;
    let longestValue = values[0];

    for (let i = 1; i < values.length; i++) {
      if (values[i] === currentValue) {
        currentCount++;
        if (currentCount > longestStreak) {
          longestStreak = currentCount;
          longestValue = currentValue;
        }
      } else {
        streaks.push({
          value: currentValue,
          count: currentCount,
          startIndex: i - currentCount,
          endIndex: i - 1,
        });
        currentValue = values[i];
        currentCount = 1;
      }
    }

    // Add final streak
    streaks.push({
      value: currentValue,
      count: currentCount,
      startIndex: values.length - currentCount,
      endIndex: values.length - 1,
    });

    return {
      currentStreak: currentCount,
      currentValue,
      longestStreak,
      longestValue,
      streaks,
    };
  }

  /**
   * Detect even/odd streaks
   */
  static detectEvenOddStreaks(values) {
    const parityValues = values.map((v) => (v % 2 === 0 ? 'even' : 'odd'));
    return this.detectStreaks(parityValues);
  }

  /**
   * Detect rise/fall streaks
   */
  static detectRiseFallStreaks(values) {
    if (!values || values.length < 2) {
      return {
        currentStreak: 0,
        currentDirection: null,
        longestStreak: 0,
        longestDirection: null,
        streaks: [],
      };
    }

    const directions = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) {
        directions.push('rise');
      } else if (values[i] < values[i - 1]) {
        directions.push('fall');
      } else {
        directions.push('neutral');
      }
    }

    const streakData = this.detectStreaks(directions);
    return streakData;
  }

  /**
   * Detect over/under streaks based on threshold
   */
  static detectOverUnderStreaks(values, threshold) {
    const overUnderValues = values.map((v) =>
      v >= threshold ? 'over' : 'under'
    );
    return this.detectStreaks(overUnderValues);
  }

  /**
   * Get streak statistics
   */
  static getStreakStats(streaks) {
    if (!streaks || streaks.length === 0) {
      return {
        totalStreaks: 0,
        averageStreakLength: 0,
        maxStreakLength: 0,
        minStreakLength: 0,
      };
    }

    const lengths = streaks.map((s) => s.count);
    const totalStreaks = streaks.length;
    const averageStreakLength = lengths.reduce((a, b) => a + b) / lengths.length;
    const maxStreakLength = Math.max(...lengths);
    const minStreakLength = Math.min(...lengths);

    return {
      totalStreaks,
      averageStreakLength,
      maxStreakLength,
      minStreakLength,
    };
  }

  /**
   * Predict next value in streak
   */
  static predictNextInStreak(values, currentValue) {
    const streaks = this.detectStreaks(values);
    if (!streaks || streaks.length === 0) return null;

    // Filter streaks with the current value
    const relevantStreaks = streaks.filter((s) => s.value === currentValue);
    if (relevantStreaks.length === 0) return null;

    // Calculate average streak length for this value
    const avgLength =
      relevantStreaks.reduce((sum, s) => sum + s.count, 0) /
      relevantStreaks.length;

    // Find the next value that typically follows this streak
    const nextValues = [];
    relevantStreaks.forEach((streak) => {
      if (streak.endIndex + 1 < values.length) {
        nextValues.push(values[streak.endIndex + 1]);
      }
    });

    if (nextValues.length === 0) return null;

    // Return most common next value
    const frequency = {};
    nextValues.forEach((v) => {
      frequency[v] = (frequency[v] || 0) + 1;
    });

    let mostCommon = nextValues[0];
    let maxCount = 0;
    Object.entries(frequency).forEach(([val, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = val;
      }
    });

    return {
      predictedValue: mostCommon,
      averageStreakLength: avgLength,
      confidence: maxCount / nextValues.length,
    };
  }
}

module.exports = StreakDetector;