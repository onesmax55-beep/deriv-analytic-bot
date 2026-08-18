const Database = require('../app/database/Database');
const AlertHistoryRepository = require('../app/database/repositories/AlertHistoryRepository');

function event(overrides = {}) {
  return {
    id: 'rule-1:1700000000000',
    ruleId: 'rule-1',
    rule: { id: 'rule-1', name: 'High confidence', type: 'confidence' },
    market: 'R_100',
    value: 92,
    payload: { confidence: 92 },
    triggeredAt: '2026-08-17T01:00:00.000Z',
    ...overrides,
  };
}

describe('AlertHistoryRepository', () => {
  let database;
  let repository;

  beforeEach(async () => {
    database = new Database({ dbPath: ':memory:' });
    await database.connect();
    repository = new AlertHistoryRepository(database);
  });

  afterEach(async () => {
    await database.close();
  });

  test('persists a triggered event with structured context', async () => {
    const saved = await repository.save(event(), { sessionId: 'session-1' });
    const rows = await repository.list({ sessionId: 'session-1' });

    expect(saved.acknowledged).toBe(false);
    expect(rows).toHaveLength(1);
    expect(rows[0].rule_id).toBe('rule-1');
    expect(rows[0].market).toBe('R_100');
    expect(JSON.parse(rows[0].alert_data)).toEqual({
      eventId: 'rule-1:1700000000000',
      value: 92,
      payload: { confidence: 92 },
    });
  });

  test('filters by market and acknowledgement state', async () => {
    const first = await repository.save(event(), { sessionId: 'session-1' });
    await repository.save(event({ id: 'rule-2:1700000000001', market: 'R_50' }));

    expect(await repository.list({ market: 'R_100', acknowledged: false })).toHaveLength(1);
    expect(await repository.acknowledge(first.id)).toBe(true);
  });

  test('counts acknowledged and unacknowledged alerts', async () => {
    const saved = await repository.save(event());
    await repository.save(event({ id: 'rule-2:1700000000001' }));

    expect(await repository.getCount({ acknowledged: false })).toBe(2);
    expect(await repository.acknowledge(saved.id)).toBe(true);
    expect(await repository.getCount({ acknowledged: true })).toBe(1);
    expect(await repository.getCount({ acknowledged: false })).toBe(1);
  });
});
