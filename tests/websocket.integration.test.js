'use strict';

const EventEmitter = require('events');

class MockDerivClient extends EventEmitter {
  constructor() {
    super();
    this.isConnected = false;
    this.messageBuffer = [];
    this.requestCallbacks = new Map();
  }

  async connect() {
    this.isConnected = true;
    this.emit('connected');
  }

  async disconnect() {
    this.isConnected = false;
    this.emit('disconnected');
  }

  request(type, params) {
    if (type === 'subscribe') {
      return Promise.resolve({ req_id: 101, echo_req: params });
    }
    if (type === 'unsubscribe') {
      return Promise.resolve({ req_id: 102, echo_req: params });
    }
    return Promise.resolve({});
  }

  send(message) {
    this.messageBuffer.push(message);
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      bufferedMessages: this.messageBuffer.length,
      pendingRequests: this.requestCallbacks.size,
    };
  }
}

jest.mock('../app/websocket/DerivClient', () => MockDerivClient);

const ConnectionManager = require('../app/websocket/ConnectionManager');
const { CONNECTION_STATE } = require('../app/websocket/protocol');

describe('Deriv WebSocket integration boundary', () => {
  let manager;

  beforeEach(() => {
    manager = new ConnectionManager({ heartbeatInterval: 60000, maxRetries: 1 });
  });

  afterEach(async () => {
    await manager.disconnect();
  });

  test('connects and exposes a connected status', async () => {
    await manager.connect();

    const status = manager.getStatus();
    expect(status.state).toBe(CONNECTION_STATE.CONNECTED);
    expect(status.connected).toBe(true);
  });

  test('subscribes to a symbol and creates a tick stream', async () => {
    await manager.connect();

    await manager.subscribe('R_100');

    expect(manager.getStatus().subscriptions).toBe(1);
    expect(manager.getStatus().activeStreams).toBe(1);
    expect(manager.getTickStream('R_100')).toBeDefined();
  });

  test('routes a Deriv tick into the symbol tick stream and emits it', async () => {
    await manager.connect();
    await manager.subscribe('R_100');

    const received = [];
    manager.on('tick', (tick) => received.push(tick));

    manager.messageRouter.emit('tick', {
      tick: {
        symbol: 'R_100',
        quote: 123.45,
        epoch: 1700000000,
      },
    });

    const stream = manager.getTickStream('R_100');
    expect(received).toEqual([
      { symbol: 'R_100', quote: 123.45, time: 1700000000 },
    ]);
    expect(stream.getSize()).toBe(1);
  });

  test('rejects subscription while disconnected', async () => {
    await expect(manager.subscribe('R_100')).rejects.toThrow('Not connected to Deriv');
  });

  test('unsubscribes and removes the active tick stream', async () => {
    await manager.connect();
    await manager.subscribe('R_100');
    await manager.unsubscribe('R_100');

    expect(manager.getStatus().subscriptions).toBe(0);
    expect(manager.getTickStream('R_100')).toBeUndefined();
  });
});
