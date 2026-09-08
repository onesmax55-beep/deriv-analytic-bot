'use strict';

const $ = (id) => document.getElementById(id);

async function refreshStatus() {
  try {
    const status = await window.derivAnalytics.getStatus();
    $('version').textContent = `v${status.version}`;
    $('db').textContent = status.databaseConnected ? 'Connected' : 'Unavailable';
    $('symbol').textContent = status.analytics?.symbol || 'R_100';
    $('ticks').textContent = status.analytics?.tickCount ?? 0;
    $('confidence').textContent = `${status.analytics?.confidence ?? 0}%`;
    const scanner = await window.derivAnalytics.scanner.getStatus();
    $('scanner').textContent = scanner.running ? `Live (${scanner.marketCount})` : 'Stopped';
    const connectionState = scanner.running || scanner.marketCount > 0 ? 'Connected' : 'Disconnected';
    $('connection').textContent = connectionState;
  } catch (error) {
    $('error').textContent = error.message;
    if ($('connection')) $('connection').textContent = 'Error';
    if ($('scanner')) $('scanner').textContent = 'Error';
  }
}

async function startLiveScanner() {
  try {
    $('connection').textContent = 'Connecting…';
    $('scanner').textContent = 'Starting…';
    await window.derivAnalytics.scanner.start();
    $('error').textContent = '';
    await refreshStatus();
  } catch (error) {
    $('error').textContent = `Live data: ${error.message}`;
    await refreshStatus();
  }
}

async function stopLiveScanner() {
  try {
    await window.derivAnalytics.scanner.stop();
    await refreshStatus();
  } catch (error) {
    $('error').textContent = `Scanner: ${error.message}`;
  }
}

async function refreshReplay() {
  try {
    const status = await window.derivAnalytics.replay.status();
    $('replay').textContent = JSON.stringify(status, null, 2);
    await refreshStatus();
  } catch (error) {
    $('error').textContent = error.message;
  }
}

async function refreshSessions() {
  try {
    const sessions = await window.derivAnalytics.sessions.list();
    $('sessions').textContent = JSON.stringify(sessions, null, 2);
  } catch (error) {
    $('sessions').textContent = error.message;
  }
}

$('connect').addEventListener('click', startLiveScanner);
$('scanner-stop').addEventListener('click', stopLiveScanner);
$('demo').addEventListener('click', async () => {
  const ticks = Array.from({ length: 40 }, (_, i) => ({
    value: 100 + Math.sin(i / 3) * 2 + (i % 10) / 100,
    timestamp: Date.now() + i * 50,
  }));
  try {
    await window.derivAnalytics.replay.start(ticks, 'R_100');
    await refreshReplay();
  } catch (error) {
    $('error').textContent = error.message;
  }
});
$('pause').addEventListener('click', async () => { await window.derivAnalytics.replay.pause(); await refreshReplay(); });
$('resume').addEventListener('click', async () => { await window.derivAnalytics.replay.resume(); await refreshReplay(); });
$('stop').addEventListener('click', async () => { await window.derivAnalytics.replay.stop(); await refreshReplay(); });
$('refresh').addEventListener('click', refreshSessions);

if (window.AlertCenter && $('alert-center')) {
  window.alertCenter = new window.AlertCenter($('alert-center'), window.derivAnalytics.alerts);
  window.alertCenter.initialize();
}

refreshStatus();
refreshSessions();
setInterval(refreshStatus, 2000);
setInterval(refreshReplay, 5000);
