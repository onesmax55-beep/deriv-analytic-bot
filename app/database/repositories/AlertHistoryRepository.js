/**
 * AlertHistoryRepository
 * Persists triggered alert events and acknowledgement state.
 */

class AlertHistoryRepository {
  constructor(database) {
    this.db = database;
  }

  async save(event, options = {}) {
    if (!event || !event.id) throw new TypeError('Alert event with id is required');

    const rule = event.rule || {};
    const result = await this.db.run(
      `INSERT INTO alerts
       (session_id, message, severity, alert_type, timestamp, dismissed, rule_id, market, alert_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        options.sessionId || event.sessionId || null,
        options.message || event.message || `${rule.name || rule.id || 'Alert'} triggered`,
        options.severity || event.severity || 'warning',
        rule.type || rule.id || 'alert',
        event.triggeredAt || new Date().toISOString(),
        0,
        rule.id || event.ruleId || null,
        event.market || null,
        JSON.stringify({ eventId: event.id, value: event.value, payload: event.payload }),
      ]
    );

    return { ...event, id: result.id, acknowledged: false };
  }

  async list(options = {}) {
    const conditions = [];
    const params = [];

    if (options.sessionId) {
      conditions.push('session_id = ?');
      params.push(options.sessionId);
    }
    if (options.market) {
      conditions.push('market = ?');
      params.push(options.market);
    }
    if (options.ruleId) {
      conditions.push('rule_id = ?');
      params.push(options.ruleId);
    }
    if (options.acknowledged !== undefined) {
      conditions.push('dismissed = ?');
      params.push(options.acknowledged ? 1 : 0);
    }
    if (options.limit !== undefined) {
      const limit = Number(options.limit);
      if (!Number.isInteger(limit) || limit < 1) throw new TypeError('limit must be a positive integer');
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitClause = options.limit === undefined ? '' : ' LIMIT ?';
    if (options.limit !== undefined) params.push(Number(options.limit));

    return this.db.all(
      `SELECT * FROM alerts ${where} ORDER BY timestamp DESC${limitClause}`,
      params
    );
  }

  async acknowledge(id) {
    const result = await this.db.run(
      'UPDATE alerts SET dismissed = 1 WHERE id = ?',
      [id]
    );
    return result.changes > 0;
  }

  async getCount(options = {}) {
    const conditions = [];
    const params = [];
    if (options.acknowledged !== undefined) {
      conditions.push('dismissed = ?');
      params.push(options.acknowledged ? 1 : 0);
    }
    const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    const row = await this.db.get(`SELECT COUNT(*) AS count FROM alerts${where}`, params);
    return row?.count || 0;
  }
}

module.exports = AlertHistoryRepository;
