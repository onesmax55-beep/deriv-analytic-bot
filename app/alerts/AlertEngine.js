/**
 * AlertEngine
 * Evaluates enabled rules against incoming analytics without coupling to Electron.
 */

const AlertRule = require('./AlertRule');
const RuleEvaluator = require('./RuleEvaluator');

class AlertEngine {
  constructor(options = {}) {
    this.evaluator = options.evaluator || new RuleEvaluator();
    this.rules = new Map();
    this.lastTriggeredAt = new Map();
    this.listeners = new Set();

    (options.rules || []).forEach((rule) => this.addRule(rule));
  }

  addRule(input) {
    const rule = input instanceof AlertRule ? input : new AlertRule(input);
    this.rules.set(rule.id, rule);
    return rule.toJSON();
  }

  updateRule(id, changes = {}) {
    const current = this.rules.get(id);
    if (!current) throw new Error(`Alert rule not found: ${id}`);
    const updated = new AlertRule({ ...current.toJSON(), ...changes, id });
    this.rules.set(id, updated);
    return updated.toJSON();
  }

  removeRule(id) {
    return this.rules.delete(id);
  }

  getRules() {
    return [...this.rules.values()].map((rule) => rule.toJSON());
  }

  subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('Alert listener must be a function');
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  process(payload = {}) {
    const triggered = [];
    for (const rule of this.rules.values()) {
      if (!this.evaluator.matches(rule, payload)) continue;

      const now = Date.now();
      const last = this.lastTriggeredAt.get(rule.id) || 0;
      if (rule.cooldownMs > 0 && now - last < rule.cooldownMs) continue;

      const event = {
        id: `${rule.id}:${now}`,
        ruleId: rule.id,
        rule: rule.toJSON(),
        market: payload.market || rule.market,
        value: this.evaluator.extractValue(rule, payload),
        payload,
        triggeredAt: new Date(now).toISOString(),
      };

      this.lastTriggeredAt.set(rule.id, now);
      triggered.push(event);
      this.listeners.forEach((listener) => listener(event));
    }
    return triggered;
  }

  clearCooldowns() {
    this.lastTriggeredAt.clear();
  }

  dispose() {
    this.listeners.clear();
    this.rules.clear();
    this.lastTriggeredAt.clear();
  }
}

module.exports = AlertEngine;
