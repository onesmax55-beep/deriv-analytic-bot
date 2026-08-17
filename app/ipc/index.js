'use strict';
const { ipcMain } = require('electron');
const channels = ['app:get-status','session:list','session:get','replay:start','replay:pause','replay:resume','replay:stop','replay:speed','replay:status','replay:results','settings:get-all','scanner:start','scanner:stop','scanner:get-status','scanner:get-markets','scanner:set-markets','scanner:refresh','scanner:config:get','scanner:config:set','scanner:config:reset'];
const scannerEvents = ['market-tick','analysis-updated','market-active','market-inactive','market-error','markets-changed','starting','started','stopping','stopped'];
let registered = false; let services = null; let windowRef = null; let scannerListeners = [];
function requireScanner() { if (!services?.marketScanner) throw new Error('Market scanner is unavailable'); return services.marketScanner; }
function requireConfiguration() { if (!services?.scannerConfiguration) throw new Error('Scanner configuration is unavailable'); return services.scannerConfiguration; }
function validateMarkets(markets) {
  return requireConfiguration().normalize(markets);
}
async function ensureConnection() { const connection = services?.connectionManager; if (!connection) throw new Error('Connection manager is unavailable'); if (!connection.getStatus().connected) await connection.connect(); }
function attachScannerEvents(scanner) {
  scannerEvents.forEach((eventName) => {
    const listener = (payload) => { if (windowRef?.webContents && !windowRef.isDestroyed()) windowRef.webContents.send(`scanner:${eventName}`, payload); };
    scanner.on(eventName, listener); scannerListeners.push({ eventName, listener });
  });
}
function detachScannerEvents() { const scanner = services?.marketScanner; if (scanner) scannerListeners.forEach(({ eventName, listener }) => scanner.off(eventName, listener)); scannerListeners = []; }
async function registerIPC(mainWindow, injected) {
  cleanupIPC(); services = injected; windowRef = mainWindow;
  ipcMain.handle('app:get-status', async () => ({ name: 'Deriv Analytics Pro', version: require('../../package.json').version, databaseConnected: Boolean(services.database?.isConnected), analytics: services.analyticsEngine?.getStatus?.() || null }));
  ipcMain.handle('session:list', async () => services.sessionRepository.getAllSessions());
  ipcMain.handle('session:get', async (_event, sessionId) => { if (typeof sessionId !== 'string' || !sessionId.trim()) throw new Error('Invalid session id'); return services.sessionRepository.getSession(sessionId); });
  ipcMain.handle('replay:start', async (_event, ticks, symbol) => { if (!Array.isArray(ticks) || ticks.length === 0) throw new Error('Replay ticks are required'); return services.playbackController.startReplay(ticks, symbol); });
  ipcMain.handle('replay:pause', () => services.playbackController.pauseReplay()); ipcMain.handle('replay:resume', () => services.playbackController.resumeReplay()); ipcMain.handle('replay:stop', () => services.playbackController.stopReplay()); ipcMain.handle('replay:speed', (_event, speed) => services.playbackController.setReplaySpeed(speed)); ipcMain.handle('replay:status', () => services.playbackController.getReplayStatus()); ipcMain.handle('replay:results', () => services.playbackController.getReplayResults());
  ipcMain.handle('settings:get-all', () => services.settingsManager.getAll());
  ipcMain.handle('scanner:start', async () => { await ensureConnection(); return requireScanner().start(await requireConfiguration().getMarkets()); });
  ipcMain.handle('scanner:stop', () => requireScanner().stop()); ipcMain.handle('scanner:get-status', () => requireScanner().getStatus()); ipcMain.handle('scanner:get-markets', () => requireScanner().getMarkets());
  ipcMain.handle('scanner:set-markets', async (_event, markets) => requireConfiguration().setMarkets(validateMarkets(markets)));
  ipcMain.handle('scanner:refresh', () => requireScanner().refresh());
  ipcMain.handle('scanner:config:get', () => requireConfiguration().getMarkets());
  ipcMain.handle('scanner:config:set', async (_event, markets) => requireConfiguration().setMarkets(validateMarkets(markets)));
  ipcMain.handle('scanner:config:reset', () => requireConfiguration().reset());
  attachScannerEvents(requireScanner()); registered = true;
}
function cleanupIPC() { detachScannerEvents(); if (!registered) { services = null; windowRef = null; return; } for (const channel of channels) ipcMain.removeHandler(channel); registered = false; services = null; windowRef = null; }
module.exports = { registerIPC, cleanupIPC, validateMarkets };
