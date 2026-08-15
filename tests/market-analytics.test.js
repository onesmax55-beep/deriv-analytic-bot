const MarketAnalytics = require('../app/scanner/MarketAnalytics');

describe('MarketAnalytics', () => {
  test('keeps analyzer state isolated per market', () => {
    const first = new MarketAnalytics({ symbol: 'R_50' });
    const second = new MarketAnalytics({ symbol: 'R_75' });

    [1, 2, 3, 4].forEach((value) => first.addTick(value));
    [5, 5, 5].forEach((value) => second.addTick(value));

    expect(first.getSnapshot().symbol).toBe('R_50');
    expect(second.getSnapshot().symbol).toBe('R_75');
    expect(first.getTickCount()).toBe(4);
    expect(second.getTickCount()).toBe(3);
    expect(first.getSnapshot().evenOdd.probabilities[50].even).not.toBe(
      second.getSnapshot().evenOdd.probabilities[50].even
    );
  });

  test('aggregates all supported analysis types', () => {
    const analytics = new MarketAnalytics({ symbol: 'R_100' });
    for (let i = 1; i <= 30; i += 1) analytics.addTick(i);

    const snapshot = analytics.getSnapshot();
    expect(snapshot.evenOdd).toBeDefined();
    expect(snapshot.matchesDiffers).toBeDefined();
    expect(snapshot.riseFall).toBeDefined();
    expect(snapshot.overUnder).toBeDefined();
    expect(snapshot.tickCount).toBe(30);
  });

  test('ignores non-numeric ticks', () => {
    const analytics = new MarketAnalytics({ symbol: 'R_200' });
    expect(analytics.addTick('invalid')).toBe(false);
    expect(analytics.getTickCount()).toBe(0);
  });
});
