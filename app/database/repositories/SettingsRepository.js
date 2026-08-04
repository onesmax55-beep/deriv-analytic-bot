/**
 * SettingsRepository
 * Manages user settings persistence
 */

class SettingsRepository {
  constructor(database) {
    this.db = database;
    this.cache = new Map();
  }

  /**
   * Set a setting
   */
  async set(key, value, type = 'string') {
    this.cache.set(key, value);

    const existing = await this.db.get(
      'SELECT id FROM user_settings WHERE key = ?',
      [key]
    );

    if (existing) {
      return this.db.run(
        'UPDATE user_settings SET value = ?, type = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
        [JSON.stringify(value), type, key]
      );
    } else {
      return this.db.run(
        'INSERT INTO user_settings (key, value, type) VALUES (?, ?, ?)',
        [key, JSON.stringify(value), type]
      );
    }
  }

  /**
   * Get a setting
   */
  async get(key, defaultValue = null) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const result = await this.db.get(
      'SELECT value, type FROM user_settings WHERE key = ?',
      [key]
    );

    if (result) {
      const value = JSON.parse(result.value);
      this.cache.set(key, value);
      return value;
    }

    return defaultValue;
  }

  /**
   * Get all settings
   */
  async getAll() {
    const results = await this.db.all(
      'SELECT key, value FROM user_settings'
    );

    const settings = {};
    results.forEach((r) => {
      settings[r.key] = JSON.parse(r.value);
      this.cache.set(r.key, settings[r.key]);
    });

    return settings;
  }

  /**
   * Delete a setting
   */
  async delete(key) {
    this.cache.delete(key);
    return this.db.run('DELETE FROM user_settings WHERE key = ?', [key]);
  }

  /**
   * Clear all settings
   */
  async clear() {
    this.cache.clear();
    return this.db.run('DELETE FROM user_settings');
  }
}

module.exports = SettingsRepository;
