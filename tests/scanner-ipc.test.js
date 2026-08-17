jest.mock('electron', () => ({ ipcMain: { handlers: new Map(), handle(name, fn) { this.handlers.set(name, fn); }, removeHandler(name) { this.handlers.delete(name); } } }));

const { ipcMain } = require('electron');
const { registerIPC, cleanupIPC } = require('../app/ipc');

describe('scanner IPC', () => {
  afterEach(() => cleanupIPC());

  test('registers scanner handlers and validates market lists', async () => {
    const scanner = {
      start: jest.fn(() => ({ running: true })),
      stop: jest.fn(() => ({ running: false })),
      getStatus: jest.fn(() => ({ running: true })),
      getMarkets: jest.fn(() => ['R_50']),
      setMarkets: jest.fn((markets) => markets),
      refresh: jest.fn(() => ({ refreshed: true })),
      on: jest.fn(),
      off: jest.fn(),
    };
    const settingsManager = { set: jest.fn(async (_key, value) => value), get: jest.fn(async () => ['R_50']) };
    const connectionManager = { getStatus: jest.fn(() => ({ connected: true })), connect: jest.fn() };
    const scannerConfiguration = {
      normalize: jest.fn((markets) => {
        if (!Array.isArray(markets) || !markets.length) throw new Error('At least one market is required');
        if (markets.some((m) => typeof m !== 'string' || !/^[A-Za-z0-9_]+$/.test(m.trim()))) throw new Error('Invalid market symbol');
        return [...new Set(markets.map((m) => m.trim().toUpperCase()))];
      }),
      getMarkets: jest.fn(async () => ['R_50']),
      setMarkets: jest.fn(async (markets) => ({ markets, status: { running: true } })),
      reset: jest.fn(async () => ({ markets: ['R_50', 'R_75', 'R_100', 'R_200'] })),
    };

    await registerIPC(null, { marketScanner: scanner, settingsManager, connectionManager, scannerConfiguration });
    expect(ipcMain.handlers.has('scanner:start')).toBe(true);
    expect(ipcMain.handlers.has('scanner:config:get')).toBe(true);
    expect(ipcMain.handlers.has('scanner:config:set')).toBe(true);
    expect(ipcMain.handlers.has('scanner:config:reset')).toBe(true);
    expect(scanner.on).toHaveBeenCalledTimes(10);

    const result = await ipcMain.handlers.get('scanner:set-markets')(null, ['R_50', 'R_75']);
    expect(result).toEqual({ markets: ['R_50', 'R_75'], status: { running: true } });
    expect(scannerConfiguration.setMarkets).toHaveBeenCalledWith(['R_50', 'R_75']);

    await expect(ipcMain.handlers.get('scanner:set-markets')(null, [])).rejects.toThrow();
    await expect(ipcMain.handlers.get('scanner:set-markets')(null, ['bad-symbol!'])).rejects.toThrow();
  });
});
