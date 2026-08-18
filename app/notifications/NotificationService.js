'use strict';

class NotificationService {
  constructor(options = {}) {
    this.Notification = options.Notification || null;
    this.title = options.title || 'Deriv Analytics Pro';
  }

  isAvailable() {
    return typeof this.Notification === 'function';
  }

  notify(input = {}) {
    const title = String(input.title || this.title);
    const body = String(input.body || input.message || 'Alert triggered');
    if (!this.isAvailable()) return { delivered: false, reason: 'unavailable' };

    const notification = new this.Notification({ title, body });
    if (typeof notification.show === 'function') notification.show();
    return { delivered: true, title, body };
  }
}

module.exports = NotificationService;
