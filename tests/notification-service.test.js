'use strict';

const NotificationService = require('../app/notifications/NotificationService');

describe('NotificationService', () => {
  test('reports unavailable when Electron Notification is absent', () => {
    const service = new NotificationService();
    expect(service.isAvailable()).toBe(false);
    expect(service.notify({ message: 'hello' })).toEqual({ delivered: false, reason: 'unavailable' });
  });

  test('creates and shows an Electron notification', () => {
    const show = jest.fn();
    const Notification = jest.fn(() => ({ show }));
    const service = new NotificationService({ Notification, title: 'Test App' });

    expect(service.notify({ title: 'Alert', body: 'R_100 triggered' })).toEqual({
      delivered: true,
      title: 'Alert',
      body: 'R_100 triggered',
    });
    expect(Notification).toHaveBeenCalledWith({ title: 'Alert', body: 'R_100 triggered' });
    expect(show).toHaveBeenCalledTimes(1);
  });
});
