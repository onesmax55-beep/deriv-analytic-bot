const AlertRule = require('../app/alerts/AlertRule');
const RuleEvaluator = require('../app/alerts/RuleEvaluator');
const AlertEngine = require('../app/alerts/AlertEngine');

describe('AlertRule', () => {
  test('normalizes and validates a rule', () => {
    const rule = new AlertRule({ type: 'confidence', operator: 'gte', threshold: 80 });
    expect(rule.type).toBe('confidence');
    expect(rule.threshold).toBe(80);
    expect(rule.enabled).toBe(true);
  });

  test('rejects unsupported rules', () => {
    expect(() => new AlertRule({ type: 'unknown', threshold: 1 })).toThrow();
    expect(() => new AlertRule({ type: 'confidence', threshold: 'bad' })).toThrow();
  });
});

describe('RuleEvaluator', () => {
  const evaluator = new RuleEvaluator();
  const rule = new AlertRule({ type: 'confidence', operator: 'gte', threshold: 80 });

  test('matches threshold values', () => {
    expect(evaluator.matches(rule, { confidence: 80 })).toBe(true);
    expect(evaluator.matches(rule, { confidence: 79 })).toBe(false);
  });

  test('respects market scope', () => {
    const scoped = new AlertRule({ type: 'confidence', threshold: 80, market: 'R_100' });
    expect(evaluator.matches(scoped, { market: 'R_100', confidence: 90 })).toBe(true);
    expect(evaluator.matches(scoped, { market: 'R_50', confidence: 90 })).toBe(false);
  });
});

describe('AlertEngine', () => {
  test('triggers matching rules and notifies listeners', () => {
    const engine = new AlertEngine({
      rules: [{ id: 'r1', type: 'confidence', threshold: 80 }],
    });
    const listener = jest.fn();
    engine.subscribe(listener);

    const events = engine.process({ market: 'R_100', confidence: 85 });

    expect(events).toHaveLength(1);
    expect(events[0].ruleId).toBe('r1');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('honors cooldown', () => {
    const engine = new AlertEngine({
      rules: [{ id: 'r1', type: 'confidence', threshold: 80, cooldownMs: 60000 }],
    });
    expect(engine.process({ confidence: 90 })).toHaveLength(1);
    expect(engine.process({ confidence: 90 })).toHaveLength(0);
  });
});
