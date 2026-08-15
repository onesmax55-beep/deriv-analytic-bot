'use strict';

let mockExposed;
const mockInvoke = jest.fn((channel, ...args) => ({ channel, args }));

jest.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: (name, api) => { mockExposed = { name, api }; },
  },
  ipcRenderer: { invoke: mockInvoke },
}));

describe('preload acceptance boundary', () => {
  beforeEach(() => {
    jest.resetModules();
    mockInvoke.mockClear();
    mockExposed = undefined;
    require('../app/preload');
  });

  test('exposes only the intended Deriv Analytics API surface', () => {
    expect(mockExposed.name).toBe('derivAnalytics');
    expect(typeof mockExposed.api.getStatus).toBe('function');
    expect(typeof mockExposed.api.sessions.list).toBe('function');
    expect(typeof mockExposed.api.sessions.get).toBe('function');
    expect(typeof mockExposed.api.replay.start).toBe('function');
    expect(typeof mockExposed.api.replay.pause).toBe('function');
    expect(typeof mockExposed.api.replay.resume).toBe('function');
    expect(typeof mockExposed.api.replay.stop).toBe('function');
    expect(typeof mockExposed.api.replay.setSpeed).toBe('function');
    expect(typeof mockExposed.api.replay.status).toBe('function');
    expect(typeof mockExposed.api.replay.results).toBe('function');
    expect(typeof mockExposed.api.settings.getAll).toBe('function');
  });

  test('maps public methods to exact IPC channels and arguments', () => {
    mockExposed.api.sessions.get('s1');
    mockExposed.api.replay.start([{ value: 1 }], 'R_100');
    mockExposed.api.replay.setSpeed(5);
    mockExposed.api.settings.getAll();

    expect(mockInvoke).toHaveBeenNthCalledWith(1, 'session:get', 's1');
    expect(mockInvoke).toHaveBeenNthCalledWith(2, 'replay:start', [{ value: 1 }], 'R_100');
    expect(mockInvoke).toHaveBeenNthCalledWith(3, 'replay:speed', 5);
    expect(mockInvoke).toHaveBeenNthCalledWith(4, 'settings:get-all');
  });
});
