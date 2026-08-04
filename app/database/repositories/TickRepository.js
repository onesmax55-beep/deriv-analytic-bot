/**
 * TickRepository
 * Manages tick data persistence
 */

class TickRepository {
  constructor(database) {
    this.db = database;
  }

  /**
   * Save a tick
   */
  async saveTick(symbol, value, timestamp, epochTime, tickIndex = null) {
    return this.db.run(
      `INSERT INTO ticks (symbol, value, timestamp, epoch_time, tick_index)
       VALUES (?, ?, ?, ?, ?)`,
      [symbol, value, timestamp, epochTime, tickIndex]
    );
  }

  /**
   * Save multiple ticks
   */
  async saveTicks(ticks) {
    await this.db.transaction(async () => {
      for (const tick of ticks) {
        await this.saveTick(
          tick.symbol,
          tick.value,
          tick.timestamp,
          tick.epochTime,
          tick.tickIndex
        );
      }
    });
  }

  /**
   * Get ticks for a symbol and time range
   */
  async getTicksInRange(symbol, startTime, endTime) {
    return this.db.all(
      `SELECT * FROM ticks
       WHERE symbol = ? AND timestamp BETWEEN ? AND ?
       ORDER BY timestamp ASC`,
      [symbol, startTime, endTime]
    );
  }

  /**
   * Get latest N ticks
   */
  async getLatestTicks(symbol, count = 100) {
    return this.db.all(
      `SELECT * FROM ticks
       WHERE symbol = ?
       ORDER BY timestamp DESC
       LIMIT ?`,
      [symbol, count]
    );
  }

  /**
   * Get tick count for symbol
   */
  async getTickCount(symbol) {
    const result = await this.db.get(
      'SELECT COUNT(*) as count FROM ticks WHERE symbol = ?',
      [symbol]
    );
    return result?.count || 0;
  }

  /**
   * Delete old ticks
   */
  async deleteOlderThan(days) {
    const result = await this.db.run(
      `DELETE FROM ticks
       WHERE datetime(timestamp) < datetime('now', '-' || ? || ' days')`,
      [days]
    );
    return result.changes;
  }

  /**
   * Get tick statistics
   */
  async getStatistics(symbol, startTime, endTime) {
    return this.db.get(
      `SELECT
         COUNT(*) as count,
         MIN(value) as min,
         MAX(value) as max,
         AVG(value) as avg,
         MIN(timestamp) as first_timestamp,
         MAX(timestamp) as last_timestamp
       FROM ticks
       WHERE symbol = ? AND timestamp BETWEEN ? AND ?`,
      [symbol, startTime, endTime]
    );
  }
}

module.exports = TickRepository;
