/** Market Scanner renderer panel. */
class MarketScannerPanel {
  constructor(containerId, api = globalThis.derivAnalytics?.scanner) {
    this.container = document.getElementById(containerId);
    this.api = api;
    this.markets = [];
    this.running = false;
    this.unsubscribe = [];
    this.bound = false;
  }
  async start() { await this.api?.start(); return this.refresh(); }
  async stop() { await this.api?.stop(); return this.refresh(); }
  async refresh() {
    if (!this.api) return;
    const [status, markets] = await Promise.all([this.api.getStatus(), this.api.getMarkets()]);
    this.running = Boolean(status?.running);
    this.markets = Array.isArray(markets) ? markets : [];
    this.render();
    return { status, markets: this.markets };
  }
  subscribe() {
    if (this.bound || !this.api?.on) return;
    const updateMarket = (payload) => {
      const market = payload?.market || payload;
      if (!market?.symbol) return;
      const index = this.markets.findIndex((item) => item.symbol === market.symbol);
      if (index >= 0) this.markets[index] = market;
      else this.markets.push(market);
      this.markets.sort((a, b) => Number(b.ranking?.score ?? b.score ?? 0) - Number(a.ranking?.score ?? a.score ?? 0));
      this.renderTable();
    };
    const statusUpdate = (payload) => { this.running = payload?.running !== undefined ? Boolean(payload.running) : this.running; this.renderStatus(); };
    for (const event of ['market-tick', 'analysis-updated', 'market-active', 'market-inactive']) this.unsubscribe.push(this.api.on(event, updateMarket));
    for (const event of ['starting', 'started', 'stopping', 'stopped']) this.unsubscribe.push(this.api.on(event, statusUpdate));
    this.unsubscribe.push(this.api.on('market-error', (payload) => { this.renderStatus(`Error: ${payload?.error || 'Market error'}`); }));
    this.bound = true;
  }
  destroy() { this.unsubscribe.splice(0).forEach((fn) => { try { fn?.(); } catch (_) {} }); this.bound = false; }
  renderStatus(message) { const node = this.container?.querySelector('.market-scanner-status'); if (node) node.textContent = message || (this.running ? 'Running' : 'Stopped'); }
  renderTable() {
    const body = this.container?.querySelector('tbody');
    if (!body) return;
    body.innerHTML = this.markets.map((m, i) => `<tr><td>${m.rank ?? i + 1}</td><td>${this._escape(m.symbol)}</td><td>${this._escape(m.lastTick?.quote ?? '')}</td><td>${this._escape(m.ranking?.score ?? m.score ?? '')}</td><td>${this._escape(m.ranking?.confidence ?? m.confidence ?? '')}</td><td>${this._escape(m.signal ?? m.dominantSignal ?? '')}</td><td>${this._escape(m.updatedAt ?? '')}</td></tr>`).join('') || '<tr><td colspan="7">No markets configured</td></tr>';
  }
  render() {
    if (!this.container) return;
    this.container.innerHTML = `<section class="market-scanner-panel" aria-label="Market Scanner"><header><h2>Market Scanner</h2><div><button data-action="start" ${this.running ? 'disabled' : ''}>Start</button><button data-action="stop" ${this.running ? '' : 'disabled'}>Stop</button><button data-action="refresh">Refresh</button></div></header><div class="market-scanner-status">${this.running ? 'Running' : 'Stopped'}</div><table><thead><tr><th>Rank</th><th>Market</th><th>Price</th><th>Score</th><th>Confidence</th><th>Signal</th><th>Updated</th></tr></thead><tbody></tbody></table></section>`;
    this.renderTable(); this.subscribe();
    this.container.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', async () => { try { if (button.dataset.action === 'start') await this.start(); else if (button.dataset.action === 'stop') await this.stop(); else await this.refresh(); } catch (error) { this.renderStatus(`Error: ${error.message}`); } }));
  }
  _escape(value) { return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
}
if (typeof module !== 'undefined') module.exports = MarketScannerPanel;
