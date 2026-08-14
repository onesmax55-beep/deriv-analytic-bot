/**
 * Deriv WebSocket Protocol
 * Defines constants and utilities for Deriv API communication
 */

const DERIV_API_URL = 'wss://ws.derivws.com/websockets/v3';

const MESSAGE_TYPES = {
  TICKS: 'ticks',
  TICK: 'tick',
  AUTHORIZE: 'authorize',
  PING: 'ping',
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  ACTIVE_SYMBOLS: 'active_symbols',
  SYMBOL_PROPERTIES: 'symbol_properties',
  ERROR: 'error',
};

const TICK_STREAMS = {
  R_50: 'R_50',
  R_100: 'R_100',
  FRXEURUSD: 'frxEURUSD',
  FRXGBPUSD: 'frxGBPUSD',
  FRXUSDJPY: 'frxUSDJPY',
};

const SUBSCRIPTION_STATUS = {
  IDLE: 'idle',
  SUBSCRIBING: 'subscribing',
  ACTIVE: 'active',
  UNSUBSCRIBING: 'unsubscribing',
  FAILED: 'failed',
};

const CONNECTION_STATE = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  CLOSED: 'closed',
};

const ERROR_CODES = {
  AUTH_FAILED: 'AuthenticationFailed',
  SUBSCRIPTION_FAILED: 'SubscriptionFailed',
  INVALID_REQUEST: 'InvalidRequest',
  TIMEOUT: 'Timeout',
  CONNECTION_LOST: 'ConnectionLost',
  PROTOCOL_ERROR: 'ProtocolError',
};

/**
 * Generate a numeric request ID as required by the Deriv API contract.
 */
function generateRequestId() {
  return Math.floor(Math.random() * 1000000000);
}

function buildRequest(type, params = {}) {
  return {
    ...params,
    [type]: 1,
    req_id: generateRequestId(),
  };
}

function parseResponse(data) {
  try {
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to parse Deriv response: ${error.message}`);
  }
}

module.exports = {
  DERIV_API_URL,
  MESSAGE_TYPES,
  TICK_STREAMS,
  SUBSCRIPTION_STATUS,
  CONNECTION_STATE,
  ERROR_CODES,
  generateRequestId,
  buildRequest,
  parseResponse,
};
