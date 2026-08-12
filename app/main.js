'use strict';

const { app, BrowserWindow } = require('electron');
const path = require('path');

const Database = require('./database/Database');
const AnalyticsEngine = require('./analytics/AnalyticsEngine');
const ReplayEngine = require('./replay/ReplayEngine');
const PlaybackController = require('./replay/PlaybackController');
const SessionRepository = require('./database/repositories/SessionRepository');
const SettingsRepository = require('./database/repositories/SettingsRepository');
const SettingsManager = require('./settings/SettingsManager');
const { registerIPC, cleanupIPC } = require('./ipc');

let mainWindow = null;
let database = null;
let analyticsEngine = null;
let replayEngine = null;
let playbackController = null;
let sessionRepository = null;
let settingsManager = null;
let shuttingDown = false;

async function initializeServices() {
  const dbPath = path.join(app.getPath('userData'), 'deriv-analytics.sqlite');
  database = new Database({ dbPath });
  await database.connect();

  sessionRepository = new SessionRepository(database);
  const settingsRepository = new SettingsRepository(database);
  settingsManager = new SettingsManager(settingsRepository);
  await settingsManager.initialize();

  analyticsEngine = new AnalyticsEngine({ symbol: 'R_100' });
  replayEngine = new ReplayEngine();
  playbackController = new PlaybackController(replayEngine, analyticsEngine);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0f1419',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
  return mainWindow;
}

async function startApplication() {
  await initializeServices();
  registerIPC(mainWindow, {
    database,
    analyticsEngine,
    replayEngine,
    playbackController,
    sessionRepository,
    settingsManager,
  });
  createMainWindow();
}

async function shutdownApplication() {
  if (shuttingDown) return;
  shuttingDown = true;

  try { playbackController?.stopReplay?.(); } catch (_) {}
  try { replayEngine?.stop?.(); } catch (_) {}
  try { cleanupIPC(); } catch (_) {}
  try { await database?.close?.(); } catch (_) {}
}

app.whenReady().then(startApplication).catch((error) => {
  console.error('[main] Startup failed:', error);
  app.quit();
});

app.on('before-quit', async (event) => {
  if (shuttingDown) return;
  event.preventDefault();
  await shutdownApplication();
  app.exit(0);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

module.exports = {
  createMainWindow,
  initializeServices,
  shutdownApplication,
  getServices: () => ({
    database,
    analyticsEngine,
    replayEngine,
    playbackController,
    sessionRepository,
    settingsManager,
  }),
};
