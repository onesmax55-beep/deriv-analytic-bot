describe('PR-036 preload acceptance', () => {
  test('scanner preload exposes the required API', () => {
    const exposed = {};
    jest.resetModules();
    jest.doMock('electron', () => ({
      contextBridge: { exposeInMainWorld: (name, api) => { exposed[name] = api; } },
      ipcRenderer: { invoke: jest.fn() },
    }));

    require('../app/preload');
    expect(exposed.derivAnalytics.scanner).toEqual(expect.objectContaining({
      start: expect.any(Function),
      stop: expect.any(Function),
      getStatus: expect.any(Function),
      getMarkets: expect.any(Function),
      setMarkets: expect.any(Function),
      refresh: expect.any(Function),
    }));
  });
});
