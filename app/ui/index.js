/**
 * UI Module Index
 * Exports all UI components and managers
 */

const DashboardController = require('./DashboardController');
const ThemeManager = require('./ThemeManager');
const AlertManager = require('./AlertManager');
const StatusBar = require('./StatusBar');
const Sidebar = require('./Sidebar');
const ChartManager = require('./ChartManager');

const panels = require('./panels');
const charts = require('./charts');

module.exports = {
  // Main controller
  DashboardController,

  // Managers
  ThemeManager,
  AlertManager,
  StatusBar,
  Sidebar,
  ChartManager,

  // Panels
  ...panels,

  // Charts
  ...charts,

  /**
   * Create a new dashboard instance
   */
  createDashboard: (options) => new DashboardController(options),
};
