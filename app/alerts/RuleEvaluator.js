/**
 * RuleEvaluator
 * Converts analytics/signal payloads into comparable values and evaluates rules.
 */

class RuleEvaluator {
  evaluate(rule, value) {
    const actual = Number(value);
    if (!Number.isFinite(actual)) return false;

    switch (rule.operator) {
      case 'gte': return actual >= rule.threshold;
      case 'lte': return actual <= rule.threshold;
      case 'gt': return actual > rule.threshold;
      case 'lt': return actual < rule.threshold;
      case 'eq': return actual === rule.threshold;
      default: return false;
    }
  }

  extractValue(rule, payload = {}) {
    if (!payload || typeof payload !== 'object') return null;

    if (rule.type === 'probability') {
      return payload.probability ?? payload.probabilities?.[rule.signalType] ?? null;
    }

    if (rule.type === 'confidence') {
      return payload.confidence ?? payload.signal?.confidence ?? null;
    }

    if (rule.type === 'pattern') {
      if (payload.confidence != null) return payload.confidence;
      return payload.pattern?.confidence ?? null;
    }

    if (rule.type === 'scanner') {
      return payload.value ?? payload.confidence ?? payload.signal?.confidence ?? null;
    }

    if (rule.type === 'signal') {
      if (rule.signalType && payload.type && payload.type !== rule.signalType) return null;
      return payload.confidence ?? payload.value ?? null;
    }

    return null;
  }

  matches(rule, payload) {
    if (!rule.enabled) return false;
    if (rule.market && payload?.market && rule.market !== payload.market) return false;
    if (rule.market && !payload?.market) return false;
    if (rule.signalType && payload?.type && rule.signalType !== payload.type) return false;

    const value = this.extractValue(rule, payload);
    return this.evaluate(rule, value);
  }
}

module.exports = RuleEvaluator;
