/**
 * TickChart
 * Real-time scrolling tick price chart
 */

class TickChart {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas?.getContext('2d');
    this.ticks = [];
    this.maxTicks = options.maxTicks || 500;
    this.padding = 40;
    this.lineWidth = 2;
    this.pointRadius = 3;
    this.colors = {
      line: '#0ea5e9',
      up: '#10b981',
      down: '#ef4444',
      grid: '#2d3748',
      text: '#a0aec0',
    };
  }

  /**
   * Add a tick
   */
  addTick(value) {
    this.ticks.push(value);
    if (this.ticks.length > this.maxTicks) {
      this.ticks.shift();
    }
    this.draw();
  }

  /**
   * Draw the chart
   */
  draw() {
    if (!this.ctx || this.ticks.length === 0) return;

    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    // Draw grid
    this.drawGrid(width, height);

    // Draw axes
    this.drawAxes(width, height);

    // Draw price line
    this.drawPriceLine(width, height);

    // Draw labels
    this.drawLabels(width, height);
  }

  /**
   * Draw grid lines
   */
  drawGrid(width, height) {
    const gridSpacing = 50;
    this.ctx.strokeStyle = this.colors.grid;
    this.ctx.lineWidth = 1;

    // Vertical lines
    for (let x = this.padding; x < width; x += gridSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.padding);
      this.ctx.lineTo(x, height - this.padding);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = this.padding; y < height; y += gridSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.padding, y);
      this.ctx.lineTo(width - this.padding, y);
      this.ctx.stroke();
    }
  }

  /**
   * Draw axes
   */
  drawAxes(width, height) {
    this.ctx.strokeStyle = this.colors.text;
    this.ctx.lineWidth = 2;

    // Y axis
    this.ctx.beginPath();
    this.ctx.moveTo(this.padding, this.padding);
    this.ctx.lineTo(this.padding, height - this.padding);
    this.ctx.stroke();

    // X axis
    this.ctx.beginPath();
    this.ctx.moveTo(this.padding, height - this.padding);
    this.ctx.lineTo(width - this.padding, height - this.padding);
    this.ctx.stroke();
  }

  /**
   * Draw price line
   */
  drawPriceLine(width, height) {
    if (this.ticks.length < 2) return;

    const min = Math.min(...this.ticks);
    const max = Math.max(...this.ticks);
    const range = max - min || 1;

    const chartWidth = width - this.padding * 2;
    const chartHeight = height - this.padding * 2;

    this.ctx.strokeStyle = this.colors.line;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.beginPath();

    this.ticks.forEach((tick, i) => {
      const x = this.padding + (i / this.ticks.length) * chartWidth;
      const y =
        height -
        this.padding -
        ((tick - min) / range) * chartHeight;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });

    this.ctx.stroke();
  }

  /**
   * Draw labels
   */
  drawLabels(width, height) {
    if (this.ticks.length === 0) return;

    const min = Math.min(...this.ticks);
    const max = Math.max(...this.ticks);

    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';

    // Min/Max labels
    this.ctx.fillText(max.toFixed(2), this.padding - 20, this.padding + 10);
    this.ctx.fillText(
      min.toFixed(2),
      this.padding - 20,
      height - this.padding + 10
    );

    // Current price
    const current = this.ticks[this.ticks.length - 1];
    this.ctx.fillStyle = '#0ea5e9';
    this.ctx.fillText(
      current.toFixed(2),
      width - this.padding - 20,
      this.padding
    );
  }

  /**
   * Clear the chart
   */
  clear() {
    this.ticks = [];
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

module.exports = TickChart;