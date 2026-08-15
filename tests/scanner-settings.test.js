describe('scanner settings', () => {
  test('SettingsManager persists scannerMarkets with existing repository contract', async () => {
    const SettingsManager = require('../app/settings/SettingsManager');
    const values = new Map();
    const repo = { getAll: async () => Object.fromEntries(values), set: async (k, v) => values.set(k, v), get: async (k, d) => values.has(k) ? values.get(k) : d, clear: async () => values.clear() };
    const manager = new SettingsManager(repo);
    await manager.initialize();
    expect(await manager.get('scannerMarkets')).toEqual(['R_50', 'R_75', 'R_100', 'R_200']);
    await manager.set('scannerMarkets', ['R_50', 'R_75']);
    expect(await manager.get('scannerMarkets')).toEqual(['R_50', 'R_75']);
  });
});
