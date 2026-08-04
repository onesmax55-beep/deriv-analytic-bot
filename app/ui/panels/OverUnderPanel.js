/**
 * OverUnderPanel
 * Displays over/under threshold analysis
 */

class OverUnderPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.analysis = null;
  }

  /**
   * Update with new analysis
   */
  updateAnalysis(analysis) {
    this.analysis = analysis;
    this.render();
  }

  /**
   * Render the panel
   */
  render() {
    if (!this.container || !this.analysis) return;

    const dist = this.analysis.distribution || {};
    const confidence = this.analysis.predictionConfidence || {};

    const predictionClass =
      confidence.prediction === 'over' ? 'over' : 'under';

    this.container.innerHTML = `
      <div class="panel over-under-panel">
        <div class="panel-header">
          <h3>Over/Under (Threshold: ${dist.threshold})</h3>
          <span class="prediction-badge ${predictionClass}">
            ${confidence.prediction?.toUpperCase()} (${(confidence.confidence || 0).toFixed(0)}%)
          </span>
        </div>
        
        <div class="panel-content">
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Over Count</div>
              <div class="metric-value">${dist.over || 0}</div>
            </div>
            
            <div class="metric-card">
              <div class="metric-label">Under Count</div>
              <div class="metric-value">${dist.under || 0}</div>
            </div>
            
            <div class="metric-card">
              <div class="metric-label">Over %</div>
              <div class="metric-value">${(dist.overPercentage || 0).toFixed(1)}%</div>
            </div>
            
            <div class="metric-card">
              <div class="metric-label">Under %</div>
              <div class="metric-value">${(dist.underPercentage || 0).toFixed(1)}%</div>
            </div>
          </div>
          
          <div class="distribution-bar">
            <div class="bar-segment over" style="width: ${dist.overPercentage || 0}%">
              <span class="bar-label">Over</span>
            </div>
            <div class="bar-segment under" style="width: ${dist.underPercentage || 0}%">
              <span class="bar-label">Under</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

module.exports = OverUnderPanel;