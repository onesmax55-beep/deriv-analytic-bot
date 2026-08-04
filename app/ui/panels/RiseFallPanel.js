/**
 * RiseFallPanel
 * Displays rise/fall trend analysis
 */

class RiseFallPanel {
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

    const ratio = this.analysis.riseFallRatio || {};
    const momentum = this.analysis.momentum || {};
    const trend = this.analysis.trendStrength || {};
    const volatility = this.analysis.volatility || {};

    const trendDirection = ratio.risePercentage > ratio.fallPercentage ? '📈 Bullish' : '📉 Bearish';
    const momentumDirection = momentum.momentum > 0 ? '↑ Upward' : '↓ Downward';

    this.container.innerHTML = `
      <div class="panel rise-fall-panel">
        <div class="panel-header">
          <h3>Rise/Fall Analysis</h3>
          <span class="trend-badge ${ratio.risePercentage > 50 ? 'bullish' : 'bearish'}">
            ${trendDirection}
          </span>
        </div>
        
        <div class="panel-content">
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Rise %</div>
              <div class="metric-value" data-value="${ratio.risePercentage || 0}">
                ${(ratio.risePercentage || 0).toFixed(1)}%
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-label">Fall %</div>
              <div class="metric-value" data-value="${ratio.fallPercentage || 0}">
                ${(ratio.fallPercentage || 0).toFixed(1)}%
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-label">Momentum</div>
              <div class="metric-value" data-direction="${momentum.momentum > 0 ? 'up' : 'down'}">
                ${(momentum.momentumPercentage || 0).toFixed(2)}%
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-label">Trend Strength</div>
              <div class="metric-value">${(trend.trendStrength || 0).toFixed(0)}%</div>
            </div>
            
            <div class="metric-card">
              <div class="metric-label">Volatility</div>
              <div class="metric-value" data-level="${volatility.volatilityLevel || 'low'}">
                ${volatility.volatilityLevel || 'N/A'}
              </div>
            </div>
          </div>
          
          <div class="distribution-bar">
            <div class="bar-segment rise" style="width: ${ratio.risePercentage || 0}%">
              <span class="bar-label">Rise</span>
            </div>
            <div class="bar-segment fall" style="width: ${ratio.fallPercentage || 0}%">
              <span class="bar-label">Fall</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

module.exports = RiseFallPanel;