/**
 * MarketRanker
 * Deterministic ranking of scanner market snapshots.
 */

class MarketRanker {
  constructor(options = {}) {
    this.weights = {
      evenOdd: 0.2,
      matchesDiffers: 0.2,
      riseFall: 0.25,
      overUnder: 0.2,
      freshness: 0.15,
      ...options.weights,
    };
  }

  score(snapshot = {}) {
    const analysis = snapshot.analysis || {};
    const components = {
      evenOdd: this._evenOdd(analysis.evenOdd),
      matchesDiffers: this._matchesDiffers(analysis.matchesDiffers),
      riseFall: this._riseFall(analysis.riseFall),
      overUnder: this._overUnder(analysis.overUnder),
      freshness: this._freshness(snapshot.updatedAt),
    };

    const totalWeight = Object.values(this.weights).reduce((sum, value) => sum + value, 0) || 1;
    const score = Object.keys(components).reduce(
      (sum, key) => sum + components[key] * (this.weights[key] || 0),
      0
    ) / totalWeight;

    return {
      score: Math.round(Math.max(0, Math.min(100, score)) * 100) / 100,
      components,
      confidence: Math.round(Math.max(0, Math.min(100, score)) * 100) / 100,
    };
  }

  rank(markets = []) {
    return markets
      .map((market) => ({
        ...market,
        ranking: this.score(market),
      }))
      .sort((a, b) => {
        const scoreDiff = b.ranking.score - a.ranking.score;
        if (scoreDiff !== 0) return scoreDiff;
        return String(a.symbol || '').localeCompare(String(b.symbol || ''));
      })
      .map((market, index) => ({ ...market, rank: index + 1 }));
  }

  _evenOdd(data) {
    if (!data) return 0;
    const even = Number(data.evenPercentage ?? data.even ?? 0);
    const odd = Number(data.oddPercentage ?? data.odd ?? 0);
    return Math.min(100, Math.abs(even - odd) * 2);
  }

  _matchesDiffers(data) {
    if (!data) return 0;
    const match = Number(data.matchPercentage ?? 0);
    const differ = Number(data.differPercentage ?? 0);
    return Math.min(100, Math.abs(match - differ) * 2);
  }

  _riseFall(data) {
    if (!data) return 0;
    const rise = Number(data.risePercentage ?? 0);
    const fall = Number(data.fallPercentage ?? 0);
    return Math.min(100, Math.abs(rise - fall) * 2);
  }

  _overUnder(data) {
    if (!data) return 0;
    const over = Number(data.overPercentage ?? 0);
    const under = Number(data.underPercentage ?? 0);
    return Math.min(100, Math.abs(over - under) * 2);
  }

  _freshness(updatedAt) {
    if (!updatedAt) return 0;
    const age = Math.max(0, Date.now() - new Date(updatedAt).getTime());
    return Math.max(0, 100 - age / 1000);
  }
}

module.exports = MarketRanker;
