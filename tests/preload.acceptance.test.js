'use strict';

let exposed;
const invoke = jest.fn((channel, ...args) => ({ channel, args }));

jest.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: (name, api) => { exposed = { name, api }; },
  },
  ipcRenderer: { invoke },
}));

describe('preload acceptance boundary', () => {
  beforeEach(() => {
    jest.resetModules();
    invoke.mockClear();
    exposed = undefined;
    require('../app/preload');
  });

  test('exposes only the intended Deriv Analytics API surface', () => {
    expect(exposed.name).toBe('derivAnalytics');
    expect(typeof exposed.api.getStatus).toBe('function');
    expect(typeof exposed.api.sessions.list).toBe('function');
    expect(typeof exposed.api.sessions.get).toBe('function');
    expect(typeof exposed.api.replay.start).toBe('function');
    expect(typeof exposed.api.replay.pause).toBe('function');
    expect(typeof exposed.api.replay.resume).toBe('function');
    expect(typeof exposed.api.replay.stop).toBe('function');
    expect(typeof exposed.api.replay.setSpeed).toBe('function');
    expect(typeof exposed.api.replay.status).toBe('function');
    expect(typeof exposed.api.replay.results).toBe('function');
    expect(typeof exposed.api.settings.getAll).toBe('function');
  });

  test('maps public methods to exact IPC channels and arguments', () => {
    exposed.api.sessions.get('s1');
    exposed.api.replay.start([{ value: 1 }], 'R_100');
    exposed.api.replay.setSpeed(5);
    exposed.api.settings.getAll();

    expect(invoke).toHaveBeenNthCalledWith(1, 'session:get', 's1');
    expect(invoke).toHaveBeenNthCalledWith(2, 'replay:start', [{ value: 1 }], 'R_100');
    expect(invoke).toHaveBeenNthCalledWith(3, 'replay:speed', 5);
    expect(invoke).toHaveBeenNthCalledWith(4, 'settings:get-all');
  });
});
