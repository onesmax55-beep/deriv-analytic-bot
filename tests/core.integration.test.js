'use strict';

const Database = require('../app/database/Database');
const SessionRepository = require('../app/database/repositories/SessionRepository');
const AnalyticsEngine = require('../app/analytics/AnalyticsEngine');
const ReplayEngine = require('../app/replay/ReplayEngine');

describe('core application integration', () => {
  let database;

  beforeEach(async () => {
    database = new Database({ dbPath: ':memory:' });
    await database.connect();
  });

  afterEach(async () => {
    await database.close();
  });

  test('initializes SQLite schema and persists a session', async () => {
    const repository = new SessionRepository(database);

    const sessionId = await repository.createSession('R_100');
    const session = await repository.getSession(sessionId);

    expect(session).toBeDefined();
    expect(session.id).toBe(sessionId);
    expect(session.symbol).toBe('R_100');
    expect(session.status).toBe('active');

    await repository.endSession(sessionId);
    const closed = await repository.getSession(sessionId);
    expect(closed.status).toBe('closed');
  });

  test('processes ticks and produces an analytics snapshot', () => {
    const analytics = new AnalyticsEngine({ symbol: 'R_100' });

    for (let i = 0; i < 50; i += 1) {
      analytics.processTick(100 + (i % 10) / 10);
    }

    const snapshot = analytics.generateSnapshot();

    expect(snapshot).toBeDefined();
    expect(snapshot.symbol).toBe('R_100');
    expect(snapshot.tickCount).toBe(50);
    expect(snapshot.evenOdd).toBeDefined();
    expect(snapshot.matchesDiffers).toBeDefined();
    expect(snapshot.riseFall).toBeDefined();
    expect(snapshot.overUnder).toBeDefined();
    expect(snapshot.patterns).toBeDefined();
    expect(typeof snapshot.confidence).toBe('number');
    expect(snapshot.signals).toBeDefined();
    expect(snapshot.insights).toBeDefined();
  });

  test('supports replay stepping, seeking, and speed changes', () => {
    const replay = new ReplayEngine({ tickInterval: 1 });
    const ticks = [
      { value: 100.1, timestamp: 1 },
      { value: 100.2, timestamp: 2 },
      { value: 100.3, timestamp: 3 },
    ];

    replay.loadTicks(ticks);
    expect(replay.getStatus().totalTicks).toBe(3);
    expect(replay.stepForward()).toBeUndefined();
    expect(replay.getStatus().currentIndex).toBe(1);

    expect(replay.seek(2)).toBe(true);
    expect(replay.getStatus().currentIndex).toBe(2);

    expect(replay.stepBackward()).toBeUndefined();
    expect(replay.getStatus().currentIndex).toBe(1);

    expect(replay.setSpeed(5)).toBe(true);
    expect(replay.getStatus().speed).toBe(5);
    expect(replay.setSpeed(3)).toBe(false);
  });
});
