'use strict';

class AlertCenter {
  constructor(root, api) {
    this.root = root;
    this.api = api;
    this.rules = [];
    this.history = [];
    this.unsubTriggered = null;
  }

  async initialize() {
    if (!this.root || !this.api) return;
    this.bindStaticEvents();
    await this.refresh();
    this.unsubTriggered = this.api.on('triggered', (alert) => {
      this.prependHistory(alert);
      this.renderHistory();
      this.renderStatus(alert);
    });
  }

  bindStaticEvents() {
    this.root.querySelector('[data-action="refresh-alerts"]')?.addEventListener('click', () => this.refresh());
    this.root.querySelector('[data-action="create-alert"]')?.addEventListener('click', () => this.createRule());
    this.root.querySelector('[data-action="clear-form"]')?.addEventListener('click', () => this.clearForm());
    this.root.querySelector('[data-action="refresh-history"]')?.addEventListener('click', () => this.refreshHistory());
    this.root.querySelector('[data-action="ack-all"]')?.addEventListener('click', () => this.acknowledgeAll());
  }

  async refresh() {
    try {
      this.rules = await this.api.rules.list();
      await this.refreshHistory();
      this.renderRules();
      this.renderStatus();
    } catch (error) {
      this.showError(error);
    }
  }

  async refreshHistory() {
    try {
      this.history = await this.api.history.list({ limit: 50 });
      this.renderHistory();
      const count = await this.api.history.count({ acknowledged: false });
      const badge = this.root.querySelector('[data-alert-count]');
      if (badge) badge.textContent = String(count || 0);
    } catch (error) {
      this.showError(error);
    }
  }

  async createRule() {
    const form = this.root.querySelector('form[data-alert-form]');
    if (!form) return;
    const data = Object.fromEntries(new FormData(form).entries());
    const rule = {
      name: data.name?.trim(),
      type: data.type,
      symbol: data.symbol,
      threshold: Number(data.threshold),
      cooldownMs: Math.max(0, Number(data.cooldownMs || 0)),
      enabled: form.querySelector('[name="enabled"]')?.checked !== false,
    };
    if (!rule.name || !Number.isFinite(rule.threshold)) {
      this.showError(new Error('Enter a rule name and numeric threshold.'));
      return;
    }
    try {
      await this.api.rules.create(rule);
      this.clearForm();
      await this.refresh();
    } catch (error) {
      this.showError(error);
    }
  }

  async removeRule(id) {
    if (!id) return;
    try {
      await this.api.rules.remove(id);
      await this.refresh();
    } catch (error) {
      this.showError(error);
    }
  }

  async toggleRule(rule) {
    try {
      await this.api.rules.update(rule.id, { enabled: !rule.enabled });
      await this.refresh();
    } catch (error) {
      this.showError(error);
    }
  }

  async acknowledge(id) {
    try {
      await this.api.history.acknowledge(id);
      await this.refreshHistory();
    } catch (error) {
      this.showError(error);
    }
  }

  async acknowledgeAll() {
    const pending = this.history.filter((item) => !item.acknowledged && item.id != null);
    for (const item of pending) await this.acknowledge(item.id);
  }

  prependHistory(alert) {
    this.history = [alert, ...this.history.filter((item) => item.id !== alert.id)].slice(0, 50);
  }

  clearForm() {
    const form = this.root.querySelector('form[data-alert-form]');
    form?.reset();
    const enabled = form?.querySelector('[name="enabled"]');
    if (enabled) enabled.checked = true;
  }

  renderRules() {
    const target = this.root.querySelector('[data-alert-rules]');
    if (!target) return;
    target.innerHTML = this.rules.length ? this.rules.map((rule) => `
      <div class="alert-row">
        <div><strong>${this.escape(rule.name)}</strong><small>${this.escape(rule.type)} · ${this.escape(rule.symbol || 'all markets')} · threshold ${Number(rule.threshold)}</small></div>
        <div class="alert-actions"><button data-toggle="${this.escape(rule.id)}">${rule.enabled ? 'Disable' : 'Enable'}</button><button class="secondary" data-remove="${this.escape(rule.id)}">Delete</button></div>
      </div>`).join('') : '<p class="muted">No alert rules configured.</p>';
    target.querySelectorAll('[data-toggle]').forEach((button) => button.addEventListener('click', () => this.toggleRule(this.rules.find((rule) => String(rule.id) === button.dataset.toggle))));
    target.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => this.removeRule(button.dataset.remove)));
  }

  renderHistory() {
    const target = this.root.querySelector('[data-alert-history]');
    if (!target) return;
    target.innerHTML = this.history.length ? this.history.map((item) => `
      <div class="alert-row ${item.acknowledged ? 'acknowledged' : ''}">
        <div><strong>${this.escape(item.message || item.ruleName || 'Alert')}</strong><small>${this.escape(item.symbol || '')} · ${this.formatTime(item.timestamp)}</small></div>
        ${item.acknowledged ? '<span class="muted">Acknowledged</span>' : `<button data-ack="${this.escape(item.id)}">Acknowledge</button>`}
      </div>`).join('') : '<p class="muted">No alert history.</p>';
    target.querySelectorAll('[data-ack]').forEach((button) => button.addEventListener('click', () => this.acknowledge(button.dataset.ack)));
  }

  renderStatus(alert) {
    const status = this.root.querySelector('[data-alert-status]');
    if (status && alert) status.textContent = `Triggered: ${alert.message || alert.ruleName || 'Alert'}`;
  }

  showError(error) {
    const target = this.root.querySelector('[data-alert-error]');
    if (target) target.textContent = error?.message || String(error);
  }

  formatTime(value) {
    if (!value) return 'unknown time';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }

  escape(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  destroy() {
    this.unsubTriggered?.();
    this.unsubTriggered = null;
  }
}

window.AlertCenter = AlertCenter;
