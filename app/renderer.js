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
  } catch (error) {
    $('error').textContent = error.message;
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

refreshStatus();
refreshSessions();
setInterval(refreshStatus, 1000);
setInterval(refreshReplay, 1000);
