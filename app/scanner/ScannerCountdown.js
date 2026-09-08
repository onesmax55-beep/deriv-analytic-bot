/**
 * Scanner countdown helpers.
 *
 * Deriv tick epochs are authoritative server timestamps. The countdown is
 * anchored to those timestamps and uses a per-market server clock offset so
 * the renderer never depends directly on the user's wall clock.
 */

const MIN_INTERVAL_SECONDS = 0.25;
const MAX_INTERVAL_SECONDS = 10;
const DEFAULT_INTERVAL_SECONDS = 1;

function clampInterval(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_INTERVAL_SECONDS;
  return Math.min(MAX_INTERVAL_SECONDS, Math.max(MIN_INTERVAL_SECONDS, value));
}

function observeTick(market, tick, localNowMs = Date.now()) {
  const epoch = Number(tick?.time);
  if (!Number.isFinite(epoch)) return market;

  const previousEpoch = Number(market?.lastTick?.time);
  const measuredInterval = Number.isFinite(previousEpoch) ? epoch - previousEpoch : NaN;
  const intervalSeconds = clampInterval(measuredInterval);
  const previousInterval = Number(market?.tickIntervalSeconds);
  const smoothedInterval = Number.isFinite(previousInterval)
    ? clampInterval((previousInterval * 0.7) + (intervalSeconds * 0.3))
    : intervalSeconds;

  market.tickIntervalSeconds = smoothedInterval;
  market.serverOffsetMs = (epoch * 1000) - localNowMs;
  market.nextTickAt = epoch + smoothedInterval;
  market.countdownSeconds = Math.max(0, Math.ceil(smoothedInterval));
  return market;
}

function getServerNowMs(market, localNowMs = Date.now()) {
  return localNowMs + Number(market?.serverOffsetMs || 0);
}

function getCountdownSeconds(market, localNowMs = Date.now()) {
  const nextTickAt = Number(market?.nextTickAt);
  if (!Number.isFinite(nextTickAt)) return null;
  return Math.max(0, Math.ceil(nextTickAt - (getServerNowMs(market, localNowMs) / 1000)));
}

function formatCountdown(seconds) {
  if (seconds === null || seconds === undefined || !Number.isFinite(Number(seconds))) return '--:--';
  const total = Math.max(0, Math.floor(Number(seconds)));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

module.exports = {
  clampInterval,
  observeTick,
  getServerNowMs,
  getCountdownSeconds,
  formatCountdown,
};
