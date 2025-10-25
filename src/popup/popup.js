// Lupus Addon Manager - Popup Controller
class PopupController {
  constructor() {
    this.tabLoader = new TabLoader();
    this.currentTab = null;
    this.tabs = [];
    this.manifest = chrome.runtime.getManifest();
  }

  async init() {
    console.log('🐺 Initializing Lupus Addon Manager...');
    console.log('📋 Manifest version:', this.manifest.version);
    
    // Set version in header
    this.setVersion();
    
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
        throw new Error('No tabs discovered - check that .json files exist in tabs/ folder');
      }
      
      console.log(`✅ Found ${this.tabs.length} tabs:`, this.tabs.map(t => t.name).join(', '));
      
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
      this.showError(`Failed to initialize: ${error.message}`);
    }
  }

  setVersion() {
    const versionElement = document.getElementById('headerVersion');
    if (versionElement) {
      versionElement.textContent = `v${this.manifest.version}`;
      console.log('📌 Version set to:', this.manifest.version);
    }
  }

  renderTabs() {
    const nav = document.getElementById('tabNavigation');
    if (!nav) {
      console.error('❌ Tab navigation element not found!');
      return;
    }
    
    nav.innerHTML = '';
    
    const sortedTabs = this.tabs.sort((a, b) => (a.order || 999) - (b.order || 999));
    console.log('📋 Rendering tabs in order:', sortedTabs.map(t => `${t.name} (${t.order || 999})`));
    
    sortedTabs.forEach(tab => {
      const button = document.createElement('button');
      button.className = 'tab-button';
      button.setAttribute('data-tab', tab.id);
      button.innerHTML = `
        <span class="tab-button-icon">${tab.icon || '📄'}</span>
        <span>${tab.name}</span>
      `;
      
      button.addEventListener('click', () => {
        console.log(`🖱️ Tab button clicked: ${tab.id}`);
        this.switchTab(tab.id);
      });
      
      nav.appendChild(button);
      console.log(`✅ Tab button created: ${tab.name}`);
    });
    
    console.log('✅ All tabs rendered');
  }

  async switchTab(tabId) {
    console.log(`🔄 Switching to tab: ${tabId}`);
  
    // Update tab button states
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
  
    const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
      console.log(`✅ Tab button activated: ${tabId}`);
    }
  
    // Unload previous tab
    if (this.currentTab) {
      console.log(`🧹 Unloading previous tab: ${this.currentTab}`);
      this.tabLoader.unloadTab(this.currentTab);
    }
  
    const contentContainer = document.getElementById('tabContent');
    if (!contentContainer) {
      console.error('❌ Content container not found!');
      return;
    }
  
    contentContainer.innerHTML = `
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading ${tabId}...</div>
      </div>
    `;
  
    try {
      console.log(`📂 Loading tab content for: ${tabId}`);
      const html = await this.tabLoader.loadTab(tabId);
    
      console.log(`📄 HTML loaded, length: ${html.length} characters`);
      contentContainer.innerHTML = html;
      this.currentTab = tabId;
    
      // Wait a bit for script to be parsed and executed
      await new Promise(resolve => setTimeout(resolve, 100));
    
      // Initialize tab if init function exists
      const initFn = window[`init_${tabId}`];
      if (initFn && typeof initFn === 'function') {
        console.log(`⚙️ Running init function: init_${tabId}`);
        await initFn(this);
        console.log(`✅ Init function completed: init_${tabId}`);
      } else {
        console.warn(`⚠️ No init function found: init_${tabId}`);
        console.log('Available window functions:', Object.keys(window).filter(k => k.startsWith('init_')));
      }
    
      console.log(`✅ Tab ${tabId} loaded successfully`);
    } catch (error) {
      console.error(`❌ Failed to load tab ${tabId}:`, error);
      contentContainer.innerHTML = `
        <div class="error-message">
          <h3>⚠️ Error Loading Tab</h3>
          <p><strong>Tab:</strong> ${tabId}</p>
          <p><strong>Error:</strong> ${error.message}</p>
          <details style="margin-top: 16px;">
            <summary style="cursor: pointer; color: var(--theme-accent-1);">Technical Details</summary>
            <pre style="font-size: 10px; margin-top: 8px; padding: 8px; background: var(--theme-panel-1); border-radius: 4px; overflow: auto; max-height: 200px;">${error.stack || 'No stack trace available'}</pre>
          </details>
          <button class="action-button" onclick="location.reload()" style="margin-top: 16px;">Reload Extension</button>
        </div>
      `;
    }
  }

  setupEventListeners() {
    console.log('🔗 Setting up event listeners...');
    
    const refreshButton = document.getElementById('refreshStatus');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        console.log('🔄 Refresh button clicked');
        this.checkExtensionStatus();
        this.showToast('Status refreshed', 'info');
      });
      console.log('✅ Refresh button listener attached');
    } else {
      console.warn('⚠️ Refresh button not found');
    }
    
    const helpButton = document.getElementById('openHelp');
    if (helpButton) {
      helpButton.addEventListener('click', () => {
        console.log('❓ Help button clicked');
        chrome.tabs.create({ url: 'https://github.com/LupusMagnusMalus/DemonGame---Addon-Manager' });
      });
      console.log('✅ Help button listener attached');
    } else {
      console.warn('⚠️ Help button not found');
    }
    
    console.log('✅ Event listeners setup complete');
  }

  async checkExtensionStatus() {
    console.log('🔍 Checking extension status...');
  
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.footer-status span:last-child');
  
    if (!statusIndicator || !statusText) {
      console.warn('⚠️ Status elements not found');
      console.log('Looking for:', {
        indicator: !!statusIndicator,
        text: !!statusText
      });
      return;
    }
  
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
      if (tab && tab.url) {
        console.log('📍 Current tab URL:', tab.url);
      
        if (tab.url.includes('demonicscans.org')) {
          statusIndicator.style.background = 'var(--theme-success)';
          statusText.textContent = 'Active on DemonicScans';
          console.log('✅ Extension active on DemonicScans site');
        } else {
          statusIndicator.style.background = 'var(--theme-warning)';
          statusText.textContent = 'Not on DemonicScans';
          console.log('⚠️ Not on DemonicScans site');
        }
      } else {
        statusIndicator.style.background = 'var(--theme-error)';
        statusText.textContent = 'No Active Tab';
        console.log('❌ No active tab found');
      }
    } catch (error) {
      statusIndicator.style.background = 'var(--theme-error)';
      statusText.textContent = 'Status Error';
      console.error('❌ Status check error:', error);
    }
  }

  // ========== UTILITY FUNCTIONS ==========

  showToast(message, type = 'info', duration = 3000) {
    console.log(`📢 Toast: [${type}] ${message}`);
    
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
    console.error('❌ Showing error:', message);
    
    const main = document.getElementById('tabContent');
    if (main) {
      main.innerHTML = `
        <div class="error-message">
          <h3>⚠️ Initialization Error</h3>
          <p>${message}</p>
          <div class="action-buttons" style="margin-top: 16px;">
            <button class="action-button" onclick="location.reload()">Reload Extension</button>
            <button class="action-button secondary" onclick="chrome.runtime.openOptionsPage()">Open Settings</button>
          </div>
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPopup);
} else {
  initPopup();
}

function initPopup() {
  console.log('📄 DOM Ready - Initializing popup controller...');
  window.popupController = new PopupController();
  window.popupController.init();
}