/**
 * SettingsManager
 * Manages application settings with persistence
 */

const EventEmitter = require('events');

class SettingsManager extends EventEmitter {
  constructor(settingsRepository) {
    super();
    this.repo = settingsRepository;
    this.defaults = {
      theme: 'dark',
      defaultSymbol: 'R_100',
      scannerMarkets: ['R_50', 'R_75', 'R_100', 'R_200'],
      windowSizes: [50, 100, 250, 500, 1000],
      alertThreshold: 70,
      enableNotifications: true,
      updateInterval: 500,
      replaySpeed: 1,
      retentionDays: 90,
      autoSaveInterval: 5000,
    };
  }

  async initialize() {
    try {
      const settings = await this.repo.getAll();
      if (Object.keys(settings).length === 0) {
        for (const [key, value] of Object.entries(this.defaults)) await this.set(key, value);
      }
      this.emit('initialized');
    } catch (error) { this.emit('error', error); throw error; }
  }

  async set(key, value) {
    try {
      const type = typeof value;
      await this.repo.set(key, value, type);
      this.emit('changed', { key, value });
      return true;
    } catch (error) { this.emit('error', error); throw error; }
  }

  async get(key) {
    try { return await this.repo.get(key, this.defaults[key]); }
    catch (error) { this.emit('error', error); throw error; }
  }

  async getAll() {
    try { return await this.repo.getAll(); }
    catch (error) { this.emit('error', error); throw error; }
  }

  async reset() {
    try {
      await this.repo.clear();
      for (const [key, value] of Object.entries(this.defaults)) await this.set(key, value);
      this.emit('reset');
    } catch (error) { this.emit('error', error); throw error; }
  }

  onChange(callback) { this.on('changed', callback); }
}

module.exports = SettingsManager;
