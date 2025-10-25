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
      // Initialize color palette first
      if (window.ColorPalette && !window.colorPalette) {
        console.log('🎨 Initializing ColorPalette...');
        window.colorPalette = new ColorPalette();
        await window.colorPalette.init();
      }
      
      console.log('🔍 Discovering tabs...');
      this.tabs = await this.tabLoader.discoverTabs();
      
      if (this.tabs.length === 0) {
        throw new Error('No tabs discovered');
      }
      
      console.log('🎨 Rendering tabs...');
      this.renderTabs();
      
      console.log('📂 Loading first tab...');
      await this.switchTab(this.tabs[0].id);
      
      console.log('⚙️ Setting up event listeners...');
      this.setupEventListeners();
      this.checkExtensionStatus();
      
      console.log('✅ Lupus Manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize:', error);
      this.showError('Failed to initialize. Please check console for details.');
    }
  }

  renderTabs() {
    const nav = document.getElementById('tabNavigation');
    if (!nav) {
      console.error('❌ Tab navigation element not found!');
      return;
    }
    
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
    
    console.log('✅ Tabs rendered:', this.tabs.length);
  }

  async switchTab(tabId) {
    console.log(`🔄 Switching to tab: ${tabId}`);
    
    // Update tab button states
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
    
    // Unload previous tab
    if (this.currentTab) {
      this.tabLoader.unloadTab(this.currentTab);
    }
    
    const contentContainer = document.getElementById('tabContent');
    if (!contentContainer) {
      console.error('❌ Content container not found!');
      return;
    }
    
    contentContainer.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div><div class="loading-text">Loading...</div></div>';
    
    try {
      console.log(`📂 Loading tab content for: ${tabId}`);
      const html = await this.tabLoader.loadTab(tabId);
      contentContainer.innerHTML = html;
      this.currentTab = tabId;
      
      // Initialize tab if init function exists
      const initFn = window[`init_${tabId}`];
      if (initFn && typeof initFn === 'function') {
        console.log(`⚙️ Initializing tab: ${tabId}`);
        await initFn(this);
      } else {
        console.warn(`⚠️ No init function found for ${tabId}`);
      }
      
      console.log(`✅ Tab ${tabId} loaded successfully`);
    } catch (error) {
      console.error(`❌ Failed to load tab ${tabId}:`, error);
      contentContainer.innerHTML = `
        <div class="error-message">
          <h3>⚠️ Error</h3>
          <p>Failed to load tab: ${tabId}</p>
          <p style="font-size: 11px; color: var(--theme-text-secondary); margin-top: 8px;">
            ${error.message}
          </p>
          <button class="action-button" onclick="location.reload()">Reload Extension</button>
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
        chrome.tabs.create({ url: 'https://github.com/LupusMagnusMalus/DemonGame---Addon-Manager' });
      });
    }
  }

  async checkExtensionStatus() {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.footer-status span:last-child');
    
    if (statusIndicator && statusText) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab && tab.url && tab.url.includes('demonichunter.com')) {
          statusIndicator.style.background = 'var(--theme-success)';
          statusText.textContent = 'Active on DemonicHunter';
        } else if (tab) {
          statusIndicator.style.background = 'var(--theme-warning)';
          statusText.textContent = 'Not on DemonicHunter';
        } else {
          statusIndicator.style.background = 'var(--theme-error)';
          statusText.textContent = 'No Active Tab';
        }
      } catch (error) {
        statusIndicator.style.background = 'var(--theme-error)';
        statusText.textContent = 'Status Error';
        console.error('Status check error:', error);
      }
    }
  }

  // ========== UTILITY FUNCTIONS ==========

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

  async loadConfig(key = 'config') {
    try {
      const result = await chrome.storage.local.get([key]);
      return result[key] || {};
    } catch (error) {
      console.error('Failed to load config:', error);
      return {};
    }
  }

  async saveConfig(key = 'config', data) {
    try {
      await chrome.storage.local.set({ [key]: data });
      return true;
    } catch (error) {
      console.error('Failed to save config:', error);
      return false;
    }
  }

  setupFeatureToggles(features, namespace, callback = null) {
    Object.keys(features).forEach(featureId => {
      const toggle = document.getElementById(featureId);
      if (toggle) {
        toggle.checked = features[featureId];
        
        toggle.addEventListener('change', async () => {
          features[featureId] = toggle.checked;
          
          const config = await this.loadConfig();
          if (!config[namespace]) config[namespace] = {};
          config[namespace][featureId] = toggle.checked;
          await this.saveConfig('config', config);
          
          this.showToast(
            `${this.formatFeatureName(featureId)} ${toggle.checked ? 'enabled' : 'disabled'}`,
            'success'
          );
          
          if (callback) callback(featureId, toggle.checked);
        });
      }
    });
  }

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

  formatFeatureName(featureId) {
    return featureId
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

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
  console.log('📄 DOM Content Loaded, initializing popup...');
  window.popupController = new PopupController();
  window.popupController.init();
});