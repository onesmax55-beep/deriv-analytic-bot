'use strict';

const { ipcMain } = require('electron');

const channels = [
  'app:get-status',
  'session:list',
  'session:get',
  'replay:start',
  'replay:pause',
  'replay:resume',
  'replay:stop',
  'replay:speed',
  'replay:status',
  'replay:results',
  'settings:get-all',
];

let registered = false;
let services = null;

function registerIPC(_mainWindow, injected) {
  cleanupIPC();
  services = injected;

  ipcMain.handle('app:get-status', async () => ({
    name: 'Deriv Analytics Pro',
    version: require('../../package.json').version,
    databaseConnected: Boolean(services.database?.isConnected),
    analytics: services.analyticsEngine?.getStatus?.() || null,
  }));

  ipcMain.handle('session:list', async () => services.sessionRepository.getAllSessions());
  ipcMain.handle('session:get', async (_event, sessionId) => {
    if (typeof sessionId !== 'string' || !sessionId.trim()) throw new Error('Invalid session id');
    return services.sessionRepository.getSession(sessionId);
  });

  ipcMain.handle('replay:start', async (_event, ticks, symbol) => {
    if (!Array.isArray(ticks) || ticks.length === 0) throw new Error('Replay ticks are required');
    return services.playbackController.startReplay(ticks, symbol);
  });
  ipcMain.handle('replay:pause', () => services.playbackController.pauseReplay());
  ipcMain.handle('replay:resume', () => services.playbackController.resumeReplay());
  ipcMain.handle('replay:stop', () => services.playbackController.stopReplay());
  ipcMain.handle('replay:speed', (_event, speed) => services.playbackController.setReplaySpeed(speed));
  ipcMain.handle('replay:status', () => services.playbackController.getReplayStatus());
  ipcMain.handle('replay:results', () => services.playbackController.getReplayResults());
  ipcMain.handle('settings:get-all', () => services.settingsManager.getAll());

  registered = true;
}

function cleanupIPC() {
  if (!registered) return;
  for (const channel of channels) ipcMain.removeHandler(channel);
  registered = false;
  services = null;
}

module.exports = { registerIPC, cleanupIPC };
