'use strict';

const { contextBridge, ipcRenderer } = require('electron');
const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);
const scannerEventChannels = ['market-tick','analysis-updated','market-active','market-inactive','market-error','markets-changed','starting','started','stopping','stopped'];
const scannerListeners = new Map();

function subscribeScanner(eventName, callback) {
  if (!scannerEventChannels.includes(eventName) || typeof callback !== 'function') throw new TypeError('Invalid scanner event subscription');
  const channel = `scanner:${eventName}`;
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  if (!scannerListeners.has(eventName)) scannerListeners.set(eventName, new Map());
  const id = Symbol(eventName);
  scannerListeners.get(eventName).set(id, listener);
  return () => {
    ipcRenderer.removeListener(channel, listener);
    scannerListeners.get(eventName)?.delete(id);
  };
}

contextBridge.exposeInMainWorld('derivAnalytics', {
  getStatus: () => invoke('app:get-status'),
  sessions: { list: () => invoke('session:list'), get: (sessionId) => invoke('session:get', sessionId) },
  replay: { start: (ticks, symbol) => invoke('replay:start', ticks, symbol), pause: () => invoke('replay:pause'), resume: () => invoke('replay:resume'), stop: () => invoke('replay:stop'), setSpeed: (speed) => invoke('replay:speed', speed), status: () => invoke('replay:status'), results: () => invoke('replay:results') },
  settings: { getAll: () => invoke('settings:get-all') },
  scanner: {
    start: () => invoke('scanner:start'), stop: () => invoke('scanner:stop'), getStatus: () => invoke('scanner:get-status'), getMarkets: () => invoke('scanner:get-markets'), setMarkets: (markets) => invoke('scanner:set-markets', markets), refresh: () => invoke('scanner:refresh'),
    configuration: {
      get: () => invoke('scanner:config:get'),
      set: (markets) => invoke('scanner:config:set', markets),
      reset: () => invoke('scanner:config:reset'),
    },
    on: subscribeScanner,
  },
});
