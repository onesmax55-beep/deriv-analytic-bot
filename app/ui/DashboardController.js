/**
 * DashboardController
 * Orchestrates the entire dashboard UI and connects it to the analytics engine
 */

const EventEmitter = require('events');
const ThemeManager = require('./ThemeManager');
const AlertManager = require('./AlertManager');
const StatusBar = require('./StatusBar');
const Sidebar = require('./Sidebar');
const ChartManager = require('./ChartManager');
const {
  LiveTickPanel,
  EvenOddPanel,
  RiseFallPanel,
  OverUnderPanel,
  SignalPanel,
  InsightPanel,
  StatisticsPanel,
} = require('./panels');
const {
  TickChart,
  ProbabilityChart,
  HeatmapChart,
  GaugeChart,
} = require('./charts');

class DashboardController extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = options;
    this.analyticsEngine = null;
    this.connectionManager = null;

    // UI Managers
    this.themeManager = new ThemeManager({
      theme: options.theme || 'dark',
    });
    this.alertManager = new AlertManager({
      enableDesktopNotifications: options.enableNotifications !== false,
    });
    this.chartManager = new ChartManager();

    // UI Components
    this.statusBar = null;
    this.sidebar = null;

    // Panel instances
    this.panels = {};

    // Chart instances
    this.charts = {};

    // State
    this.currentSymbol = options.symbol || 'R_100';
    this.updateInterval = options.updateInterval || 500;
    this.lastUpdateTime = 0;
  }

  /**
   * Initialize the dashboard
   */
  async initialize() {
    try {
      this.initializeStatusBar();
      this.initializeSidebar();
      this.initializePanels();
      this.initializeCharts();
      this.setupEventListeners();

      this.alertManager.info('Dashboard initialized');
      this.emit('initialized');
    } catch (error) {
      this.alertManager.error(`Initialization failed: ${error.message}`);
      this.emit('initialization-error', error);
    }
  }

  /**
   * Initialize status bar
   */
  initializeStatusBar() {
    this.statusBar = new StatusBar('status-bar-container');
    this.statusBar.render();
  }

  /**
   * Initialize sidebar
   */
  initializeSidebar() {
    this.sidebar = new Sidebar('sidebar-container');

    this.sidebar.on('symbol-changed', (symbol) => {
      this.currentSymbol = symbol;
      this.emit('symbol-changed', symbol);
    });

    this.sidebar.on('panel-changed', (panelId) => {
      this.showPanel(panelId);
    });
  }

  /**
   * Initialize analysis panels
   */
  initializePanels() {
    this.panels.liveTick = new LiveTickPanel('live-tick-panel');
    this.panels.evenOdd = new EvenOddPanel('even-odd-panel');
    this.panels.riseFall = new RiseFallPanel('rise-fall-panel');
    this.panels.overUnder = new OverUnderPanel('over-under-panel');
    this.panels.signal = new SignalPanel('signal-panel');
    this.panels.insight = new InsightPanel('insight-panel');
    this.panels.statistics = new StatisticsPanel('statistics-panel');
  }

  /**
   * Initialize charts
   */
  initializeCharts() {
    this.charts.tick = new TickChart('tick-chart', { maxTicks: 500 });
    this.charts.probability = new ProbabilityChart('probability-chart');
    this.charts.heatmap = new HeatmapChart('heatmap-chart');
    this.charts.gauge = new GaugeChart('gauge-chart', {
      label: 'Confidence',
      value: 0,
      max: 100,
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Alert manager events
    this.alertManager.on('alert-added', (alert) => {
      this.onAlertAdded(alert);
    });

    // Theme manager events
    this.themeManager.onThemeChange((theme) => {
      this.emit('theme-changed', theme);
    });
  }

  /**
   * Connect to analytics engine
   */
  connectAnalyticsEngine(analyticsEngine) {
    this.analyticsEngine = analyticsEngine;

    // Subscribe to analytics updates
    analyticsEngine.onAnalyticsUpdate((snapshot) => {
      this.onAnalyticsSnapshot(snapshot);
    });

    // Subscribe to high-confidence signals
    analyticsEngine.onHighConfidenceSignal((signal) => {
      this.onHighConfidenceSignal(signal);
    });

    // Subscribe to pattern detection
    analyticsEngine.onPatternDetected((pattern) => {
      this.onPatternDetected(pattern);
    });

    // Subscribe to streak events
    analyticsEngine.onStreakEvent((streak) => {
      this.onStreakEvent(streak);
    });

    // Subscribe to insights
    analyticsEngine.onInsight?.((insight) => {
      this.onInsight(insight);
    });
  }

  /**
   * Connect to connection manager
   */
  connectConnectionManager(connectionManager) {
    this.connectionManager = connectionManager;

    connectionManager.on('connected', () => {
      this.statusBar.setConnected(true, 0);
      this.alertManager.success('Connected to Deriv');
    });

    connectionManager.on('disconnected', () => {
      this.statusBar.setConnected(false);
      this.alertManager.warning('Disconnected from Deriv');
    });

    connectionManager.on('tick', (data) => {
      this.onTick(data);
    });
  }

  /**
   * Handle incoming tick
   */
  onTick(data) {
    this.statusBar.recordTick();
    this.panels.liveTick?.addTick(data.quote, data.time);
    this.charts.tick?.addTick(data.quote);
  }

  /**
   * Handle analytics snapshot
   */
  onAnalyticsSnapshot(snapshot) {
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval) return;

    this.lastUpdateTime = now;

    // Update panels
    this.panels.evenOdd?.updateAnalysis(snapshot.evenOdd);
    this.panels.riseFall?.updateAnalysis(snapshot.riseFall);
    this.panels.overUnder?.updateAnalysis(snapshot.overUnder);
    this.panels.signal?.updateSignals(Object.values(snapshot.signals || {}));
    this.panels.insight?.updateInsights(snapshot.insights);
    this.panels.statistics?.updateData(snapshot);

    // Update charts
    if (snapshot.evenOdd?.probabilities?.[100]) {
      const prob = snapshot.evenOdd.probabilities[100];
      this.charts.probability?.updateData({
        labels: ['Even', 'Odd'],
        values: [prob.evenPercentage, prob.oddPercentage],
      });
    }

    if (snapshot.matchesDiffers?.digitFrequency?.sorted) {
      this.charts.heatmap?.updateData(snapshot.matchesDiffers);
    }

    // Update gauge
    this.charts.gauge?.setValue(snapshot.confidence);
    this.statusBar.setConfidence(snapshot.confidence);
  }

  /**
   * Handle high-confidence signal
   */
  onHighConfidenceSignal(signal) {
    const message = `High confidence ${signal.type}: ${signal.direction} (${signal.confidence}%)`;
    this.alertManager.warning(message, {
      duration: 10000,
      tag: 'high-confidence-signal',
    });
  }

  /**
   * Handle pattern detection
   */
  onPatternDetected(pattern) {
    this.alertManager.info(`Pattern detected in ${pattern.type}`, {
      tag: 'pattern-detected',
    });
  }

  /**
   * Handle streak event
   */
  onStreakEvent(streak) {
    if (streak.streak > 5) {
      this.alertManager.warning(
        `Long ${streak.type} streak: ${streak.streak} consecutive (${streak.value})`,
        {
          duration: 8000,
          tag: 'streak-event',
        }
      );
    }
  }

  /**
   * Handle insight
   */
  onInsight(insight) {
    // Insights are already handled by the analytics engine
    this.emit('insight', insight);
  }

  /**
   * Handle alert added
   */
  onAlertAdded(alert) {
    // Update UI with alert
    this.emit('alert', alert);
  }

  /**
   * Show specific panel
   */
  showPanel(panelId) {
    // Hide all panels
    Object.values(this.panels).forEach((panel) => {
      if (panel?.container) {
        panel.container.style.display = 'none';
      }
    });

    // Show selected panel
    const panel = this.panels[panelId.replace(/-/g, '')];
    if (panel?.container) {
      panel.container.style.display = 'block';
    }

    this.emit('panel-shown', panelId);
  }

  /**
   * Update symbol
   */
  setSymbol(symbol) {
    this.currentSymbol = symbol;
    this.statusBar.setSymbol(symbol);
  }

  /**
   * Toggle theme
   */
  toggleTheme() {
    this.themeManager.toggleTheme();
  }

  /**
   * Get current theme
   */
  getTheme() {
    return this.themeManager.getThemeName();
  }

  /**
   * Destroy dashboard
   */
  destroy() {
    this.chartManager.destroyAll();
    Object.values(this.charts).forEach((chart) => {
      chart?.clear();
    });
    this.removeAllListeners();
    this.emit('destroyed');
  }
}

module.exports = DashboardController;