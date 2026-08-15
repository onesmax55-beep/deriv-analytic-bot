describe('PR-036 acceptance contract', () => {
  test('scanner modules are loadable', () => {
    expect(() => require('../app/scanner/MarketScanner')).not.toThrow();
    expect(() => require('../app/scanner/MarketAnalytics')).not.toThrow();
    expect(() => require('../app/scanner/MarketRanker')).not.toThrow();
  });

  test('scanner preload surface is defined', () => {
    const preload = require('../app/preload');
    expect(preload).toBeDefined();
  });
});
