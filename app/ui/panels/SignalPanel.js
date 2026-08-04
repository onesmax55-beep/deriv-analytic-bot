/**
 * SignalPanel
 * Displays high-confidence signals and recommendations
 */

class SignalPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.signals = [];
  }

  /**
   * Update with new signals
   */
  updateSignals(signals) {
    this.signals = signals || [];
    this.render();
  }

  /**
   * Render the panel
   */
  render() {
    if (!this.container) return;

    const signalRows = this.signals
      .filter((s) => s.confidence > 60)
      .sort((a, b) => b.confidence - a.confidence)
      .map(
        (signal) => `
      <div class="signal-card confidence-${this.getConfidenceLevel(signal.confidence)}">
        <div class="signal-header">
          <div class="signal-type">${this.formatSignalType(signal.type)}</div>
          <div class="signal-confidence" data-confidence="${signal.confidence}">
            ${signal.confidence}%
          </div>
        </div>
        <div class="signal-body">
          <div class="signal-direction">${signal.direction?.toUpperCase()}</div>
          <div class="signal-metrics">
            ${signal.bias ? `<span>Bias: ${signal.bias.toFixed(1)}%</span>` : ''}
            ${signal.bias !== undefined ? '' : ''}
          </div>
        </div>
      </div>
    `
      )
      .join('');

    this.container.innerHTML = `
      <div class="panel signal-panel">
        <div class="panel-header">
          <h3>High-Confidence Signals</h3>
          <span class="signal-count">${this.signals.filter((s) => s.confidence > 60).length} active</span>
        </div>
        <div class="signal-list">
          ${signalRows || '<p class="empty-state">No high-confidence signals</p>'}
        </div>
      </div>
    `;
  }

  /**
   * Get confidence level class
   */
  getConfidenceLevel(confidence) {
    if (confidence >= 80) return 'high';
    if (confidence >= 70) return 'medium';
    return 'low';
  }

  /**
   * Format signal type for display
   */
  formatSignalType(type) {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

module.exports = SignalPanel;