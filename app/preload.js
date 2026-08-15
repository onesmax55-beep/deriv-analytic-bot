'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

contextBridge.exposeInMainWorld('derivAnalytics', {
  getStatus: () => invoke('app:get-status'),
  sessions: {
    list: () => invoke('session:list'),
    get: (sessionId) => invoke('session:get', sessionId),
  },
  replay: {
    start: (ticks, symbol) => invoke('replay:start', ticks, symbol),
    pause: () => invoke('replay:pause'),
    resume: () => invoke('replay:resume'),
    stop: () => invoke('replay:stop'),
    setSpeed: (speed) => invoke('replay:speed', speed),
    status: () => invoke('replay:status'),
    results: () => invoke('replay:results'),
  },
  settings: {
    getAll: () => invoke('settings:get-all'),
  },
});
