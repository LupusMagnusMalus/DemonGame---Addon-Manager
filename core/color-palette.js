// Core Color Palette Management - Complete Version
class ColorPalette {
  constructor() {
    // 15 customizable colors
    this.essentialColors = [
      'background', 'sidebar', 'panel-1', 'border',
      'text', 'text-secondary',
      'accent-1', 'accent-2', 'accent-3',
      'success', 'warning', 'error', 'info',
      'button-confirm', 'button-cancel'
    ];
    
    // Colors that are auto-computed
    this.computedColors = ['panel-2', 'panel-3', 'hover'];
    
    this.themes = {
      'catppuccin-mocha': {
        name: 'Catppuccin Mocha',
        description: 'Warm dark theme with purple accents',
        colors: {
          background: '#1e1e2e',
          sidebar: '#181825',
          'panel-1': '#313244',
          border: '#45475a',
          text: '#cdd6f4',
          'text-secondary': '#a6adc8',
          'accent-1': '#cba6f7',
          'accent-2': '#89b4fa',
          'accent-3': '#74c0fc',
          success: '#a6e3a1',
          warning: '#f9e2af',
          error: '#f38ba8',
          info: '#89b4fa',
          'button-confirm': '#a6e3a1',
          'button-cancel': '#6c7086'
        }
      },
      'github-dark': {
        name: 'GitHub Dark',
        description: 'Professional dark theme',
        colors: {
          background: '#0d1117',
          sidebar: '#010409',
          'panel-1': '#161b22',
          border: '#30363d',
          text: '#e6edf3',
          'text-secondary': '#7d8590',
          'accent-1': '#a371f7',
          'accent-2': '#58a6ff',
          'accent-3': '#79c0ff',
          success: '#3fb950',
          warning: '#d29922',
          error: '#f85149',
          info: '#58a6ff',
          'button-confirm': '#3fb950',
          'button-cancel': '#484f58'
        }
      },
      'nord': {
        name: 'Nord',
        description: 'Arctic-inspired cool theme',
        colors: {
          background: '#2e3440',
          sidebar: '#242933',
          'panel-1': '#3b4252',
          border: '#4c566a',
          text: '#eceff4',
          'text-secondary': '#d8dee9',
          'accent-1': '#88c0d0',
          'accent-2': '#81a1c1',
          'accent-3': '#5e81ac',
          success: '#a3be8c',
          warning: '#ebcb8b',
          error: '#bf616a',
          info: '#81a1c1',
          'button-confirm': '#a3be8c',
          'button-cancel': '#4c566a'
        }
      },
      'dracula': {
        name: 'Dracula',
        description: 'Vibrant dark theme',
        colors: {
          background: '#282a36',
          sidebar: '#1e1f29',
          'panel-1': '#44475a',
          border: '#6272a4',
          text: '#f8f8f2',
          'text-secondary': '#9fa3b4',
          'accent-1': '#bd93f9',
          'accent-2': '#8be9fd',
          'accent-3': '#ff79c6',
          success: '#50fa7b',
          warning: '#f1fa8c',
          error: '#ff5555',
          info: '#8be9fd',
          'button-confirm': '#50fa7b',
          'button-cancel': '#6272a4'
        }
      },
      'catppuccin-latte': {
        name: 'Catppuccin Latte',
        description: 'Warm light theme',
        colors: {
          background: '#eff1f5',
          sidebar: '#e6e9ef',
          'panel-1': '#ccd0da',
          border: '#acb0be',
          text: '#4c4f69',
          'text-secondary': '#6c6f85',
          'accent-1': '#8839ef',
          'accent-2': '#1e66f5',
          'accent-3': '#04a5e5',
          success: '#40a02b',
          warning: '#df8e1d',
          error: '#d20f39',
          info: '#1e66f5',
          'button-confirm': '#40a02b',
          'button-cancel': '#9ca0b0'
        }
      }
    };
    
    this.currentTheme = 'catppuccin-mocha';
    this.customColors = null;
  }

  async init() {
    console.log('🎨 Initializing Color Palette System');
    await this.loadTheme();
    this.applyTheme();
    this.watchForThemeChanges();
  }

  async loadTheme() {
    try {
      const stored = await chrome.storage.local.get(['theme', 'customColors']);
      
      if (stored.theme) {
        this.currentTheme = stored.theme;
      }
      
      if (stored.customColors) {
        this.customColors = stored.customColors;
      }
      
      console.log('🎨 Theme loaded:', this.currentTheme);
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  }

  async saveTheme() {
    try {
      await chrome.storage.local.set({
        theme: this.currentTheme,
        customColors: this.customColors
      });
      console.log('🎨 Theme saved');
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }

  applyTheme() {
    const colors = this.customColors || this.themes[this.currentTheme]?.colors;
    
    if (!colors) {
      console.warn('No theme colors found, using defaults');
      return;
    }

    const root = document.documentElement;
    
    // Apply essential colors
    this.essentialColors.forEach(key => {
      if (colors[key]) {
        root.style.setProperty(`--theme-${key}`, colors[key]);
      }
    });
    
    // Compute and apply derived colors (fallback for older browsers)
    if (colors['panel-1']) {
      root.style.setProperty('--theme-panel-2', this.lightenColor(colors['panel-1'], 10));
      root.style.setProperty('--theme-panel-3', this.lightenColor(colors['panel-1'], 20));
    }
    
    if (colors['accent-1']) {
      root.style.setProperty('--theme-hover', this.lightenColor(colors['accent-1'], 10));
    }

    // Set theme attribute
    if (this.customColors) {
      document.body.classList.add('custom-theme');
      document.body.removeAttribute('data-theme');
    } else {
      document.body.classList.remove('custom-theme');
      document.body.setAttribute('data-theme', this.currentTheme);
    }

    this.notifyThemeChange(colors);
  }

  // Helper to lighten/darken colors
  lightenColor(hex, percent) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate new values
    const amt = Math.round(2.55 * percent);
    const newR = Math.min(255, Math.max(0, r + amt));
    const newG = Math.min(255, Math.max(0, g + amt));
    const newB = Math.min(255, Math.max(0, b + amt));
    
    // Convert back to hex
    const rHex = newR.toString(16).padStart(2, '0');
    const gHex = newG.toString(16).padStart(2, '0');
    const bHex = newB.toString(16).padStart(2, '0');
    
    return `#${rHex}${gHex}${bHex}`;
  }

  async setTheme(themeId) {
    if (!this.themes[themeId]) {
      console.error('Theme not found:', themeId);
      return false;
    }

    this.currentTheme = themeId;
    this.customColors = null;
    
    await this.saveTheme();
    this.applyTheme();
    
    return true;
  }

  setCustomColor(colorKey, colorValue) {
    if (!this.customColors) {
      this.customColors = { ...this.themes[this.currentTheme].colors };
    }
    
    this.customColors[colorKey] = colorValue;
    
    // Auto-update derived colors if panel-1 changed
    if (colorKey === 'panel-1') {
      // Don't store panel-2 and panel-3 as they are computed
      // They will be calculated in applyTheme()
    }
  }

  async applyCustomColors() {
    if (!this.customColors) return;
    
    this.currentTheme = 'custom';
    await this.saveTheme();
    this.applyTheme();
  }

  async resetToDefault() {
    this.customColors = null;
    this.currentTheme = 'catppuccin-mocha';
    await this.saveTheme();
    this.applyTheme();
  }

  getColorValue(colorKey) {
    // Handle computed colors
    if (this.computedColors.includes(colorKey)) {
      if (colorKey === 'panel-2' && this.getCurrentColors()['panel-1']) {
        return this.lightenColor(this.getCurrentColors()['panel-1'], 10);
      }
      if (colorKey === 'panel-3' && this.getCurrentColors()['panel-1']) {
        return this.lightenColor(this.getCurrentColors()['panel-1'], 20);
      }
      if (colorKey === 'hover' && this.getCurrentColors()['accent-1']) {
        return this.lightenColor(this.getCurrentColors()['accent-1'], 10);
      }
    }
    
    if (this.customColors && this.customColors[colorKey]) {
      return this.customColors[colorKey];
    }
    
    return this.themes[this.currentTheme]?.colors[colorKey] || '#000000';
  }

  getCurrentColors() {
    return this.customColors || this.themes[this.currentTheme]?.colors || {};
  }

  getThemeList() {
    return Object.keys(this.themes).map(key => ({
      id: key,
      name: this.themes[key].name,
      description: this.themes[key].description
    }));
  }

  notifyThemeChange(colors) {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            type: 'THEME_CHANGED',
            colors: colors
          }).catch(() => {});
        });
      });
    }
  }

  watchForThemeChanges() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && (changes.theme || changes.customColors)) {
          this.loadTheme().then(() => this.applyTheme());
        }
      });
    }
  }

  exportTheme() {
    return {
      name: this.customColors ? 'Custom Theme' : this.themes[this.currentTheme].name,
      version: '1.0',
      base: this.currentTheme,
      colors: this.getCurrentColors(),
      exported: new Date().toISOString()
    };
  }

  async importTheme(themeData) {
    if (!themeData.colors) {
      throw new Error('Invalid theme data - missing colors');
    }

    const required = ['background', 'sidebar', 'panel-1', 'text', 'accent-1'];
    const hasRequired = required.every(key => themeData.colors[key]);
    
    if (!hasRequired) {
      throw new Error('Theme missing required colors: ' + required.join(', '));
    }

    // Merge with current theme to fill missing colors
    const baseColors = this.themes[this.currentTheme]?.colors || this.themes['catppuccin-mocha'].colors;
    this.customColors = { ...baseColors, ...themeData.colors };
    
    this.currentTheme = 'custom';
    
    await this.saveTheme();
    this.applyTheme();
  }
}

window.ColorPalette = ColorPalette;

// Auto-initialize if in appropriate context
if (typeof chrome !== 'undefined' && chrome.runtime) {
  const palette = new ColorPalette();
  palette.init();
  window.colorPalette = palette;
}