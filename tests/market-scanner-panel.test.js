'use strict';

const MarketScannerPanel = require('../app/ui/MarketScannerPanel');

describe('MarketScannerPanel configuration UI', () => {
  let container;

  beforeEach(() => {
    container = {
      innerHTML: '',
      querySelector: jest.fn(() => null),
      querySelectorAll: jest.fn(() => []),
    };
    global.document = { getElementById: jest.fn(() => container) };
  });

  afterEach(() => {
    delete global.document;
  });

  test('loads persisted scanner configuration alongside live markets', async () => {
    const api = {
      getStatus: jest.fn().mockResolvedValue({ running: true }),
      getMarkets: jest.fn().mockResolvedValue([{ symbol: 'R_100', score: 80 }]),
      configuration: { get: jest.fn().mockResolvedValue(['R_50', 'R_100']) },
    };
    const panel = new MarketScannerPanel('scanner', api);
    panel.render = jest.fn();

    const result = await panel.refresh();

    expect(result.configuredMarkets).toEqual(['R_50', 'R_100']);
    expect(panel.configuredMarkets).toEqual(['R_50', 'R_100']);
    expect(api.configuration.get).toHaveBeenCalledTimes(1);
  });

  test('applies only checked market selections through the secure configuration API', async () => {
    const checked = [{ value: 'R_50' }, { value: 'R_100' }];
    container.querySelectorAll.mockReturnValue(checked);
    const api = {
      configuration: { set: jest.fn().mockResolvedValue(['R_50', 'R_100']) },
      getStatus: jest.fn().mockResolvedValue({ running: false }),
      getMarkets: jest.fn().mockResolvedValue([]),
    };
    const panel = new MarketScannerPanel('scanner', api);
    panel.render = jest.fn();

    await panel.applyConfiguration();

    expect(api.configuration.set).toHaveBeenCalledWith(['R_50', 'R_100']);
    expect(panel.configuredMarkets).toEqual(['R_50', 'R_100']);
  });

  test('rejects applying an empty market selection', async () => {
    const api = { configuration: { set: jest.fn() } };
    const panel = new MarketScannerPanel('scanner', api);

    await expect(panel.applyConfiguration()).rejects.toThrow('Select at least one market');
    expect(api.configuration.set).not.toHaveBeenCalled();
  });

  test('reset uses the configuration reset API and refreshes the panel', async () => {
    const api = {
      configuration: { reset: jest.fn().mockResolvedValue(['R_50', 'R_75', 'R_100', 'R_200']) },
      getStatus: jest.fn().mockResolvedValue({ running: false }),
      getMarkets: jest.fn().mockResolvedValue([]),
    };
    const panel = new MarketScannerPanel('scanner', api);
    panel.render = jest.fn();

    await panel.resetConfiguration();

    expect(api.configuration.reset).toHaveBeenCalledTimes(1);
    expect(panel.configuredMarkets).toEqual(['R_50', 'R_75', 'R_100', 'R_200']);
  });
});
