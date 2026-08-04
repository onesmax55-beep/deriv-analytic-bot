/**
 * AlertManager
 * Manages in-app and desktop notifications
 */

const EventEmitter = require('events');

class AlertManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.alerts = [];
    this.maxAlerts = options.maxAlerts || 50;
    this.alertDuration = options.alertDuration || 8000; // ms
    this.enableDesktopNotifications = options.enableDesktopNotifications !== false;
    this.alertId = 0;
  }

  /**
   * Alert severity levels
   */
  static SEVERITY = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical',
  };

  /**
   * Create an alert
   */
  addAlert(message, options = {}) {
    const alert = {
      id: ++this.alertId,
      message,
      severity: options.severity || AlertManager.SEVERITY.INFO,
      timestamp: new Date(),
      duration: options.duration !== false ? this.alertDuration : null,
      closable: options.closable !== false,
      data: options.data,
    };

    // Add to alerts array
    this.alerts.unshift(alert);

    // Maintain max size
    if (this.alerts.length > this.maxAlerts) {
      this.alerts.pop();
    }

    // Emit event
    this.emit('alert-added', alert);

    // Auto-remove if duration is set
    if (alert.duration) {
      setTimeout(() => {
        this.removeAlert(alert.id);
      }, alert.duration);
    }

    // Desktop notification
    if (this.enableDesktopNotifications) {
      this.sendDesktopNotification(message, options);
    }

    return alert;
  }

  /**
   * Add info alert
   */
  info(message, options = {}) {
    return this.addAlert(message, {
      ...options,
      severity: AlertManager.SEVERITY.INFO,
    });
  }

  /**
   * Add success alert
   */
  success(message, options = {}) {
    return this.addAlert(message, {
      ...options,
      severity: AlertManager.SEVERITY.SUCCESS,
    });
  }

  /**
   * Add warning alert
   */
  warning(message, options = {}) {
    return this.addAlert(message, {
      ...options,
      severity: AlertManager.SEVERITY.WARNING,
      duration: options.duration !== false ? this.alertDuration * 1.5 : null,
    });
  }

  /**
   * Add error alert
   */
  error(message, options = {}) {
    return this.addAlert(message, {
      ...options,
      severity: AlertManager.SEVERITY.ERROR,
      closable: true,
      duration: false, // Don't auto-close errors
    });
  }

  /**
   * Add critical alert
   */
  critical(message, options = {}) {
    return this.addAlert(message, {
      ...options,
      severity: AlertManager.SEVERITY.CRITICAL,
      closable: false,
      duration: false,
    });
  }

  /**
   * Remove an alert
   */
  removeAlert(alertId) {
    const index = this.alerts.findIndex((a) => a.id === alertId);
    if (index !== -1) {
      const alert = this.alerts.splice(index, 1)[0];
      this.emit('alert-removed', alert);
    }
  }

  /**
   * Get all alerts
   */
  getAlerts() {
    return [...this.alerts];
  }

  /**
   * Clear all alerts
   */
  clearAlerts() {
    this.alerts = [];
    this.emit('alerts-cleared');
  }

  /**
   * Send desktop notification
   */
  sendDesktopNotification(message, options = {}) {
    if (typeof Notification === 'undefined') return;

    try {
      if (Notification.permission === 'granted') {
        new Notification('Deriv Analytics Pro', {
          body: message,
          tag: options.tag || 'deriv-analytics',
          icon: options.icon,
        });
      }
    } catch (error) {
      console.error('Failed to send desktop notification:', error);
    }
  }

  /**
   * Request notification permission
   */
  static async requestPermission() {
    if (typeof Notification === 'undefined') return false;

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }
}

module.exports = AlertManager;