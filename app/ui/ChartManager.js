/**
 * ChartManager
 * Manages chart instances and updates
 */

const ChartJS = require('chart.js');

class ChartManager {
  constructor(options = {}) {
    this.charts = new Map();
    this.defaultOptions = {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 0 }, // Disable animations for performance
      plugins: {
        legend: { display: true, position: 'top' },
      },
    };
  }

  /**
   * Create a line chart
   */
  createLineChart(canvasId, label, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const chartOptions = {
      ...this.defaultOptions,
      ...options,
      type: 'line',
    };

    const chartData = {
      labels: data.labels || [],
      datasets: [
        {
          label,
          data: data.values || [],
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    };

    const chart = new ChartJS.Chart(canvas, {
      type: 'line',
      data: chartData,
      options: chartOptions,
    });

    this.charts.set(canvasId, chart);
    return chart;
  }

  /**
   * Create a bar chart
   */
  createBarChart(canvasId, label, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const chartOptions = {
      ...this.defaultOptions,
      ...options,
      type: 'bar',
    };

    const chartData = {
      labels: data.labels || [],
      datasets: [
        {
          label,
          data: data.values || [],
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 1,
        },
      ],
    };

    const chart = new ChartJS.Chart(canvas, {
      type: 'bar',
      data: chartData,
      options: chartOptions,
    });

    this.charts.set(canvasId, chart);
    return chart;
  }

  /**
   * Create a doughnut chart
   */
  createDoughnutChart(canvasId, label, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const chartOptions = {
      ...this.defaultOptions,
      ...options,
      type: 'doughnut',
    };

    const chartData = {
      labels: data.labels || [],
      datasets: [
        {
          label,
          data: data.values || [],
          backgroundColor: ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444'],
          borderColor: '#1a1f29',
          borderWidth: 2,
        },
      ],
    };

    const chart = new ChartJS.Chart(canvas, {
      type: 'doughnut',
      data: chartData,
      options: chartOptions,
    });

    this.charts.set(canvasId, chart);
    return chart;
  }

  /**
   * Update chart data
   */
  updateChart(canvasId, data) {
    const chart = this.charts.get(canvasId);
    if (!chart) return false;

    if (data.labels) {
      chart.data.labels = data.labels;
    }

    if (data.values) {
      chart.data.datasets[0].data = data.values;
    }

    chart.update('none'); // No animation for performance
    return true;
  }

  /**
   * Destroy a chart
   */
  destroyChart(canvasId) {
    const chart = this.charts.get(canvasId);
    if (chart) {
      chart.destroy();
      this.charts.delete(canvasId);
      return true;
    }
    return false;
  }

  /**
   * Get chart instance
   */
  getChart(canvasId) {
    return this.charts.get(canvasId);
  }

  /**
   * Destroy all charts
   */
  destroyAll() {
    this.charts.forEach((chart) => chart.destroy());
    this.charts.clear();
  }
}

module.exports = ChartManager;