/**
 * EvenOddPanel
 * Displays even/odd analysis
 */

class EvenOddPanel {
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

    const prob = this.analysis.probabilities?.[100];
    const streaks = this.analysis.streaks || {};

    this.container.innerHTML = `
      <div class="panel even-odd-panel">
        <div class="panel-header">
          <h3>Even/Odd Analysis</h3>
        </div>
        
        <div class="panel-content">
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Even %</div>
              <div class="metric-value" data-value="${prob?.evenPercentage || 0}">
                ${(prob?.evenPercentage || 0).toFixed(1)}%
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-label">Odd %</div>
              <div class="metric-value" data-value="${prob?.oddPercentage || 0}">
                ${(prob?.oddPercentage || 0).toFixed(1)}%
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-label">Current Streak</div>
              <div class="metric-value">${streaks.currentStreak || 0}</div>
            </div>
            
            <div class="metric-card">
              <div class="metric-label">Longest Streak</div>
              <div class="metric-value">${streaks.longestStreak || 0}</div>
            </div>
          </div>
          
          <div class="distribution-bar">
            <div class="bar-segment even" style="width: ${prob?.evenPercentage || 0}%">
              <span class="bar-label">Even</span>
            </div>
            <div class="bar-segment odd" style="width: ${prob?.oddPercentage || 0}%">
              <span class="bar-label">Odd</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

module.exports = EvenOddPanel;