'use strict';

const {
  observeTick,
  getCountdownSeconds,
  formatCountdown,
} = require('../app/scanner/ScannerCountdown');

describe('scanner countdown', () => {
  test('anchors countdown to the Deriv tick timestamp rather than local wall time', () => {
    const market = { lastTick: null, tickIntervalSeconds: null };
    observeTick(market, { time: 1000, quote: 123 }, 1000000);

    expect(market.serverOffsetMs).toBe(0);
    expect(market.nextTickAt).toBe(1001);
    expect(getCountdownSeconds(market, 1000000)).toBe(1);
  });

  test('learns and smooths the interval and resets the next-tick countdown', () => {
    const market = { lastTick: { time: 2000 }, tickIntervalSeconds: 1 };
    observeTick(market, { time: 2002, quote: 123 }, 2002000);

    expect(market.tickIntervalSeconds).toBe(1.3);
    expect(market.nextTickAt).toBe(2003.3);
    expect(getCountdownSeconds(market, 2002000)).toBe(2);
  });

  test('formats countdown as visible MM:SS', () => {
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(7)).toBe('00:07');
    expect(formatCountdown(65)).toBe('01:05');
  });

  test('never produces a negative countdown', () => {
    const market = { serverOffsetMs: 0, nextTickAt: 100 };
    expect(getCountdownSeconds(market, 200000)).toBe(0);
  });
});
