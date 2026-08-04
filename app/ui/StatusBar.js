/**
 * StatusBar
 * Displays application status information
 */

class StatusBar {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.status = {
      connected: false,
      symbol: 'R_100',
      tickRate: 0,
      latency: 0,
      confidence: 0,
      timestamp: new Date(),
    };
    this.tickCount = 0;
    this.lastTickTime = 0;
  }

  /**
   * Update status
   */
  updateStatus(newStatus) {
    Object.assign(this.status, newStatus);
    this.render();
  }

  /**
   * Record a tick for tick rate calculation
   */
  recordTick() {
    const now = Date.now();
    this.tickCount++;

    if (this.lastTickTime === 0) {
      this.lastTickTime = now;
    }

    // Calculate tick rate every second
    if (now - this.lastTickTime >= 1000) {
      this.status.tickRate = this.tickCount;
      this.tickCount = 0;
      this.lastTickTime = now;
      this.render();
    }
  }

  /**
   * Update connection status
   */
  setConnected(connected, latency = 0) {
    this.status.connected = connected;
    this.status.latency = latency;
    this.render();
  }

  /**
   * Update symbol
   */
  setSymbol(symbol) {
    this.status.symbol = symbol;
    this.render();
  }

  /**
   * Update confidence
   */
  setConfidence(confidence) {
    this.status.confidence = confidence;
    this.render();
  }

  /**
   * Render status bar
   */
  render() {
    if (!this.container) return;

    const connectionClass = this.status.connected ? 'connected' : 'disconnected';
    const connectionText = this.status.connected
      ? `Connected (${this.status.latency}ms)`
      : 'Disconnected';

    this.container.innerHTML = `
      <div class="status-bar">
        <div class="status-group">
          <span class="status-indicator ${connectionClass}"></span>
          <span class="status-text">${connectionText}</span>
        </div>
        <div class="status-group">
          <span class="status-label">Symbol:</span>
          <span class="status-value">${this.status.symbol}</span>
        </div>
        <div class="status-group">
          <span class="status-label">Tick Rate:</span>
          <span class="status-value">${this.status.tickRate} ticks/s</span>
        </div>
        <div class="status-group">
          <span class="status-label">Confidence:</span>
          <span class="status-value confidence" data-confidence="${this.status.confidence}">
            ${this.status.confidence}%
          </span>
        </div>
        <div class="status-group">
          <span class="status-time">${this.status.timestamp.toLocaleTimeString()}</span>
        </div>
      </div>
    `;
  }
}

module.exports = StatusBar;