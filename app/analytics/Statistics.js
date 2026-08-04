/**
 * Statistics
 * Advanced statistical calculations on data windows
 */

class Statistics {
  /**
   * Calculate entropy (measure of randomness/disorder)
   * Returns 0-1 where 0 is most ordered, 1 is most random
   */
  static entropy(values) {
    if (!values || values.length === 0) return 0;

    const frequency = {};
    values.forEach((val) => {
      frequency[val] = (frequency[val] || 0) + 1;
    });

    let entropy = 0;
    const len = values.length;

    Object.values(frequency).forEach((count) => {
      const p = count / len;
      entropy -= p * Math.log2(p);
    });

    return entropy;
  }

  /**
   * Calculate skewness (asymmetry of distribution)
   * Positive = right tail, Negative = left tail, 0 = symmetric
   */
  static skewness(values) {
    if (!values || values.length < 3) return 0;

    const mean = values.reduce((a, b) => a + b) / values.length;
    const std = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        values.length
    );

    if (std === 0) return 0;

    return (
      (values.reduce((sum, val) => sum + Math.pow(val - mean, 3), 0) /
        values.length) /
      Math.pow(std, 3)
    );
  }

  /**
   * Calculate kurtosis (peakedness of distribution)
   * High kurtosis = sharp peak, Low kurtosis = flat
   */
  static kurtosis(values) {
    if (!values || values.length < 4) return 0;

    const mean = values.reduce((a, b) => a + b) / values.length;
    const std = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        values.length
    );

    if (std === 0) return 0;

    return (
      (values.reduce((sum, val) => sum + Math.pow(val - mean, 4), 0) /
        values.length) /
      Math.pow(std, 4) -
      3
    );
  }

  /**
   * Calculate autocorrelation at a given lag
   * Measures how correlated the series is with itself
   */
  static autocorrelation(values, lag) {
    if (!values || values.length <= lag) return 0;

    const mean = values.reduce((a, b) => a + b) / values.length;
    let c0 = 0;
    let ck = 0;

    for (let i = 0; i < values.length - lag; i++) {
      c0 += (values[i] - mean) * (values[i + lag] - mean);
    }

    for (let i = 0; i < values.length; i++) {
      ck += Math.pow(values[i] - mean, 2);
    }

    return c0 / ck;
  }

  /**
   * Calculate moving average
   */
  static movingAverage(values, period) {
    if (!values || values.length < period) return values;

    const result = [];
    for (let i = 0; i < values.length - period + 1; i++) {
      const window = values.slice(i, i + period);
      const avg = window.reduce((a, b) => a + b) / period;
      result.push(avg);
    }
    return result;
  }

  /**
   * Calculate exponential moving average
   */
  static ema(values, period) {
    if (!values || values.length === 0) return [];

    const result = [];
    const k = 2 / (period + 1);
    let ema = values[0];
    result.push(ema);

    for (let i = 1; i < values.length; i++) {
      ema = values[i] * k + ema * (1 - k);
      result.push(ema);
    }

    return result;
  }

  /**
   * Calculate MACD (trend following momentum)
   */
  static macd(values, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (!values || values.length < slowPeriod) return null;

    const fastEma = this.ema(values, fastPeriod);
    const slowEma = this.ema(values, slowPeriod);
    const macdLine = fastEma.map(
      (val, i) => val - slowEma[slowEma.length - fastEma.length + i]
    );
    const signalLine = this.ema(macdLine, signalPeriod);
    const histogram = macdLine.map(
      (val, i) => val - signalLine[signalLine.length - macdLine.length + i]
    );

    return {
      macd: macdLine,
      signal: signalLine,
      histogram,
    };
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  static rsi(values, period = 14) {
    if (!values || values.length < period + 1) return [];

    const changes = [];
    for (let i = 1; i < values.length; i++) {
      changes.push(values[i] - values[i - 1]);
    }

    let avgGain = 0;
    let avgLoss = 0;

    for (let i = 0; i < period; i++) {
      const change = changes[i];
      if (change > 0) avgGain += change;
      else avgLoss += Math.abs(change);
    }

    avgGain /= period;
    avgLoss /= period;

    const rsi = [];
    for (let i = period; i < changes.length; i++) {
      const change = changes[i];
      if (change > 0) avgGain = (avgGain * (period - 1) + change) / period;
      else avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;

      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }

    return rsi;
  }

  /**
   * Calculate Bollinger Bands
   */
  static bollingerBands(values, period = 20, stdDevMultiplier = 2) {
    if (!values || values.length < period) return null;

    const result = [];
    for (let i = period - 1; i < values.length; i++) {
      const window = values.slice(i - period + 1, i + 1);
      const mean = window.reduce((a, b) => a + b) / period;
      const variance =
        window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);

      result.push({
        upper: mean + stdDev * stdDevMultiplier,
        middle: mean,
        lower: mean - stdDev * stdDevMultiplier,
      });
    }

    return result;
  }

  /**
   * Calculate Z-score (standard deviation from mean)
   */
  static zScore(values) {
    if (!values || values.length === 0) return [];

    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return values.map(() => 0);

    return values.map((val) => (val - mean) / stdDev);
  }

  /**
   * Normalize values to 0-1 range
   */
  static normalize(values) {
    if (!values || values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    if (range === 0) return values.map(() => 0.5);

    return values.map((val) => (val - min) / range);
  }
}

module.exports = Statistics;