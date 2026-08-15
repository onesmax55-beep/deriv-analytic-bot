describe('PR-036 module acceptance', () => {
  test('scanner modules are loadable', () => {
    expect(() => require('../app/scanner/MarketScanner')).not.toThrow();
    expect(() => require('../app/scanner/MarketAnalytics')).not.toThrow();
    expect(() => require('../app/scanner/MarketRanker')).not.toThrow();
  });
});
