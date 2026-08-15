const EventEmitter = require('events');
const MarketScanner = require('../app/scanner/MarketScanner');

class MockConnectionManager extends EventEmitter {
  constructor() {
    super();
    this.subscribed = new Set();
    this.subscribeCalls = [];
    this.unsubscribeCalls = [];
  }

  async subscribe(symbol) {
    this.subscribeCalls.push(symbol);
    this.subscribed.add(symbol);
  }

  async unsubscribe(symbol) {
    this.unsubscribeCalls.push(symbol);
    this.subscribed.delete(symbol);
  }
}

describe('MarketScanner', () => {
  let connection;
  let scanner;

  beforeEach(() => {
    connection = new MockConnectionManager();
    scanner = new MarketScanner({
      connectionManager: connection,
      defaultSymbols: ['r_50', 'R_75', 'R_50'],
    });
  });

  afterEach(async () => {
    await scanner.stop();
    scanner.dispose();
  });

  test('normalizes and subscribes to multiple markets', async () => {
    const status = await scanner.start();

    expect(status.running).toBe(true);
    expect(status.symbols).toEqual(['R_50', 'R_75']);
    expect(connection.subscribeCalls).toEqual(['R_50', 'R_75']);
  });

  test('keeps tick state isolated per market', async () => {
    await scanner.start(['R_50', 'R_75']);

    connection.emit('tick', { symbol: 'R_50', quote: 100.25, time: 10 });
    connection.emit('tick', { symbol: 'R_75', quote: 200.75, time: 11 });
    connection.emit('tick', { symbol: 'R_50', quote: 101.25, time: 12 });

    expect(scanner.getMarket('R_50')).toEqual(
      expect.objectContaining({
        symbol: 'R_50',
        tickCount: 2,
        lastTick: { symbol: 'R_50', quote: 101.25, time: 12 },
      })
    );
    expect(scanner.getMarket('R_75')).toEqual(
      expect.objectContaining({
        symbol: 'R_75',
        tickCount: 1,
        lastTick: { symbol: 'R_75', quote: 200.75, time: 11 },
      })
    );
  });

  test('changes active markets without duplicating subscriptions', async () => {
    await scanner.start(['R_50', 'R_75']);
    await scanner.setMarkets(['R_75', 'R_100']);

    expect(connection.unsubscribeCalls).toEqual(['R_50']);
    expect(connection.subscribeCalls).toEqual(['R_50', 'R_75', 'R_100']);
    expect(scanner.getActiveSymbols()).toEqual(['R_75', 'R_100']);
  });

  test('stops all subscriptions cleanly', async () => {
    await scanner.start(['R_50', 'R_75', 'R_100']);
    const status = await scanner.stop();

    expect(status.running).toBe(false);
    expect(status.marketCount).toBe(0);
    expect(connection.unsubscribeCalls).toEqual(['R_50', 'R_75', 'R_100']);
  });

  test('does not process ticks for inactive markets', async () => {
    await scanner.start(['R_50']);

    connection.emit('tick', { symbol: 'R_75', quote: 300, time: 20 });

    expect(scanner.getMarket('R_75')).toBeNull();
    expect(scanner.getMarket('R_50').tickCount).toBe(0);
  });
});
