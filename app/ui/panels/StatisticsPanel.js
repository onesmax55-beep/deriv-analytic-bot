/**
 * StatisticsPanel
 * Displays detailed statistical metrics
 */

class StatisticsPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.data = null;
  }

  /**
   * Update with new data
   */
  updateData(data) {
    this.data = data;
    this.render();
  }

  /**
   * Render the panel
   */
  render() {
    if (!this.container || !this.data) return;

    const matchesDiffers = this.data.matchesDiffers || {};
    const freq = matchesDiffers.digitFrequency || {};
    const sorted = freq.sorted || [];

    const digitRows = sorted
      .slice(0, 10)
      .map(
        (d) => `
      <tr>
        <td class="digit-label">${d.digit}</td>
        <td class="digit-count">${d.count}</td>
        <td class="digit-bar">
          <div class="bar" style="width: ${d.percentage}%"></div>
        </td>
        <td class="digit-percentage">${d.percentage.toFixed(1)}%</td>
      </tr>
    `
      )
      .join('');

    const hotCold = matchesDiffers.hotColdDigits || {};
    const hotDigits = hotCold.hot?.map((d) => d.digit).join(', ') || 'None';
    const coldDigits = hotCold.cold?.map((d) => d.digit).join(', ') || 'None';
    const missing = matchesDiffers.missingDigits || [];

    this.container.innerHTML = `
      <div class="panel statistics-panel">
        <div class="panel-header">
          <h3>Statistics</h3>
        </div>
        
        <div class="panel-content">
          <div class="stats-section">
            <h4>Digit Frequency</h4>
            <table class="frequency-table">
              <thead>
                <tr>
                  <th>Digit</th>
                  <th>Count</th>
                  <th>Distribution</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                ${digitRows}
              </tbody>
            </table>
          </div>
          
          <div class="stats-section">
            <h4>Hot/Cold Digits</h4>
            <div class="hot-cold">
              <div class="hot-digits">
                <span class="label">Hot:</span>
                <span class="values">${hotDigits}</span>
              </div>
              <div class="cold-digits">
                <span class="label">Cold:</span>
                <span class="values">${coldDigits}</span>
              </div>
              <div class="missing-digits">
                <span class="label">Missing:</span>
                <span class="values">${missing.length > 0 ? missing.join(', ') : 'None'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

module.exports = StatisticsPanel;