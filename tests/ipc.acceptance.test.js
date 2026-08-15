'use strict';

const mockRegistered = new Map();

jest.mock('electron', () => ({
  ipcMain: {
    handle: (channel, handler) => mockRegistered.set(channel, handler),
    removeHandler: (channel) => mockRegistered.delete(channel),
  },
}));

const { registerIPC, cleanupIPC } = require('../app/ipc');

describe('IPC acceptance boundary', () => {
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
    settingsManager: { getAll: jest.fn(async () => ({ theme: 'dark' })) },
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
