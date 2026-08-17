/**
 * AlertRule
 * Immutable-ish domain model for user-configured analytics alerts.
 */

const TYPES = Object.freeze([
  'probability',
  'confidence',
  'pattern',
  'scanner',
  'signal',
]);

const OPERATORS = Object.freeze(['gte', 'lte', 'eq', 'gt', 'lt']);

class AlertRule {
  constructor(input = {}) {
    const rule = AlertRule.normalize(input);
    Object.assign(this, rule);
    Object.freeze(this);
  }

  static normalize(input = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new TypeError('Alert rule must be an object');
    }

    const id = typeof input.id === 'string' && input.id.trim()
      ? input.id.trim()
      : `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const type = String(input.type || '').trim().toLowerCase();
    if (!TYPES.includes(type)) throw new Error(`Unsupported alert type: ${type}`);

    const operator = String(input.operator || 'gte').trim().toLowerCase();
    if (!OPERATORS.includes(operator)) throw new Error(`Unsupported alert operator: ${operator}`);

    const threshold = Number(input.threshold);
    if (!Number.isFinite(threshold)) throw new TypeError('Alert threshold must be finite');

    const enabled = input.enabled !== false;
    const market = input.market == null ? null : String(input.market).trim();
    if (market === '') throw new TypeError('Alert market cannot be empty');

    const signalType = input.signalType == null ? null : String(input.signalType).trim();
    if (signalType === '') throw new TypeError('Alert signalType cannot be empty');

    return {
      id,
      name: String(input.name || `${type} alert`).trim(),
      type,
      operator,
      threshold,
      market,
      signalType,
      enabled,
      cooldownMs: AlertRule.normalizeCooldown(input.cooldownMs),
      createdAt: input.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  static normalizeCooldown(value) {
    const cooldown = value == null ? 0 : Number(value);
    if (!Number.isFinite(cooldown) || cooldown < 0) {
      throw new TypeError('Alert cooldownMs must be a non-negative number');
    }
    return Math.floor(cooldown);
  }

  toJSON() {
    return { ...this };
  }

  static get TYPES() { return TYPES; }
  static get OPERATORS() { return OPERATORS; }
}

module.exports = AlertRule;
