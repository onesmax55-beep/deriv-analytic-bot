jest.mock('electron', () => ({
  ipcMain: { handlers: new Map(), handle(name, fn) { this.handlers.set(name, fn); }, removeHandler(name) { this.handlers.delete(name); } },
}));

const EventEmitter = require('events');
const { registerIPC, cleanupIPC } = require('../app/ipc');

describe('scanner live event bridge', () => {
  afterEach(() => cleanupIPC());

  test('forwards scanner events to the renderer window', async () => {
    const scanner = new EventEmitter();
    Object.assign(scanner, {
      start: jest.fn(), stop: jest.fn(), getStatus: jest.fn(() => ({ running: true })),
      getMarkets: jest.fn(() => []), setMarkets: jest.fn(), refresh: jest.fn(),
    });
    const settingsManager = { set: jest.fn(async (_key, value) => value), get: jest.fn(async () => ['R_50']) };
    const connectionManager = { getStatus: jest.fn(() => ({ connected: true })), connect: jest.fn() };
    const send = jest.fn();
    const window = { isDestroyed: () => false, webContents: { send } };

    await registerIPC(window, { marketScanner: scanner, settingsManager, connectionManager });
    const payload = { symbol: 'R_50', score: 82 };
    scanner.emit('analysis-updated', payload);

    expect(send).toHaveBeenCalledWith('scanner:analysis-updated', payload);
  });

  test('detaches scanner listeners during cleanup', async () => {
    const scanner = new EventEmitter();
    Object.assign(scanner, {
      start: jest.fn(), stop: jest.fn(), getStatus: jest.fn(() => ({ running: false })),
      getMarkets: jest.fn(() => []), setMarkets: jest.fn(), refresh: jest.fn(),
    });
    const window = { isDestroyed: () => false, webContents: { send: jest.fn() } };
    await registerIPC(window, { marketScanner: scanner, settingsManager: { get: jest.fn() }, connectionManager: { getStatus: () => ({ connected: true }) } });
    cleanupIPC();
    scanner.emit('market-tick', { symbol: 'R_50' });
    expect(window.webContents.send).not.toHaveBeenCalled();
  });
});
