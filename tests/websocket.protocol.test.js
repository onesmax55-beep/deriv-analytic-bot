'use strict';

const protocol = require('../app/websocket/protocol');

describe('Deriv protocol contract', () => {
  test('builds valid tick subscription requests', () => {
    const request = protocol.buildRequest('subscribe', { ticks: 'R_100' });

    expect(request).toMatchObject({
      subscribe: 1,
      ticks: 'R_100',
    });
    expect(typeof request.req_id).toBe('number');
  });

  test('parses JSON responses and preserves tick payloads', () => {
    const payload = {
      msg_type: 'tick',
      tick: {
        symbol: 'R_100',
        quote: 100.25,
        epoch: 1700000000,
      },
    };

    expect(protocol.parseResponse(JSON.stringify(payload))).toEqual(payload);
  });

  test('rejects malformed protocol messages', () => {
    expect(() => protocol.parseResponse('{not-json}')).toThrow();
  });
});
