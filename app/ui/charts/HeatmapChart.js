/**
 * HeatmapChart
 * Displays digit frequency as a heatmap grid
 */

class HeatmapChart {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas?.getContext('2d');
    this.data = null;
    this.gridSize = 5; // 5x2 for digits 0-9
  }

  /**
   * Update heatmap data
   */
  updateData(data) {
    this.data = data;
    this.draw();
  }

  /**
   * Draw the heatmap
   */
  draw() {
    if (!this.ctx || !this.data) return;

    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    const padding = 30;
    const cellSize = (width - padding * 2) / this.gridSize;
    const cellHeight = (height - padding * 2) / 2;

    // Get digit frequency data
    const frequency = this.data.digitFrequency?.frequency || {};
    const maxFreq = Math.max(
      ...Object.values(frequency).map((f) => f.count)
    );

    // Draw grid
    for (let digit = 0; digit < 10; digit++) {
      const row = Math.floor(digit / this.gridSize);
      const col = digit % this.gridSize;

      const x = padding + col * cellSize;
      const y = padding + row * cellHeight;

      const freqData = frequency[digit];
      const intensity = freqData
        ? freqData.count / maxFreq
        : 0;

      // Color from cool (blue) to hot (red)
      const color = this.getHeatColor(intensity);
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, cellSize - 2, cellHeight - 2);

      // Draw digit label
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(
        digit,
        x + cellSize / 2,
        y + cellHeight / 2
      );

      // Draw count
      this.ctx.fillStyle = '#a0aec0';
      this.ctx.font = '10px Arial';
      this.ctx.fillText(
        freqData ? freqData.count : '0',
        x + cellSize / 2,
        y + cellHeight - 8
      );
    }
  }

  /**
   * Get color based on intensity (0-1)
   */
  getHeatColor(intensity) {
    // Blue -> Green -> Yellow -> Red
    if (intensity < 0.25) {
      // Blue
      return `rgb(14, 165, 233, ${0.3 + intensity})`;
    } else if (intensity < 0.5) {
      // Green
      return `rgb(16, 185, 129, ${0.3 + intensity})`;
    } else if (intensity < 0.75) {
      // Yellow
      return `rgb(245, 158, 11, ${0.3 + intensity})`;
    } else {
      // Red
      return `rgb(239, 68, 68, ${0.3 + intensity})`;
    }
  }

  /**
   * Clear the heatmap
   */
  clear() {
    this.data = null;
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

module.exports = HeatmapChart;