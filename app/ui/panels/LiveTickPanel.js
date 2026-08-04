/**
 * LiveTickPanel
 * Displays real-time tick data and recent history
 */

class LiveTickPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.ticks = [];
    this.maxTicks = 100;
    this.tickRate = 0;
    this.lastUpdateTime = 0;
  }

  /**
   * Add a new tick
   */
  addTick(tickValue, timestamp) {
    this.ticks.unshift({
      value: tickValue,
      timestamp,
      direction: this.ticks.length > 0 ? (tickValue > this.ticks[0].value ? '↑' : tickValue < this.ticks[0].value ? '↓' : '→') : '→',
    });

    // Keep only recent ticks
    if (this.ticks.length > this.maxTicks) {
      this.ticks.pop();
    }

    // Update tick rate
    const now = Date.now();
    if (now - this.lastUpdateTime >= 1000) {
      this.lastUpdateTime = now;
    }
  }

  /**
   * Render the panel
   */
  render() {
    if (!this.container) return;

    const tickRows = this.ticks
      .slice(0, 20)
      .map(
        (tick, i) => `
      <div class="tick-row">
        <span class="tick-index">#${i + 1}</span>
        <span class="tick-value">${tick.value}</span>
        <span class="tick-direction ${tick.direction === '↑' ? 'up' : tick.direction === '↓' ? 'down' : 'neutral'}">${tick.direction}</span>
        <span class="tick-time">${new Date(tick.timestamp).toLocaleTimeString()}</span>
      </div>
    `
      )
      .join('');

    this.container.innerHTML = `
      <div class="panel live-tick-panel">
        <div class="panel-header">
          <h3>Live Ticks</h3>
          <span class="tick-count">${this.ticks.length} ticks</span>
        </div>
        <div class="tick-list">
          ${tickRows || '<p class="empty-state">Waiting for ticks...</p>'}
        </div>
      </div>
    `;
  }
}

module.exports = LiveTickPanel;