// Lupus Addon Manager - Popup Controller
// Provides core functionality and utilities for all tabs

class PopupController {
  constructor() {
    this.tabLoader = new TabLoader();
    this.currentTab = null;
    this.tabs = [];
  }

  async init() {
    console.log('🐺 Initializing Lupus Addon Manager...');
    
    try {
      this.tabs = await this.tabLoader.discoverTabs();
      this.renderTabs();
      
      if (this.tabs.length > 0) {
        await this.switchTab(this.tabs[0].id);
      }
      
      this.setupEventListeners();
      this.checkExtensionStatus();
      
      console.log('✅ Addon Manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize:', error);
      this.showError('Failed to initialize. Please reload.');
    }
  }

  renderTabs() {
    const nav = document.getElementById('tabNavigation');
    nav.innerHTML = '';
    
    this.tabs
      .sort((a, b) => (a.order || 999) - (b.order || 999))
      .forEach(tab => {
        const button = document.createElement('button');
        button.className = 'tab-button';
        button.setAttribute('data-tab', tab.id);
        button.innerHTML = `
          <span class="tab-button-icon">${tab.icon || '📄'}</span>
          <span>${tab.name}</span>
        `;
        
        button.addEventListener('click', () => this.switchTab(tab.id));
        nav.appendChild(button);
      });
  }

  async switchTab(tabId) {
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
    
    if (this.currentTab) {
      this.tabLoader.unloadTab(this.currentTab);
    }
    
    const contentContainer = document.getElementById('tabContent');
    contentContainer.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div><div class="loading-text">Loading...</div></div>';
    
    try {
      const html = await this.tabLoader.loadTab(tabId);
      contentContainer.innerHTML = html;
      this.currentTab = tabId;
      
      if (window[`init_${tabId}`]) {
        await window[`init_${tabId}`](this);
      }
    } catch (error) {
      console.error(`Failed to load tab ${tabId}:`, error);
      contentContainer.innerHTML = `
        <div class="error-message">
          <h3>⚠️ Error</h3>
          <p>Failed to load content. Please try again.</p>
          <button class="action-button" onclick="location.reload()">Reload</button>
        </div>
      `;
    }
  }

  setupEventListeners() {
    const refreshButton = document.getElementById('refreshStatus');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        this.checkExtensionStatus();
        this.showToast('Status refreshed', 'info');
      });
    }
    
    const helpButton = document.getElementById('openHelp');
    if (helpButton) {
      helpButton.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://github.com/yourusername/lupus-addon-manager' });
      });
    }
  }

  async checkExtensionStatus() {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.footer-status span:last-child');
    
    if (statusIndicator && statusText) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab) {
          statusIndicator.style.background = 'var(--ctp-green)';
          statusText.textContent = 'Manager Active';
        } else {
          statusIndicator.style.background = 'var(--ctp-yellow)';
          statusText.textContent = 'No Active Tab';
        }
      } catch (error) {
        statusIndicator.style.background = 'var(--ctp-red)';
        statusText.textContent = 'Manager Error';
      }
    }
  }

  // ========== UTILITY FUNCTIONS (Reusable by all tabs) ==========

  /**
   * Show toast notification
   * @param {string} message - Message to display
   * @param {string} type - Type: success, error, info, warning
   * @param {number} duration - Duration in ms (default: 3000)
   */
  showToast(message, type = 'info', duration = 3000) {
    let container = document.querySelector('.toast-container');
    
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOutDown 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Show error message in content area
   * @param {string} message - Error message to display
   */
  showError(message) {
    const main = document.getElementById('tabContent');
    if (main) {
      main.innerHTML = `
        <div class="error-message">
          <h3>⚠️ Error</h3>
          <p>${message}</p>
          <button class="action-button" onclick="location.reload()">Reload Extension</button>
        </div>
      `;
    }
  }

  /**
   * Load configuration from storage
   * @param {string} key - Config key to load
   * @returns {Promise<any>} Configuration data
   */
  async loadConfig(key = 'config') {
    try {
      const result = await chrome.storage.local.get([key]);
      return result[key] || {};
    } catch (error) {
      console.error('Failed to load config:', error);
      return {};
    }
  }

  /**
   * Save configuration to storage
   * @param {string} key - Config key to save
   * @param {any} data - Data to save
   * @returns {Promise<boolean>} Success status
   */
  async saveConfig(key = 'config', data) {
    try {
      await chrome.storage.local.set({ [key]: data });
      return true;
    } catch (error) {
      console.error('Failed to save config:', error);
      return false;
    }
  }

  /**
   * Setup feature toggles with auto-save
   * @param {Object} features - Feature configuration object
   * @param {string} namespace - Config namespace (base, lupus, asura, etc.)
   * @param {Function} callback - Optional callback after toggle
   */
  setupFeatureToggles(features, namespace, callback = null) {
    Object.keys(features).forEach(featureId => {
      const toggle = document.getElementById(featureId);
      if (toggle) {
        toggle.checked = features[featureId];
        
        toggle.addEventListener('change', async () => {
          features[featureId] = toggle.checked;
          
          // Save to storage
          const config = await this.loadConfig();
          if (!config[namespace]) config[namespace] = {};
          config[namespace][featureId] = toggle.checked;
          await this.saveConfig('config', config);
          
          // Show feedback
          this.showToast(
            `${this.formatFeatureName(featureId)} ${toggle.checked ? 'enabled' : 'disabled'}`,
            'success'
          );
          
          // Call callback if provided
          if (callback) callback(featureId, toggle.checked);
        });
      }
    });
  }

  /**
   * Setup category collapse functionality
   */
  setupCategoryCollapse() {
    document.querySelectorAll('.category-header').forEach(header => {
      header.addEventListener('click', () => {
        const category = header.parentElement;
        category.classList.toggle('collapsed');
        
        const toggle = header.querySelector('.category-toggle');
        if (toggle) {
          toggle.textContent = category.classList.contains('collapsed') ? '▶' : '▼';
        }
      });
    });
  }

  /**
   * Format feature ID to readable name
   * @param {string} featureId - camelCase feature ID
   * @returns {string} Formatted name
   */
  formatFeatureName(featureId) {
    return featureId
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Export configuration to JSON file
   * @param {Object} data - Data to export
   * @param {string} filename - Filename (default: lupus-config-{timestamp}.json)
   */
  async exportConfig(data, filename = null) {
    try {
      const name = filename || `lupus-config-${Date.now()}.json`;
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
      
      URL.revokeObjectURL(url);
      this.showToast('Configuration exported', 'success');
      return true;
    } catch (error) {
      console.error('Export failed:', error);
      this.showToast('Export failed', 'error');
      return false;
    }
  }

  /**
   * Import configuration from JSON file
   * @param {File} file - File to import
   * @returns {Promise<Object|null>} Imported data or null if failed
   */
  async importConfig(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      this.showToast('Configuration imported', 'success');
      return data;
    } catch (error) {
      console.error('Import failed:', error);
      this.showToast('Import failed - invalid file', 'error');
      return null;
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.popupController = new PopupController();
  window.popupController.init();
});