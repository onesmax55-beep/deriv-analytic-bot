/** Market Scanner renderer panel. */
class MarketScannerPanel {
  constructor(containerId, api = globalThis.derivAnalytics?.scanner) {
    this.container = document.getElementById(containerId);
    this.api = api;
    this.markets = [];
    this.running = false;
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
  render() {
    if (!this.container) return;
    const rows = this.markets.map((m, i) => `<tr><td>${m.rank ?? i + 1}</td><td>${this._escape(m.symbol)}</td><td>${this._escape(m.lastTick?.quote ?? m.price ?? '')}</td><td>${this._escape(m.ranking?.score ?? m.score ?? '')}</td><td>${this._escape(m.ranking?.confidence ?? m.confidence ?? '')}</td><td>${this._escape(m.signal ?? m.dominantSignal ?? '')}</td><td>${this._escape(m.updatedAt ?? '')}</td></tr>`).join('');
    this.container.innerHTML = `<section class="market-scanner-panel" aria-label="Market Scanner"><header><h2>Market Scanner</h2><div><button data-action="start" ${this.running ? 'disabled' : ''}>Start</button><button data-action="stop" ${this.running ? '' : 'disabled'}>Stop</button><button data-action="refresh">Refresh</button></div></header><div class="market-scanner-status">${this.running ? 'Running' : 'Stopped'}</div><table><thead><tr><th>Rank</th><th>Market</th><th>Price</th><th>Score</th><th>Confidence</th><th>Signal</th><th>Updated</th></tr></thead><tbody>${rows || '<tr><td colspan="7">No markets configured</td></tr>'}</tbody></table></section>`;
    this.container.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', async () => {
      if (button.dataset.action === 'start') await this.start();
      else if (button.dataset.action === 'stop') await this.stop();
      else await this.refresh();
    }));
  }
  _escape(value) { return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
}
if (typeof module !== 'undefined') module.exports = MarketScannerPanel;
