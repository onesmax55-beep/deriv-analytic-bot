'use strict';

const mockRegistered = new Map();
const { EventEmitter } = require('events');

jest.mock('electron', () => ({
  ipcMain: {
    handle: (channel, handler) => mockRegistered.set(channel, handler),
    removeHandler: (channel) => mockRegistered.delete(channel),
  },
}));

const { registerIPC, cleanupIPC } = require('../app/ipc');

describe('IPC acceptance boundary', () => {
  const scanner = new EventEmitter();
  scanner.start = jest.fn(async (markets) => ({ started: true, markets: markets || [] }));
  scanner.stop = jest.fn(() => ({ stopped: true }));
  scanner.getStatus = jest.fn(() => ({ running: false }));
  scanner.getMarkets = jest.fn(() => ['R_100']);
  scanner.setMarkets = jest.fn(async (markets) => ({ markets }));
  scanner.refresh = jest.fn(async () => ({ refreshed: true }));

  const services = {
    database: { isConnected: true },
    analyticsEngine: { getStatus: jest.fn(() => ({ running: true })) },
    sessionRepository: {
      getAllSessions: jest.fn(async () => [{ id: 's1', symbol: 'R_100' }]),
      getSession: jest.fn(async (id) => ({ id, symbol: 'R_100' })),
    },
    playbackController: {
      startReplay: jest.fn(async (ticks, symbol) => ({ started: true, count: ticks.length, symbol })),
      pauseReplay: jest.fn(() => ({ paused: true })),
      resumeReplay: jest.fn(() => ({ resumed: true })),
      stopReplay: jest.fn(() => ({ stopped: true })),
      setReplaySpeed: jest.fn((speed) => ({ speed })),
      getReplayStatus: jest.fn(() => ({ playing: false })),
      getReplayResults: jest.fn(() => ({ results: [] })),
    },
    settingsManager: {
      getAll: jest.fn(async () => ({ theme: 'dark' })),
      get: jest.fn(async () => ['R_100']),
      set: jest.fn(async () => undefined),
    },
    marketScanner: scanner,
  };

  beforeEach(() => {
    mockRegistered.clear();
    registerIPC(null, services);
  });

  afterEach(() => cleanupIPC());

  test('registers the complete public IPC contract', () => {
    expect([...mockRegistered.keys()]).toEqual(expect.arrayContaining([
      'app:get-status', 'session:list', 'session:get',
      'replay:start', 'replay:pause', 'replay:resume', 'replay:stop',
      'replay:speed', 'replay:status', 'replay:results', 'settings:get-all',
      'scanner:start', 'scanner:stop', 'scanner:get-status', 'scanner:get-markets',
      'scanner:set-markets', 'scanner:refresh',
    ]));
  });

  test('routes session and replay operations to the correct services', async () => {
    const list = await mockRegistered.get('session:list')();
    expect(list).toEqual([{ id: 's1', symbol: 'R_100' }]);

    await mockRegistered.get('session:get')({}, 's1');
    expect(services.sessionRepository.getSession).toHaveBeenCalledWith('s1');

    const started = await mockRegistered.get('replay:start')({}, [{ value: 1 }], 'R_100');
    expect(started.count).toBe(1);
    expect(services.playbackController.startReplay).toHaveBeenCalledWith([{ value: 1 }], 'R_100');

    await mockRegistered.get('replay:speed')({}, 5);
    expect(services.playbackController.setReplaySpeed).toHaveBeenCalledWith(5);
  });

  test('rejects invalid session ids and empty replay payloads', async () => {
    await expect(mockRegistered.get('session:get')({}, '')).rejects.toThrow('Invalid session id');
    await expect(mockRegistered.get('replay:start')({}, [], 'R_100')).rejects.toThrow('Replay ticks are required');
    await expect(mockRegistered.get('replay:start')({}, null, 'R_100')).rejects.toThrow('Replay ticks are required');
  });

  test('cleanup removes every registered handler', () => {
    expect(mockRegistered.size).toBeGreaterThan(0);
    cleanupIPC();
    expect(mockRegistered.size).toBe(0);
  });
});
