/**
 * RiseFallAnalyzer
 * Analyzes price movement direction and momentum
 */

const RollingWindow = require('./RollingWindow');
const Statistics = require('./Statistics');
const StreakDetector = require('./StreakDetector');

class RiseFallAnalyzer {
  constructor(options = {}) {
    this.windowSizes = options.windowSizes || [50, 100, 250, 500, 1000];
    this.windows = new Map();
    this.allTicks = [];
    this.movements = [];
    this.momenta = [];

    // Initialize windows
    this.windowSizes.forEach((size) => {
      this.windows.set(size, new RollingWindow(size));
    });
  }

  /**
   * Add a tick value
   */
  addTick(value) {
    if (this.allTicks.length > 0) {
      const prevValue = this.allTicks[this.allTicks.length - 1];
      const movement = value - prevValue;
      this.movements.push({
        value,
        previous: prevValue,
        change: movement,
        direction: movement > 0 ? 'rise' : movement < 0 ? 'fall' : 'neutral',
        percentage: (movement / prevValue) * 100,
      });
    }

    this.allTicks.push(value);
    this.windows.forEach((window) => {
      window.push(value);
    });
  }

  /**
   * Get rise/fall ratio
   */
  getRiseFallRatio() {
    if (this.movements.length === 0) {
      return {
        rises: 0,
        falls: 0,
        neutral: 0,
        risePercentage: 0,
        fallPercentage: 0,
        neutralPercentage: 0,
      };
    }

    let rises = 0;
    let falls = 0;
    let neutral = 0;

    this.movements.forEach((m) => {
      if (m.direction === 'rise') rises++;
      else if (m.direction === 'fall') falls++;
      else neutral++;
    });

    const total = this.movements.length;

    return {
      rises,
      falls,
      neutral,
      total,
      risePercentage: (rises / total) * 100,
      fallPercentage: (falls / total) * 100,
      neutralPercentage: (neutral / total) * 100,
    };
  }

  /**
   * Calculate momentum (rate of change)
   */
  getMomentum(period = 10) {
    if (this.allTicks.length < period + 1) return null;

    const recent = this.allTicks.slice(-period - 1);
    const momentum = recent[recent.length - 1] - recent[0];
    const momentumPercentage = (momentum / recent[0]) * 100;

    return {
      momentum,
      momentumPercentage,
      period,
    };
  }

  /**
   * Get trend strength using standard deviation of movements
   */
  getTrendStrength(windowSize = 100) {
    if (this.movements.length < windowSize) return null;

    const recentMovements = this.movements
      .slice(-windowSize)
      .map((m) => m.change);
    const stdDev = Statistics.normalize([...recentMovements])[0]; // simplified

    // Calculate trend strength (0-100)
    const mean = recentMovements.reduce((a, b) => a + b) / recentMovements.length;
    const absMean = Math.abs(mean);
    const maxPossible = Math.max(...recentMovements.map(Math.abs));

    const trendStrength = maxPossible === 0 ? 0 : (absMean / maxPossible) * 100;

    return {
      trendStrength: Math.min(100, trendStrength),
      mean,
      stdDev: Statistics.normalize(recentMovements).reduce((a, b) => a + b) / recentMovements.length,
    };
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  getEMA(period = 12) {
    if (this.allTicks.length < period) return null;

    const emas = Statistics.ema(this.allTicks, period);
    return {
      currentEMA: emas[emas.length - 1],
      period,
      allEMAs: emas,
    };
  }

  /**
   * Calculate SMA (Simple Moving Average)
   */
  getSMA(period = 20) {
    if (this.allTicks.length < period) return null;

    const smas = Statistics.movingAverage(this.allTicks, period);
    return {
      currentSMA: smas[smas.length - 1],
      period,
      allSMAs: smas,
    };
  }

  /**
   * Get MACD (trend following momentum indicator)
   */
  getMACD() {
    if (this.allTicks.length < 26) return null;

    const macd = Statistics.macd(this.allTicks);
    if (!macd) return null;

    return {
      macdLine: macd.macd[macd.macd.length - 1],
      signalLine: macd.signal[macd.signal.length - 1],
      histogram: macd.histogram[macd.histogram.length - 1],
      trend: macd.histogram[macd.histogram.length - 1] > 0 ? 'bullish' : 'bearish',
    };
  }

  /**
   * Get breakout detection
   */
  getBreakoutDetection(windowSize = 100) {
    if (this.allTicks.length < windowSize) return null;

    const recentPrices = this.allTicks.slice(-windowSize);
    const resistance = Math.max(...recentPrices);
    const support = Math.min(...recentPrices);
    const currentPrice = this.allTicks[this.allTicks.length - 1];

    return {
      resistance,
      support,
      currentPrice,
      breakoutAbove: currentPrice > resistance,
      breakoutBelow: currentPrice < support,
      distanceFromResistance: ((resistance - currentPrice) / resistance) * 100,
      distanceFromSupport: ((currentPrice - support) / support) * 100,
    };
  }

  /**
   * Calculate market pressure (directional bias)
   */
  getMarketPressure(windowSize = 50) {
    if (this.movements.length < windowSize) return null;

    const recentMovements = this.movements.slice(-windowSize);
    const avgRise = recentMovements
      .filter((m) => m.direction === 'rise')
      .reduce((sum, m) => sum + m.change, 0) / recentMovements.filter((m) => m.direction === 'rise').length || 0;

    const avgFall = Math.abs(
      recentMovements
        .filter((m) => m.direction === 'fall')
        .reduce((sum, m) => sum + m.change, 0) /
        (recentMovements.filter((m) => m.direction === 'fall').length || 1)
    );

    const pressure = avgRise - avgFall;

    return {
      pressure,
      bias: pressure > 0 ? 'bullish' : pressure < 0 ? 'bearish' : 'neutral',
      avgRise,
      avgFall,
    };
  }

  /**
   * Get streaks in rise/fall movements
   */
  getStreaks() {
    const directions = this.movements.map((m) => m.direction);
    return StreakDetector.detectStreaks(directions);
  }

  /**
   * Get volatility measure
   */
  getVolatility(windowSize = 100) {
    if (this.allTicks.length < windowSize) return null;

    const window = this.windows.get(windowSize) || new RollingWindow(windowSize);
    if (!window.isFilled()) return null;

    const values = window.getValues();
    const stdDev = window.getStdDev();
    const mean = window.getMean();

    return {
      standardDeviation: stdDev,
      coefficient: mean === 0 ? 0 : (stdDev / mean) * 100,
      volatilityLevel: stdDev < 0.5 ? 'low' : stdDev < 1.5 ? 'medium' : 'high',
    };
  }

  /**
   * Get complete analysis snapshot
   */
  getSnapshot() {
    return {
      riseFallRatio: this.getRiseFallRatio(),
      momentum: this.getMomentum(),
      trendStrength: this.getTrendStrength(),
      ema: this.getEMA(),
      sma: this.getSMA(),
      macd: this.getMACD(),
      breakout: this.getBreakoutDetection(),
      marketPressure: this.getMarketPressure(),
      streaks: this.getStreaks(),
      volatility: this.getVolatility(),
      tickCount: this.allTicks.length,
    };
  }

  /**
   * Reset analyzer
   */
  reset() {
    this.allTicks = [];
    this.movements = [];
    this.momenta = [];
    this.windows.forEach((window) => {
      window.reset();
    });
  }
}

module.exports = RiseFallAnalyzer;