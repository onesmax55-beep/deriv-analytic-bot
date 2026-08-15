'use strict';
const { ipcMain } = require('electron');
const channels = ['app:get-status','session:list','session:get','replay:start','replay:pause','replay:resume','replay:stop','replay:speed','replay:status','replay:results','settings:get-all','scanner:start','scanner:stop','scanner:get-status','scanner:get-markets','scanner:set-markets','scanner:refresh'];
let registered = false; let services = null;
function requireScanner() { if (!services?.marketScanner) throw new Error('Market scanner is unavailable'); return services.marketScanner; }
function validateMarkets(markets) {
  if (!Array.isArray(markets) || markets.length === 0) throw new Error('At least one market is required');
  if (markets.length > 100) throw new Error('Too many markets');
  return [...new Set(markets.map((symbol) => { if (typeof symbol !== 'string' || !/^[A-Za-z0-9_]+$/.test(symbol.trim())) throw new Error('Invalid market symbol'); return symbol.trim().toUpperCase(); }))];
}
async function ensureConnection() { const connection = services?.connectionManager; if (!connection) throw new Error('Connection manager is unavailable'); if (!connection.getStatus().connected) await connection.connect(); }
async function registerIPC(_mainWindow, injected) {
  cleanupIPC(); services = injected;
  ipcMain.handle('app:get-status', async () => ({ name: 'Deriv Analytics Pro', version: require('../../package.json').version, databaseConnected: Boolean(services.database?.isConnected), analytics: services.analyticsEngine?.getStatus?.() || null }));
  ipcMain.handle('session:list', async () => services.sessionRepository.getAllSessions());
  ipcMain.handle('session:get', async (_event, sessionId) => { if (typeof sessionId !== 'string' || !sessionId.trim()) throw new Error('Invalid session id'); return services.sessionRepository.getSession(sessionId); });
  ipcMain.handle('replay:start', async (_event, ticks, symbol) => { if (!Array.isArray(ticks) || ticks.length === 0) throw new Error('Replay ticks are required'); return services.playbackController.startReplay(ticks, symbol); });
  ipcMain.handle('replay:pause', () => services.playbackController.pauseReplay()); ipcMain.handle('replay:resume', () => services.playbackController.resumeReplay()); ipcMain.handle('replay:stop', () => services.playbackController.stopReplay()); ipcMain.handle('replay:speed', (_event, speed) => services.playbackController.setReplaySpeed(speed)); ipcMain.handle('replay:status', () => services.playbackController.getReplayStatus()); ipcMain.handle('replay:results', () => services.playbackController.getReplayResults());
  ipcMain.handle('settings:get-all', () => services.settingsManager.getAll());
  ipcMain.handle('scanner:start', async () => { await ensureConnection(); const markets = await services.settingsManager.get('scannerMarkets'); return requireScanner().start(Array.isArray(markets) && markets.length ? markets : undefined); });
  ipcMain.handle('scanner:stop', () => requireScanner().stop()); ipcMain.handle('scanner:get-status', () => requireScanner().getStatus()); ipcMain.handle('scanner:get-markets', () => requireScanner().getMarkets());
  ipcMain.handle('scanner:set-markets', async (_event, markets) => { const normalized = validateMarkets(markets); await services.settingsManager.set('scannerMarkets', normalized); return requireScanner().setMarkets(normalized); });
  ipcMain.handle('scanner:refresh', () => requireScanner().refresh()); registered = true;
}
function cleanupIPC() { if (!registered) return; for (const channel of channels) ipcMain.removeHandler(channel); registered = false; services = null; }
module.exports = { registerIPC, cleanupIPC, validateMarkets };
