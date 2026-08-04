/**
 * ProbabilityChart
 * Displays probability distributions as bar charts
 */

class ProbabilityChart {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas?.getContext('2d');
    this.data = null;
    this.options = options;
    this.colors = {
      bar1: '#0ea5e9',
      bar2: '#10b981',
      grid: '#2d3748',
      text: '#a0aec0',
    };
  }

  /**
   * Update chart data
   */
  updateData(data) {
    this.data = data;
    this.draw();
  }

  /**
   * Draw the chart
   */
  draw() {
    if (!this.ctx || !this.data) return;

    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw background
    this.ctx.fillStyle = '#1a1f29';
    this.ctx.fillRect(
      padding,
      padding,
      chartWidth,
      chartHeight
    );

    // Draw bars
    const barWidth = chartWidth / this.data.labels.length;
    const maxValue = Math.max(...this.data.values);

    this.data.values.forEach((value, i) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + i * barWidth + 5;
      const y = height - padding - barHeight;

      const color = i % 2 === 0 ? this.colors.bar1 : this.colors.bar2;
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, barWidth - 10, barHeight);
    });

    // Draw axes
    this.ctx.strokeStyle = this.colors.text;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(padding, padding);
    this.ctx.lineTo(padding, height - padding);
    this.ctx.lineTo(width - padding, height - padding);
    this.ctx.stroke();

    // Draw labels
    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';

    this.data.labels.forEach((label, i) => {
      const x = padding + i * barWidth + barWidth / 2;
      this.ctx.fillText(label, x, height - padding + 20);
    });
  }

  /**
   * Clear the chart
   */
  clear() {
    this.data = null;
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

module.exports = ProbabilityChart;