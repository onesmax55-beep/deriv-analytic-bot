'use strict';

const EventEmitter = require('events');
const AlertEngine = require('../app/alerts/AlertEngine');
const LiveAlertIntegration = require('../app/alerts/LiveAlertIntegration');

describe('LiveAlertIntegration', () => {
  test('forwards scanner analysis updates into the alert engine', () => {
    const scanner = new EventEmitter();
    const engine = new AlertEngine({ rules: [{ id: 'confidence-1', name: 'High confidence', type: 'confidence', operator: 'gte', threshold: 80 }] });
    const integration = new LiveAlertIntegration({ marketScanner: scanner, alertEngine: engine });
    const events = [];
    engine.subscribe((event) => events.push(event));

    integration.start();
    scanner.emit('analysis-updated', { symbol: 'R_100', analysis: { confidence: 85 } });

    expect(events).toHaveLength(1);
    expect(events[0].market).toBe('R_100');
    expect(events[0].value).toBe(85);
    expect(integration.started).toBe(true);
  });

  test('does not attach duplicate listeners and removes its listener on stop', () => {
    const scanner = new EventEmitter();
    const engine = new AlertEngine({ rules: [{ id: 'confidence-1', type: 'confidence', operator: 'gte', threshold: 80 }] });
    const integration = new LiveAlertIntegration({ marketScanner: scanner, alertEngine: engine });
    const processSpy = jest.spyOn(engine, 'process');

    expect(integration.start()).toBe(true);
    expect(integration.start()).toBe(false);
    expect(scanner.listenerCount('analysis-updated')).toBe(1);

    scanner.emit('analysis-updated', { symbol: 'R_100', analysis: { confidence: 90 } });
    expect(processSpy).toHaveBeenCalled();

    expect(integration.stop()).toBe(true);
    expect(integration.stop()).toBe(false);
    expect(scanner.listenerCount('analysis-updated')).toBe(0);
  });

  test('builds market-scoped payloads from nested analytics snapshots', () => {
    const scanner = new EventEmitter();
    const integration = new LiveAlertIntegration({ marketScanner: scanner, alertEngine: new AlertEngine() });
    const payloads = integration.buildPayloads('R_75', {
      confidence: 91,
      evenOdd: { probability: 72 },
      riseFall: { confidence: 88 },
    });

    expect(payloads.some((payload) => payload.market === 'R_75' && payload.confidence === 91)).toBe(true);
    expect(payloads.some((payload) => payload.market === 'R_75' && payload.probability === 72)).toBe(true);
    expect(payloads.some((payload) => payload.market === 'R_75' && payload.confidence === 88)).toBe(true);
  });
});
