/**
 * DemonGame Addon Manager - Popup Interface
 * Main popup functionality for module management and settings
 */

class PopupManager {
  constructor() {
    this.currentTab = 'modules';
    this.currentCategory = 'all';
    this.modules = new Map();
    this.isScanning = false;
    
    this.init();
  }

  /**
   * Initialize popup
   */
  async init() {
    try {
      console.log('🚀 Initializing popup...');
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Load initial data
      await this.loadData();
      
      // Update UI
      this.updateUI();
      
      console.log('✅ Popup initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize popup:', error);
      this.showError('Failed to initialize popup', error.message);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    // Category filters
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', () => this.filterByCategory(btn.dataset.category));
    });

    // Scan modules button
    document.getElementById('scanModulesBtn').addEventListener('click', () => this.scanModules());

    // Quick actions
    document.getElementById('safeMode').addEventListener('click', () => this.enterSafeMode());
    document.getElementById('reloadAll').addEventListener('click', () => this.reloadAllModules());
    document.getElementById('settingsBtn').addEventListener('click', () => this.openGlobalSettings());

    // Module list click delegation
    document.getElementById('moduleList').addEventListener('click', (e) => this.handleModuleAction(e));
    document.getElementById('moduleList').addEventListener('change', (e) => this.handleModuleToggle(e));
  }

  /**
   * Load initial data
   */
  async loadData() {
    try {
      const data = await this.sendMessage({ type: 'GET_SETTINGS' });
      
      if (data.modules) {
        this.modules.clear();
        for (const [id, module] of Object.entries(data.modules)) {
          this.modules.set(id, module);
        }
      }
      
      this.globalSettings = data.globalSettings || {};
      this.lastScan = data.lastModuleScan;
      
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  /**
   * Update UI elements
   */
  updateUI() {
    this.updateStatusBar();
    this.renderModuleList();
  }

  /**
   * Update status bar
   */
  updateStatusBar() {
    const totalModules = this.modules.size;
    const activeModules = Array.from(this.modules.values()).filter(m => m.enabled).length;
    
    document.getElementById('moduleCount').textContent = totalModules;
    document.getElementById('activeCount').textContent = activeModules;
    
    if (this.lastScan) {
      const scanDate = new Date(this.lastScan);
      document.getElementById('lastScan').textContent = this.formatRelativeTime(scanDate);
    } else {
      document.getElementById('lastScan').textContent = 'Never';
    }
  }

  /**
   * Switch tabs
   */
  async switchTab(tabName) {
    if (this.currentTab === tabName) return;
    
    this.currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `${tabName}Tab`);
    });
    
    // Load tab content if needed
    await this.loadTabContent(tabName);
  }

  /**
   * Load tab content dynamically
   */
  async loadTabContent(tabName) {
    if (tabName === 'theme') {
      await this.loadThemeTab();
    } else if (tabName === 'about') {
      await this.loadAboutTab();
    }
  }

  /**
   * Load theme tab content
   */
  async loadThemeTab() {
    const tabPane = document.getElementById('themeTab');
    if (tabPane.dataset.loaded) return;
    
    try {
      const response = await fetch(chrome.runtime.getURL('core/popup/tabs/theme.html'));
      const html = await response.text();
      tabPane.innerHTML = html;
      
      // Initialize theme functionality
      await this.initializeThemeTab();
      
      tabPane.dataset.loaded = 'true';
    } catch (error) {
      console.error('Failed to load theme tab:', error);
      tabPane.innerHTML = '<div class="error">Failed to load theme settings</div>';
    }
  }

  /**
   * Load about tab content
   */
  async loadAboutTab() {
    const tabPane = document.getElementById('aboutTab');
    if (tabPane.dataset.loaded) return;
    
    try {
      const response = await fetch(chrome.runtime.getURL('core/popup/tabs/about.html'));
      const html = await response.text();
      tabPane.innerHTML = html;
      
      tabPane.dataset.loaded = 'true';
    } catch (error) {
      console.error('Failed to load about tab:', error);
      tabPane.innerHTML = '<div class="error">Failed to load about information</div>';
    }
  }

  /**
   * Initialize theme tab functionality
   */
  async initializeThemeTab() {
    // Theme functionality will be implemented separately
    console.log('Theme tab initialized');
  }

  /**
   * Filter modules by category
   */
  filterByCategory(category) {
    if (this.currentCategory === category) return;
    
    this.currentCategory = category;
    
    // Update category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    // Re-render module list
    this.renderModuleList();
  }

  /**
   * Render module list
   */
  renderModuleList() {
    const moduleList = document.getElementById('moduleList');
    const emptyState = document.getElementById('emptyState');
    
    // Filter modules by category
    const filteredModules = this.getFilteredModules();
    
    if (filteredModules.length === 0) {
      emptyState.style.display = 'flex';
      moduleList.innerHTML = '';
      moduleList.appendChild(emptyState);
      return;
    }
    
    emptyState.style.display = 'none';
    
    // Sort modules by priority, then name
    filteredModules.sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return a.name.localeCompare(b.name);
    });
    
    // Clear and rebuild list
    moduleList.innerHTML = '';
    
    filteredModules.forEach(module => {
      const moduleElement = this.createModuleElement(module);
      moduleList.appendChild(moduleElement);
    });
  }

  /**
   * Get filtered modules based on current category
   */
  getFilteredModules() {
    const modules = Array.from(this.modules.values());
    
    if (this.currentCategory === 'all') {
      return modules;
    }
    
    return modules.filter(module => module.category === this.currentCategory);
  }

  /**
   * Create module element
   */
  createModuleElement(module) {
    const template = document.getElementById('moduleItemTemplate');
    const element = template.content.cloneNode(true);
    
    // Set data attribute
    const moduleItem = element.querySelector('.module-item');
    moduleItem.dataset.moduleId = module.id;
    
    // Fill in module info
    element.querySelector('.module-icon').textContent = module.icon || '📦';
    element.querySelector('.module-name').textContent = module.name;
    element.querySelector('.module-description').textContent = module.description || 'No description';
    
    // Meta information
    const metaContainer = element.querySelector('.module-meta');
    metaContainer.innerHTML = `
      <span class="module-version">v${module.version}</span>
      <span class="module-category">${module.category}</span>
      <span class="module-author">${module.author || 'Unknown'}</span>
    `;
    
    // Status
    const statusIndicator = element.querySelector('.status-indicator');
    const statusText = element.querySelector('.status-text');
    
    this.updateModuleStatus(statusIndicator, statusText, module);
    
    // Toggle switch
    const toggle = element.querySelector('.module-toggle');
    toggle.checked = module.enabled;
    toggle.disabled = module.status === 'error';
    
    // Tags
    if (module.tags && module.tags.length > 0) {
      const tagsContainer = element.querySelector('.module-tags');
      tagsContainer.innerHTML = module.tags.map(tag => 
        `<span class="module-tag">${tag}</span>`
      ).join('');
    }
    
    return element;
  }

  /**
   * Update module status indicator
   */
  updateModuleStatus(indicator, textElement, module) {
    indicator.className = 'status-indicator';
    
    switch (module.status) {
      case 'active':
        indicator.classList.add('active');
        textElement.textContent = 'Active';
        break;
      case 'disabled':
        textElement.textContent = 'Disabled';
        break;
      case 'error':
        indicator.classList.add('error');
        textElement.textContent = 'Error';
        break;
      case 'loading':
        indicator.classList.add('loading');
        textElement.textContent = 'Loading';
        break;
      default:
        textElement.textContent = 'Ready';
    }
  }

  /**
   * Handle module actions (clicks on module items)
   */
  async handleModuleAction(event) {
    const target = event.target;
    const moduleItem = target.closest('.module-item');
    
    if (!moduleItem) return;
    
    const moduleId = moduleItem.dataset.moduleId;
    const module = this.modules.get(moduleId);
    
    if (!module) return;
    
    // Handle different action buttons
    if (target.classList.contains('module-settings-btn')) {
      this.openModuleSettings(moduleId);
    } else if (target.classList.contains('module-reload-btn')) {
      await this.reloadModule(moduleId);
    } else if (target.classList.contains('module-unload-btn')) {
      await this.unloadModule(moduleId);
    } else if (target.classList.contains('module-header') || target.closest('.module-header')) {
      this.toggleModuleExpansion(moduleItem);
    }
  }

  /**
   * Handle module toggle switch
   */
  async handleModuleToggle(event) {
    if (!event.target.classList.contains('module-toggle')) return;
    
    const moduleItem = event.target.closest('.module-item');
    const moduleId = moduleItem.dataset.moduleId;
    const enabled = event.target.checked;
    
    try {
      // Show loading state
      this.setModuleLoading(moduleId, true);
      
      // Toggle module
      const result = await this.sendMessage({
        type: 'TOGGLE_MODULE',
        moduleId,
        enabled
      });
      
      if (result.success) {
        // Update local state
        const module = this.modules.get(moduleId);
        module.enabled = enabled;
        module.status = enabled ? 'active' : 'disabled';
        
        // Update UI
        this.updateModuleInList(moduleId, module);
        this.updateStatusBar();
        
        this.showNotification(`Module ${module.name} ${enabled ? 'enabled' : 'disabled'}`, 'success');
      } else {
        // Revert toggle on error
        event.target.checked = !enabled;
        this.showNotification('Failed to toggle module', 'error');
      }
    } catch (error) {
      // Revert toggle on error
      event.target.checked = !enabled;
      console.error('Toggle error:', error);
      this.showNotification('Failed to toggle module', 'error');
    } finally {
      this.setModuleLoading(moduleId, false);
    }
  }

  /**
   * Toggle module expansion (show/hide details)
   */
  toggleModuleExpansion(moduleItem) {
    const moduleBody = moduleItem.querySelector('.module-body');
    const isExpanded = moduleBody.style.display !== 'none';
    
    moduleBody.style.display = isExpanded ? 'none' : 'block';
    moduleItem.classList.toggle('expanded', !isExpanded);
  }

  /**
   * Scan for modules
   */
  async scanModules() {
    if (this.isScanning) return;
    
    try {
      this.isScanning = true;
      this.showLoading('Scanning modules...');
      
      const result = await this.sendMessage({ type: 'SCAN_MODULES' });
      
      if (result.success) {
        // Reload data
        await this.loadData();
        this.updateUI();
        
        this.showNotification(`Found ${result.count} modules`, 'success');
      } else {
        this.showNotification('Module scan failed', 'error');
      }
    } catch (error) {
      console.error('Scan error:', error);
      this.showNotification('Module scan failed', 'error');
    } finally {
      this.isScanning = false;
      this.hideLoading();
    }
  }

  /**
   * Enter safe mode
   */
  async enterSafeMode() {
    if (!confirm('This will disable all non-critical modules. Continue?')) return;
    
    try {
      const result = await this.sendMessage({ type: 'ENTER_SAFE_MODE' });
      
      if (result.success) {
        await this.loadData();
        this.updateUI();
        this.showNotification('Safe mode enabled', 'warning');
      } else {
        this.showNotification('Failed to enter safe mode', 'error');
      }
    } catch (error) {
      console.error('Safe mode error:', error);
      this.showNotification('Failed to enter safe mode', 'error');
    }
  }

  /**
   * Reload all active modules
   */
  async reloadAllModules() {
    try {
      const activeModules = Array.from(this.modules.values()).filter(m => m.enabled);
      
      if (activeModules.length === 0) {
        this.showNotification('No active modules to reload', 'info');
        return;
      }
      
      let successCount = 0;
      
      for (const module of activeModules) {
        try {
          await this.sendMessage({ type: 'RELOAD_MODULE', moduleId: module.id });
          successCount++;
        } catch (error) {
          console.error(`Failed to reload ${module.id}:`, error);
        }
      }
      
      this.showNotification(`Reloaded ${successCount}/${activeModules.length} modules`, 'success');
    } catch (error) {
      console.error('Reload all error:', error);
      this.showNotification('Failed to reload modules', 'error');
    }
  }

  /**
   * Set module loading state
   */
  setModuleLoading(moduleId, loading) {
    const moduleItem = document.querySelector(`[data-module-id="${moduleId}"]`);
    if (!moduleItem) return;
    
    const toggle = moduleItem.querySelector('.toggle-switch');
    const statusIndicator = moduleItem.querySelector('.status-indicator');
    
    if (loading) {
      toggle.classList.add('loading');
      statusIndicator.classList.add('loading');
    } else {
      toggle.classList.remove('loading');
      statusIndicator.classList.remove('loading');
    }
  }

  /**
   * Update module in list
   */
  updateModuleInList(moduleId, moduleData) {
    const moduleItem = document.querySelector(`[data-module-id="${moduleId}"]`);
    if (!moduleItem) return;
    
    const statusIndicator = moduleItem.querySelector('.status-indicator');
    const statusText = moduleItem.querySelector('.status-text');
    
    this.updateModuleStatus(statusIndicator, statusText, moduleData);
  }

  /**
   * Show loading indicator
   */
  showLoading(text = 'Loading...') {
    const indicator = document.getElementById('loadingIndicator');
    const textElement = indicator.querySelector('.loading-text');
    
    textElement.textContent = text;
    indicator.style.display = 'flex';
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info', duration = 3000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
      </div>
      <button class="notification-close">×</button>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Setup close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.removeNotification(notification);
    });
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification);
      }, duration);
    }
  }

  /**
   * Remove notification
   */
  removeNotification(notification) {
    if (notification.parentNode) {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }

  /**
   * Show error
   */
  showError(title, message) {
    this.showNotification(`${title}: ${message}`, 'error', 0);
  }

  /**
   * Send message to background script
   */
  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response && response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Format relative time
   */
  formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  }

  /**
   * Placeholder methods for future implementation
   */
  async openModuleSettings(moduleId) {
    console.log('Opening settings for module:', moduleId);
    // TODO: Implement module-specific settings
  }

  async reloadModule(moduleId) {
    console.log('Reloading module:', moduleId);
    // TODO: Implement individual module reload
  }

  async unloadModule(moduleId) {
    console.log('Unloading module:', moduleId);
    // TODO: Implement module unloading
  }

  async openGlobalSettings() {
    console.log('Opening global settings');
    // TODO: Implement global settings modal
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.popupManager = new PopupManager();
});

console.log('🎯 Popup script loaded');
