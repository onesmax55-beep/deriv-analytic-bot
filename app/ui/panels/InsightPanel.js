/**
 * InsightPanel
 * Displays AI-generated market insights
 */

class InsightPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.insights = [];
  }

  /**
   * Update with new insights
   */
  updateInsights(insights) {
    this.insights = insights || [];
    this.render();
  }

  /**
   * Render the panel
   */
  render() {
    if (!this.container) return;

    const insightRows = this.insights
      .slice(0, 10)
      .map(
        (insight, i) => `
      <div class="insight-card">
        <div class="insight-icon">
          ${this.getInsightIcon(insight)}
        </div>
        <div class="insight-content">
          <p class="insight-text">${insight}</p>
          <span class="insight-timestamp">now</span>
        </div>
      </div>
    `
      )
      .join('');

    this.container.innerHTML = `
      <div class="panel insight-panel">
        <div class="panel-header">
          <h3>AI Insights</h3>
          <button class="clear-insights-btn">Clear</button>
        </div>
        <div class="insight-list">
          ${insightRows || '<p class="empty-state">Waiting for insights...</p>'}
        </div>
      </div>
    `;

    // Attach clear button listener
    const clearBtn = this.container.querySelector('.clear-insights-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.insights = [];
        this.render();
      });
    }
  }

  /**
   * Get icon for insight type
   */
  getInsightIcon(insight) {
    if (insight.toLowerCase().includes('trend')) return '📈';
    if (insight.toLowerCase().includes('volatility')) return '📊';
    if (insight.toLowerCase().includes('pattern')) return '🔄';
    if (insight.toLowerCase().includes('anomal')) return '⚠️';
    if (insight.toLowerCase().includes('streak')) return '⛓️';
    if (insight.toLowerCase().includes('momentum')) return '💨';
    if (insight.toLowerCase().includes('insufficient')) return '❗';
    return '💡';
  }
}

module.exports = InsightPanel;