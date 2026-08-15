const MarketRanker = require('../app/scanner/MarketRanker');

describe('MarketRanker', () => {
  test('ranks markets deterministically by score then symbol', () => {
    const ranker = new MarketRanker();
    const markets = [
      { symbol: 'R_75', updatedAt: new Date().toISOString(), analysis: {
        evenOdd: { evenPercentage: 70, oddPercentage: 30 },
        matchesDiffers: { matchPercentage: 60, differPercentage: 40 },
        riseFall: { risePercentage: 65, fallPercentage: 35 },
        overUnder: { overPercentage: 60, underPercentage: 40 },
      } },
      { symbol: 'R_50', updatedAt: new Date().toISOString(), analysis: {
        evenOdd: { evenPercentage: 55, oddPercentage: 45 },
        matchesDiffers: { matchPercentage: 51, differPercentage: 49 },
        riseFall: { risePercentage: 52, fallPercentage: 48 },
        overUnder: { overPercentage: 51, underPercentage: 49 },
      } },
    ];

    const ranked = ranker.rank(markets);
    expect(ranked[0].symbol).toBe('R_75');
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(2);
  });

  test('returns bounded score and component breakdown', () => {
    const ranker = new MarketRanker();
    const result = ranker.score({ analysis: {} });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.components).toHaveProperty('riseFall');
  });
});
