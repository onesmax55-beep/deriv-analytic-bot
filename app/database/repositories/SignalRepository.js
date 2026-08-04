/**
 * SignalRepository
 * Manages signal persistence
 */

class SignalRepository {
  constructor(database) {
    this.db = database;
  }

  /**
   * Save a signal
   */
  async saveSignal(signal) {
    return this.db.run(
      `INSERT INTO signals
       (session_id, symbol, type, direction, confidence, timestamp, signal_data)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        signal.sessionId,
        signal.symbol,
        signal.type,
        signal.direction,
        signal.confidence,
        signal.timestamp,
        JSON.stringify(signal),
      ]
    );
  }

  /**
   * Get signals for session
   */
  async getSignalsForSession(sessionId) {
    return this.db.all(
      `SELECT * FROM signals
       WHERE session_id = ?
       ORDER BY timestamp DESC`,
      [sessionId]
    );
  }

  /**
   * Get high-confidence signals
   */
  async getHighConfidenceSignals(minConfidence = 70) {
    return this.db.all(
      `SELECT * FROM signals
       WHERE confidence >= ?
       ORDER BY timestamp DESC`,
      [minConfidence]
    );
  }

  /**
   * Get signal count for session
   */
  async getSignalCount(sessionId) {
    const result = await this.db.get(
      'SELECT COUNT(*) as count FROM signals WHERE session_id = ?',
      [sessionId]
    );
    return result?.count || 0;
  }

  /**
   * Get signals by type
   */
  async getSignalsByType(type) {
    return this.db.all(
      'SELECT * FROM signals WHERE type = ? ORDER BY timestamp DESC',
      [type]
    );
  }
}

module.exports = SignalRepository;
