'use strict';

const DEFAULT_MARKETS = ['R_50', 'R_75', 'R_100', 'R_200'];

class ScannerConfiguration {
  constructor(options = {}) {
    if (!options.settingsManager) throw new Error('ScannerConfiguration requires a settingsManager');
    if (!options.marketScanner) throw new Error('ScannerConfiguration requires a marketScanner');
    this.settingsManager = options.settingsManager;
    this.marketScanner = options.marketScanner;
    this.maxMarkets = Number.isInteger(options.maxMarkets) ? options.maxMarkets : 100;
  }

  normalize(markets) {
    if (!Array.isArray(markets)) throw new TypeError('markets must be an array');
    if (markets.length === 0) throw new Error('At least one market is required');
    if (markets.length > this.maxMarkets) throw new Error(`Too many markets; maximum is ${this.maxMarkets}`);

    const normalized = [];
    const seen = new Set();
    for (const market of markets) {
      if (typeof market !== 'string') throw new TypeError('Market symbols must be strings');
      const symbol = market.trim().toUpperCase();
      if (!/^[A-Z0-9_]+$/.test(symbol)) throw new Error(`Invalid market symbol: ${market}`);
      if (!seen.has(symbol)) {
        seen.add(symbol);
        normalized.push(symbol);
      }
    }
    if (normalized.length === 0) throw new Error('At least one market is required');
    return normalized;
  }

  async getMarkets() {
    const configured = await this.settingsManager.get('scannerMarkets', DEFAULT_MARKETS);
    try { return this.normalize(configured); }
    catch (_) { return [...DEFAULT_MARKETS]; }
  }

  async setMarkets(markets) {
    const normalized = this.normalize(markets);
    await this.settingsManager.set('scannerMarkets', normalized);
    await this.marketScanner.setMarkets(normalized);
    return { markets: normalized, status: this.marketScanner.getStatus() };
  }

  async apply() {
    return this.setMarkets(await this.getMarkets());
  }

  async reset() {
    return this.setMarkets(DEFAULT_MARKETS);
  }

  getDefaults() { return [...DEFAULT_MARKETS]; }
}

module.exports = ScannerConfiguration;
