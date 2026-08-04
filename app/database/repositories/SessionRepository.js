/**
 * SessionRepository
 * Manages session persistence
 */

const crypto = require('crypto');

class SessionRepository {
  constructor(database) {
    this.db = database;
  }

  /**
   * Create a new session
   */
  async createSession(symbol, version = null) {
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO sessions
       (id, start_time, symbol, status, version)
       VALUES (?, ?, ?, ?, ?)`,
      [sessionId, now, symbol, 'active', version || '1.0.0']
    );

    return sessionId;
  }

  /**
   * End a session
   */
  async endSession(sessionId) {
    return this.db.run(
      `UPDATE sessions
       SET end_time = ?, status = ?
       WHERE id = ?`,
      [new Date().toISOString(), 'closed', sessionId]
    );
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId) {
    return this.db.get(
      'SELECT * FROM sessions WHERE id = ?',
      [sessionId]
    );
  }

  /**
   * Get all sessions
   */
  async getAllSessions() {
    return this.db.all(
      'SELECT * FROM sessions ORDER BY start_time DESC'
    );
  }

  /**
   * Update session tick count
   */
  async updateTickCount(sessionId, tickCount) {
    return this.db.run(
      'UPDATE sessions SET tick_count = ? WHERE id = ?',
      [tickCount, sessionId]
    );
  }

  /**
   * Update session metadata
   */
  async updateSession(sessionId, updates) {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(updates), sessionId];

    return this.db.run(
      `UPDATE sessions SET ${fields} WHERE id = ?`,
      values
    );
  }
}

module.exports = SessionRepository;
