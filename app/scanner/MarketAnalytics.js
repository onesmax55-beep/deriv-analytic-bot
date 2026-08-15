/**
 * MarketAnalytics
 * Owns one isolated set of analytics analyzers for a scanned market.
 */

const EvenOddAnalyzer = require('../analytics/EvenOddAnalyzer');
const MatchesDiffersAnalyzer = require('../analytics/MatchesDiffersAnalyzer');
const RiseFallAnalyzer = require('../analytics/RiseFallAnalyzer');
const OverUnderAnalyzer = require('../analytics/OverUnderAnalyzer');

class MarketAnalytics {
  constructor(options = {}) {
    this.symbol = options.symbol;
    this.analyzerOptions = options.analyzerOptions || {};
    this.reset();
  }

  reset() {
    this.evenOdd = new EvenOddAnalyzer(this.analyzerOptions);
    this.matchesDiffers = new MatchesDiffersAnalyzer(this.analyzerOptions);
    this.riseFall = new RiseFallAnalyzer(this.analyzerOptions);
    this.overUnder = new OverUnderAnalyzer(this.analyzerOptions);
  }

  addTick(quote) {
    const value = Number(quote);
    if (!Number.isFinite(value)) return false;

    this.evenOdd.addTick(value);
    this.matchesDiffers.addTick(value);
    this.riseFall.addTick(value);
    this.overUnder.addTick(value);
    return true;
  }

  getSnapshot() {
    return {
      symbol: this.symbol,
      tickCount: this.riseFall.allTicks.length,
      evenOdd: this.evenOdd.getSnapshot(),
      matchesDiffers: this.matchesDiffers.getSnapshot(),
      riseFall: this.riseFall.getSnapshot(),
      overUnder: this.overUnder.getSnapshot(),
    };
  }

  getTickCount() {
    return this.riseFall.allTicks.length;
  }
}

module.exports = MarketAnalytics;
