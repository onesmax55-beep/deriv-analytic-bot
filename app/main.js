'use strict';
const { app, BrowserWindow, Notification } = require('electron');
const path = require('path');
const Database = require('./database/Database');
const AnalyticsEngine = require('./analytics/AnalyticsEngine');
const ReplayEngine = require('./replay/ReplayEngine');
const PlaybackController = require('./replay/PlaybackController');
const SessionRepository = require('./database/repositories/SessionRepository');
const AlertHistoryRepository = require('./database/repositories/AlertHistoryRepository');
const SettingsRepository = require('./database/repositories/SettingsRepository');
const SettingsManager = require('./settings/SettingsManager');
const ConnectionManager = require('./websocket/ConnectionManager');
const MarketScanner = require('./scanner/MarketScanner');
const ScannerConfiguration = require('./scanner/ScannerConfiguration');
const AlertEngine = require('./alerts/AlertEngine');
const NotificationService = require('./notifications/NotificationService');
const { registerIPC, cleanupIPC } = require('./ipc');
let mainWindow = null, database = null, analyticsEngine = null, replayEngine = null, playbackController = null, sessionRepository = null, alertHistoryRepository = null, settingsManager = null, connectionManager = null, marketScanner = null, scannerConfiguration = null, alertEngine = null, notificationService = null, alertUnsubscribe = null, shuttingDown = false;
async function initializeServices() {
  const dbPath = path.join(app.getPath('userData'), 'deriv-analytics.sqlite');
  database = new Database({ dbPath }); await database.connect();
  sessionRepository = new SessionRepository(database);
  alertHistoryRepository = new AlertHistoryRepository(database);
  settingsManager = new SettingsManager(new SettingsRepository(database)); await settingsManager.initialize();
  analyticsEngine = new AnalyticsEngine({ symbol: 'R_100' }); replayEngine = new ReplayEngine(); playbackController = new PlaybackController(replayEngine, analyticsEngine);
  connectionManager = new ConnectionManager({});
  const scannerMarkets = await settingsManager.get('scannerMarkets');
  marketScanner = new MarketScanner({ connectionManager, defaultSymbols: Array.isArray(scannerMarkets) && scannerMarkets.length ? scannerMarkets : undefined });
  scannerConfiguration = new ScannerConfiguration({ settingsManager, marketScanner });
  alertEngine = new AlertEngine();
  notificationService = new NotificationService({ Notification });
  alertUnsubscribe = alertEngine.subscribe(async (event) => {
    try { await alertHistoryRepository.save(event); } catch (error) { console.error('[alerts] Failed to persist alert:', error); }
    try { notificationService.notify({ title: event.rule?.name || 'Alert triggered', body: `${event.market || 'Market'}: ${event.value ?? 'condition met'}` }); } catch (error) { console.error('[alerts] Failed to notify:', error); }
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('alert:triggered', event);
  });
}
function createMainWindow() {
  mainWindow = new BrowserWindow({ width: 1440, height: 900, minWidth: 1100, minHeight: 700, backgroundColor: '#0f1419', webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false } });
  mainWindow.loadFile(path.join(__dirname, 'index.html')); mainWindow.on('closed', () => { mainWindow = null; }); return mainWindow;
}
async function startApplication() {
  await initializeServices();
  createMainWindow();
  await registerIPC(mainWindow, { database, analyticsEngine, replayEngine, playbackController, sessionRepository, settingsManager, connectionManager, marketScanner, scannerConfiguration, alertEngine, alertHistoryRepository, notificationService });
}
async function shutdownApplication() {
  if (shuttingDown) return; shuttingDown = true;
  try { alertUnsubscribe?.(); } catch (_) {} try { alertEngine?.dispose?.(); } catch (_) {}
  try { await marketScanner?.stop?.(); } catch (_) {} try { marketScanner?.dispose?.(); } catch (_) {} try { await connectionManager?.disconnect?.(); } catch (_) {}
  try { playbackController?.stopReplay?.(); } catch (_) {} try { replayEngine?.stop?.(); } catch (_) {} try { cleanupIPC(); } catch (_) {} try { await database?.close?.(); } catch (_) {}
}
app.whenReady().then(startApplication).catch((error) => { console.error('[main] Startup failed:', error); app.quit(); });
app.on('before-quit', async (event) => { if (shuttingDown) return; event.preventDefault(); await shutdownApplication(); app.exit(0); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMainWindow(); });
module.exports = { createMainWindow, initializeServices, shutdownApplication, getServices: () => ({ database, analyticsEngine, replayEngine, playbackController, sessionRepository, alertHistoryRepository, settingsManager, connectionManager, marketScanner, scannerConfiguration, alertEngine, notificationService }) };
