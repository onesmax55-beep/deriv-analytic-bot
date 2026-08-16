const MarketScannerPanel = require('../app/ui/MarketScannerPanel');

describe('MarketScannerPanel live updates', () => {
  function createDom() {
    const listeners = new Map();
    const status = { textContent: '' };
    const tbody = { innerHTML: '' };
    const container = {
      innerHTML: '',
      querySelector(selector) {
        if (selector === '.market-scanner-status') return status;
        if (selector === 'tbody') return tbody;
        return null;
      },
      querySelectorAll() { return []; },
    };
    global.document = { getElementById: () => container };
    return { container, listeners };
  }

  test('subscribes once and renders live market updates', () => {
    const { container } = createDom();
    const subscriptions = new Map();
    const api = {
      on: jest.fn((event, callback) => {
        subscriptions.set(event, callback);
        return jest.fn(() => subscriptions.delete(event));
      }),
    };
    const panel = new MarketScannerPanel('scanner', api);
    panel.render();
    panel.subscribe();
    expect(api.on).toHaveBeenCalledTimes(9);

    subscriptions.get('market-tick')({ symbol: 'R_50', lastTick: { quote: 123.45 }, score: 91 });
    expect(panel.markets).toEqual([{ symbol: 'R_50', lastTick: { quote: 123.45 }, score: 91 }]);
    expect(container.querySelector('tbody').innerHTML).toContain('R_50');
    expect(container.querySelector('tbody').innerHTML).toContain('123.45');
  });

  test('destroy removes every live subscription', () => {
    createDom();
    const unsubscribers = [];
    const api = { on: jest.fn(() => { const fn = jest.fn(); unsubscribers.push(fn); return fn; }) };
    const panel = new MarketScannerPanel('scanner', api);
    panel.subscribe();
    panel.destroy();
    expect(unsubscribers).toHaveLength(9);
    unsubscribers.forEach((fn) => expect(fn).toHaveBeenCalledTimes(1));
    expect(panel.bound).toBe(false);
  });
});
