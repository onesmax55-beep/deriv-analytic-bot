/**
 * AnalyticsRepository
 * Manages analytics snapshots persistence
 */

class AnalyticsRepository {
  constructor(database) {
    this.db = database;
  }

  /**
   * Save an analytics snapshot
   */
  async saveSnapshot(snapshot) {
    return this.db.run(
      `INSERT INTO analytics_snapshots
       (session_id, symbol, timestamp, tick_count, confidence, snapshot_data,
        even_percentage, odd_percentage, rise_percentage, fall_percentage,
        trend_strength, volatility)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        snapshot.sessionId,
        snapshot.symbol,
        snapshot.timestamp,
        snapshot.tickCount,
        snapshot.confidence,
        JSON.stringify(snapshot),
        snapshot.evenOdd?.probabilities?.[100]?.evenPercentage,
        snapshot.evenOdd?.probabilities?.[100]?.oddPercentage,
        snapshot.riseFall?.riseFallRatio?.risePercentage,
        snapshot.riseFall?.riseFallRatio?.fallPercentage,
        snapshot.riseFall?.trendStrength?.trendStrength,
        snapshot.riseFall?.volatility?.standardDeviation,
      ]
    );
  }

  /**
   * Get snapshots for session
   */
  async getSnapshotsForSession(sessionId) {
    return this.db.all(
      `SELECT * FROM analytics_snapshots
       WHERE session_id = ?
       ORDER BY timestamp ASC`,
      [sessionId]
    );
  }

  /**
   * Get snapshots in time range
   */
  async getSnapshotsInRange(symbol, startTime, endTime) {
    return this.db.all(
      `SELECT * FROM analytics_snapshots
       WHERE symbol = ? AND timestamp BETWEEN ? AND ?
       ORDER BY timestamp ASC`,
      [symbol, startTime, endTime]
    );
  }

  /**
   * Get average confidence for session
   */
  async getAverageConfidence(sessionId) {
    const result = await this.db.get(
      'SELECT AVG(confidence) as avg_confidence FROM analytics_snapshots WHERE session_id = ?',
      [sessionId]
    );
    return result?.avg_confidence || 0;
  }

  /**
   * Get latest snapshot
   */
  async getLatestSnapshot(symbol) {
    return this.db.get(
      `SELECT * FROM analytics_snapshots
       WHERE symbol = ?
       ORDER BY timestamp DESC
       LIMIT 1`,
      [symbol]
    );
  }
}

module.exports = AnalyticsRepository;
