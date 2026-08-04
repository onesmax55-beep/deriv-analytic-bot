/**
 * GaugeChart
 * Displays metrics as circular gauge indicators
 */

class GaugeChart {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas?.getContext('2d');
    this.value = options.value || 0;
    this.min = options.min || 0;
    this.max = options.max || 100;
    this.label = options.label || 'Gauge';
    this.unit = options.unit || '%';
    this.colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
    };
  }

  /**
   * Update gauge value
   */
  setValue(value) {
    this.value = Math.max(this.min, Math.min(this.max, value));
    this.draw();
  }

  /**
   * Draw the gauge
   */
  draw() {
    if (!this.ctx) return;

    const { width, height } = this.canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    this.ctx.clearRect(0, 0, width, height);

    // Draw background circle
    this.ctx.fillStyle = '#2d3748';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw gauge arc
    const range = this.max - this.min;
    const normalizedValue = (this.value - this.min) / range;
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;
    const currentAngle = startAngle + (endAngle - startAngle) * normalizedValue;

    const color = this.getGaugeColor(normalizedValue);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 15;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius - 8, startAngle, currentAngle);
    this.ctx.stroke();

    // Draw center circle
    this.ctx.fillStyle = '#1a1f29';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius - 30, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw value text
    this.ctx.fillStyle = color;
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(
      this.value.toFixed(0) + this.unit,
      centerX,
      centerY - 15
    );

    // Draw label
    this.ctx.fillStyle = '#a0aec0';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(this.label, centerX, centerY + 15);
  }

  /**
   * Get color based on value
   */
  getGaugeColor(normalizedValue) {
    if (normalizedValue < 0.33) {
      return this.colors.low;
    } else if (normalizedValue < 0.66) {
      return this.colors.medium;
    } else {
      return this.colors.high;
    }
  }

  /**
   * Clear the gauge
   */
  clear() {
    this.value = this.min;
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

module.exports = GaugeChart;