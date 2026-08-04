/**
 * ThemeManager
 * Manages application theme (dark/light mode) and persistence
 */

class ThemeManager {
  constructor(options = {}) {
    this.themes = {
      dark: {
        name: 'dark',
        background: '#0f1419',
        surface: '#1a1f29',
        border: '#2d3748',
        text: '#e2e8f0',
        textSecondary: '#a0aec0',
        accent: '#0ea5e9',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        chartBackground: '#1a1f29',
        gridColor: '#2d3748',
      },
      light: {
        name: 'light',
        background: '#f8fafc',
        surface: '#ffffff',
        border: '#e2e8f0',
        text: '#1e293b',
        textSecondary: '#64748b',
        accent: '#0284c7',
        success: '#16a34a',
        warning: '#d97706',
        danger: '#dc2626',
        chartBackground: '#ffffff',
        gridColor: '#e2e8f0',
      },
    };

    this.currentTheme = options.theme || this.detectSystemTheme();
    this.storageKey = 'deriv-analytics-theme';
    this.listeners = [];

    this.loadTheme();
  }

  /**
   * Detect system theme preference
   */
  detectSystemTheme() {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return 'dark';
  }

  /**
   * Load theme from storage
   */
  loadTheme() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(this.storageKey);
      if (stored && this.themes[stored]) {
        this.currentTheme = stored;
      }
    }
    this.applyTheme();
  }

  /**
   * Apply theme to document
   */
  applyTheme() {
    const theme = this.themes[this.currentTheme];
    if (!theme || typeof document === 'undefined') return;

    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
      if (key !== 'name') {
        root.style.setProperty(`--color-${key}`, value);
      }
    });

    // Add theme class to body
    document.body.className = `theme-${this.currentTheme}`;
  }

  /**
   * Set theme
   */
  setTheme(themeName) {
    if (!this.themes[themeName]) return false;

    this.currentTheme = themeName;
    this.applyTheme();

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, themeName);
    }

    this.notifyListeners();
    return true;
  }

  /**
   * Get current theme
   */
  getTheme() {
    return this.themes[this.currentTheme];
  }

  /**
   * Get current theme name
   */
  getThemeName() {
    return this.currentTheme;
  }

  /**
   * Get all available themes
   */
  getAvailableThemes() {
    return Object.keys(this.themes);
  }

  /**
   * Toggle between dark and light
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Subscribe to theme changes
   */
  onThemeChange(callback) {
    this.listeners.push(callback);
  }

  /**
   * Notify listeners of theme change
   */
  notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback(this.currentTheme, this.getTheme());
      } catch (error) {
        console.error('Theme listener error:', error);
      }
    });
  }
}

module.exports = ThemeManager;