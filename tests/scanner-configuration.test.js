const ScannerConfiguration = require('../app/scanner/ScannerConfiguration');

describe('ScannerConfiguration', () => {
  function createService(initial = ['R_50', 'R_75']) {
    let stored = initial;
    const settingsManager = {
      get: jest.fn(async (_key, fallback) => stored ?? fallback),
      set: jest.fn(async (_key, value) => { stored = value; return true; }),
    };
    const marketScanner = {
      setMarkets: jest.fn(async (markets) => ({ running: false, symbols: markets })),
      getStatus: jest.fn(() => ({ running: false, symbols: stored })),
    };
    return { service: new ScannerConfiguration({ settingsManager, marketScanner }), settingsManager, marketScanner };
  }

  test('normalizes, deduplicates, and uppercases configured markets', () => {
    const { service } = createService();
    expect(service.normalize([' r_50 ', 'R_50', 'r_75'])).toEqual(['R_50', 'R_75']);
  });

  test('rejects invalid configuration', () => {
    const { service } = createService();
    expect(() => service.normalize([])).toThrow();
    expect(() => service.normalize(['bad-symbol!'])).toThrow();
    expect(() => service.normalize([1])).toThrow();
  });

  test('persists and applies a new market configuration', async () => {
    const { service, settingsManager, marketScanner } = createService();
    const result = await service.setMarkets(['r_100', 'R_200']);
    expect(result.markets).toEqual(['R_100', 'R_200']);
    expect(settingsManager.set).toHaveBeenCalledWith('scannerMarkets', ['R_100', 'R_200']);
    expect(marketScanner.setMarkets).toHaveBeenCalledWith(['R_100', 'R_200']);
  });

  test('loads persisted configuration and reset restores defaults', async () => {
    const { service, settingsManager } = createService(['R_25']);
    expect(await service.getMarkets()).toEqual(['R_25']);
    await service.reset();
    expect(settingsManager.set).toHaveBeenLastCalledWith('scannerMarkets', ['R_50', 'R_75', 'R_100', 'R_200']);
  });
});
