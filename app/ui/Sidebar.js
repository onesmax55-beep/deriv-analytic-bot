/**
 * Sidebar
 * Navigation and market selector component
 */

class Sidebar {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.activePanel = 'dashboard';
    this.selectedSymbol = 'R_100';
    this.symbols = [
      { id: 'R_50', name: 'Volatility 50' },
      { id: 'R_75', name: 'Volatility 75' },
      { id: 'R_100', name: 'Volatility 100' },
      { id: 'R_200', name: 'Volatility 200' },
    ];
    this.panels = [
      { id: 'dashboard', name: 'Dashboard', icon: '⊞' },
      { id: 'live-ticks', name: 'Live Ticks', icon: '📊' },
      { id: 'even-odd', name: 'Even/Odd', icon: '◯' },
      { id: 'rise-fall', name: 'Rise/Fall', icon: '⬆⬇' },
      { id: 'matches-differs', name: 'Matches/Differs', icon: '◎' },
      { id: 'over-under', name: 'Over/Under', icon: '≷' },
      { id: 'patterns', name: 'Patterns', icon: '≈' },
      { id: 'insights', name: 'Insights', icon: '✦' },
    ];
    this.listeners = new Map();
    this.render();
  }

  /**
   * Render sidebar
   */
  render() {
    if (!this.container) return;

    const symbolOptions = this.symbols
      .map(
        (s) => `
      <option value="${s.id}" ${s.id === this.selectedSymbol ? 'selected' : ''}>
        ${s.name}
      </option>
    `
      )
      .join('');

    const panelItems = this.panels
      .map(
        (p) => `
      <button class="sidebar-item ${p.id === this.activePanel ? 'active' : ''}" 
              data-panel="${p.id}">
        <span class="icon">${p.icon}</span>
        <span class="label">${p.name}</span>
      </button>
    `
      )
      .join('');

    this.container.innerHTML = `
      <div class="sidebar">
        <div class="sidebar-header">
          <h2>Deriv Analytics</h2>
        </div>
        
        <div class="sidebar-section">
          <label>Market</label>
          <select class="symbol-selector" id="symbol-selector">
            ${symbolOptions}
          </select>
        </div>
        
        <div class="sidebar-section">
          <label>View</label>
          <div class="panel-list">
            ${panelItems}
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const symbolSelector = this.container.querySelector('#symbol-selector');
    if (symbolSelector) {
      symbolSelector.addEventListener('change', (e) => {
        this.setSelectedSymbol(e.target.value);
        this.emit('symbol-changed', e.target.value);
      });
    }

    const panelButtons = this.container.querySelectorAll('.sidebar-item');
    panelButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const panelId = btn.dataset.panel;
        this.setActivePanel(panelId);
        this.emit('panel-changed', panelId);
      });
    });
  }

  /**
   * Set active panel
   */
  setActivePanel(panelId) {
    this.activePanel = panelId;
    this.render();
  }

  /**
   * Set selected symbol
   */
  setSelectedSymbol(symbol) {
    this.selectedSymbol = symbol;
  }

  /**
   * Get active panel
   */
  getActivePanel() {
    return this.activePanel;
  }

  /**
   * Get selected symbol
   */
  getSelectedSymbol() {
    return this.selectedSymbol;
  }

  /**
   * Subscribe to events
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => cb(data));
    }
  }
}

module.exports = Sidebar;