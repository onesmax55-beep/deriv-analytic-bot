/**
 * MarketScanner
 * Coordinates simultaneous market subscriptions and isolated analytics.
 */

const EventEmitter = require('events');
const MarketAnalytics = require('./MarketAnalytics');

const DEFAULT_SYMBOLS = ['R_50', 'R_75', 'R_100', 'R_200'];

class MarketScanner extends EventEmitter {
  constructor(options = {}) {
    super();
    if (!options.connectionManager) throw new Error('MarketScanner requires a connectionManager');
    this.connectionManager = options.connectionManager;
    this.defaultSymbols = this.normalizeSymbols(options.defaultSymbols || DEFAULT_SYMBOLS);
    this.symbols = new Set();
    this.markets = new Map();
    this.running = false;
    this.tickHandler = (tick) => this.handleTick(tick);
    this.connectionManager.on('tick', this.tickHandler);
  }

  normalizeSymbol(symbol) {
    if (typeof symbol !== 'string') return null;
    const normalized = symbol.trim().toUpperCase();
    return normalized || null;
  }

  normalizeSymbols(symbols) {
    if (!Array.isArray(symbols)) throw new TypeError('symbols must be an array');
    return [...new Set(symbols.map((symbol) => this.normalizeSymbol(symbol)).filter(Boolean))];
  }

  async start(symbols = this.defaultSymbols) {
    const requested = this.normalizeSymbols(symbols);
    if (this.running) {
      if (!this.sameSymbols(requested)) await this.setMarkets(requested);
      return this.getStatus();
    }
    this.running = true;
    this.emit('starting', { symbols: requested });
    try {
      await this.applySubscriptions(requested);
      this.emit('started', this.getStatus());
      return this.getStatus();
    } catch (error) {
      this.running = false;
      await this.unsubscribeAll().catch(() => {});
      this.emit('error', error);
      throw error;
    }
  }

  async stop() {
    if (!this.running && this.symbols.size === 0) return this.getStatus();
    this.emit('stopping', this.getStatus());
    await this.unsubscribeAll();
    this.running = false;
    this.emit('stopped', this.getStatus());
    return this.getStatus();
  }

  async setMarkets(symbols) {
    const requested = this.normalizeSymbols(symbols);
    const requestedSet = new Set(requested);
    if (!this.running) {
      this.symbols = requestedSet;
      requested.forEach((symbol) => this.ensureMarket(symbol));
      this.emit('markets-changed', this.getMarkets());
      return this.getStatus();
    }
    for (const symbol of [...this.symbols]) {
      if (!requestedSet.has(symbol)) await this.unsubscribe(symbol);
    }
    for (const symbol of requested) {
      if (!this.symbols.has(symbol)) await this.subscribe(symbol);
    }
    this.emit('markets-changed', this.getMarkets());
    return this.getStatus();
  }

  async refresh() {
    if (!this.running) return this.getStatus();
    const symbols = [...this.symbols];
    await this.stop();
    return this.start(symbols);
  }

  async applySubscriptions(symbols) {
    for (const symbol of symbols) await this.subscribe(symbol);
  }

  async subscribe(symbol) {
    if (this.symbols.has(symbol)) return this.getMarket(symbol);
    const market = this.ensureMarket(symbol);
    try {
      await this.connectionManager.subscribe(symbol);
      market.status = 'active';
      market.error = null;
      market.subscribedAt = Date.now();
      this.symbols.add(symbol);
      this.emit('market-active', this.getMarket(symbol));
      return this.getMarket(symbol);
    } catch (error) {
      market.status = 'error';
      market.error = error.message;
      this.emit('market-error', { symbol, error: error.message });
      throw error;
    }
  }

  async unsubscribe(symbol) {
    if (!this.symbols.has(symbol)) return;
    try {
      await this.connectionManager.unsubscribe(symbol);
    } finally {
      this.symbols.delete(symbol);
      const market = this.markets.get(symbol);
      if (market) {
        market.status = 'inactive';
        market.unsubscribedAt = Date.now();
      }
      this.emit('market-inactive', this.getMarket(symbol));
    }
  }

  async unsubscribeAll() {
    const failures = [];
    for (const symbol of [...this.symbols]) {
      try { await this.unsubscribe(symbol); } catch (error) { failures.push({ symbol, error }); }
    }
    if (failures.length) {
      const error = new Error('One or more market unsubscriptions failed');
      error.failures = failures;
      throw error;
    }
  }

  handleTick(tick) {
    const symbol = this.normalizeSymbol(tick && tick.symbol);
    if (!symbol || !this.symbols.has(symbol)) return;
    const market = this.ensureMarket(symbol);
    market.lastTick = { symbol, quote: tick.quote, time: tick.time };
    market.tickCount += 1;
    market.updatedAt = Date.now();
    market.analytics.addTick(tick.quote);
    const snapshot = this.getMarket(symbol);
    this.emit('market-tick', { market: snapshot, tick: { ...market.lastTick }, analysis: snapshot.analysis });
    this.emit('analysis-updated', { symbol, analysis: snapshot.analysis });
  }

  ensureMarket(symbol) {
    if (!this.markets.has(symbol)) {
      this.markets.set(symbol, {
        symbol,
        status: 'inactive',
        subscribedAt: null,
        unsubscribedAt: null,
        updatedAt: null,
        tickCount: 0,
        lastTick: null,
        error: null,
        analytics: new MarketAnalytics({ symbol, analyzerOptions: this.analyzerOptions }),
      });
    }
    return this.markets.get(symbol);
  }

  sameSymbols(symbols) {
    return symbols.length === this.symbols.size && symbols.every((symbol) => this.symbols.has(symbol));
  }

  getMarket(symbol) {
    const market = this.markets.get(this.normalizeSymbol(symbol));
    if (!market) return null;
    return {
      symbol: market.symbol,
      status: market.status,
      subscribedAt: market.subscribedAt,
      unsubscribedAt: market.unsubscribedAt,
      updatedAt: market.updatedAt,
      tickCount: market.tickCount,
      lastTick: market.lastTick && { ...market.lastTick },
      error: market.error,
      analysis: market.analytics.getSnapshot(),
    };
  }

  getMarkets() {
    return [...this.markets.keys()].map((symbol) => this.getMarket(symbol));
  }

  getActiveSymbols() { return [...this.symbols]; }

  getStatus() {
    return { running: this.running, symbols: this.getActiveSymbols(), marketCount: this.symbols.size, markets: this.getMarkets() };
  }

  dispose() {
    this.connectionManager.off('tick', this.tickHandler);
    this.removeAllListeners();
    this.symbols.clear();
    this.markets.clear();
    this.running = false;
  }
}

module.exports = MarketScanner;
