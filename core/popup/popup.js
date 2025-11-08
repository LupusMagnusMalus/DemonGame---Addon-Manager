/**
 * DemonGame Addon Manager - Dynamic Popup Interface
 * Fully dynamic tab and module management system
 */

class PopupManager {
  constructor() {
    this.currentTab = 'modules'; // Always start with modules tab
    this.currentCategory = 'all';
    this.modules = new Map();
    this.isScanning = false;
    this.tabLoader = null;
    this.loadedTabControllers = new Map();
    this.discoveredTabs = [];
    
    this.init();
  }

  /**
   * Initialize popup
   */
  async init() {
    try {
      console.log('🚀 Initializing dynamic popup...');
      
      // Show loading overlay
      this.showLoadingOverlay('Initializing...');
      
      // Initialize TabLoader
      this.tabLoader = new TabLoader();
      
      // Discover available tabs
      await this.discoverAndBuildTabs();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Load initial data
      await this.loadData();
      
      // Update UI
      this.updateUI();
      
      // Hide loading overlay
      this.hideLoadingOverlay();
      
      console.log('✅ Dynamic popup initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize popup:', error);
      this.hideLoadingOverlay();
      this.showError('Failed to initialize popup', error.message);
    }
  }

  /**
   * Discover tabs and build dynamic navigation
   */
  async discoverAndBuildTabs() {
    try {
      // Discover available tabs using TabLoader
      this.discoveredTabs = await this.tabLoader.discoverTabs();
      
      // Always ensure modules tab exists first
      const modulesTab = this.discoveredTabs.find(tab => tab.id === 'modules');
      if (!modulesTab) {
        this.discoveredTabs.unshift({
          id: 'modules',
          name: 'Modules',
          icon: '📦',
          order: 1
        });
      }

      // Build tab navigation
      this.buildTabNavigation();
      
      // Build tab content containers
      this.buildTabContent();
      
    } catch (error) {
      console.error('Failed to discover tabs:', error);
      // Fallback to modules only
      this.discoveredTabs = [{
        id: 'modules',
        name: 'Modules', 
        icon: '📦',
        order: 1
      }];
      this.buildTabNavigation();
      this.buildTabContent();
    }
  }

  /**
   * Build tab navigation buttons dynamically
   */
  buildTabNavigation() {
    const tabNavigation = document.getElementById('tabNavigation');
    const template = document.getElementById('tabButtonTemplate');
    
    if (!tabNavigation || !template) {
      console.error('Missing tab navigation elements');
      return;
    }

    // Clear loading state
    tabNavigation.innerHTML = '';

    // Sort tabs by order
    const sortedTabs = [...this.discoveredTabs].sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 999;
      const orderB = b.order !== undefined ? b.order : 999;
      return orderA - orderB;
    });

    // Create tab buttons
    sortedTabs.forEach(tab => {
      const tabButton = template.content.cloneNode(true);
      const btn = tabButton.querySelector('.tab-btn');
      const icon = tabButton.querySelector('.icon');
      const name = tabButton.querySelector('.tab-name');

      btn.dataset.tab = tab.id;
      btn.className = `tab-btn ${tab.id === this.currentTab ? 'active' : ''}`;
      
      if (icon) icon.textContent = tab.icon || '📄';
      if (name) name.textContent = tab.name || tab.id;

      tabNavigation.appendChild(tabButton);
    });

    console.log(`✅ Built navigation for ${sortedTabs.length} tabs`);
  }

  /**
   * Build tab content containers dynamically
   */
  buildTabContent() {
    const tabContent = document.getElementById('tabContent');
    const template = document.getElementById('tabPaneTemplate');
    
    if (!tabContent || !template) {
      console.error('Missing tab content elements');
      return;
    }

    // Keep existing modules tab, create others
    this.discoveredTabs.forEach(tab => {
      if (tab.id === 'modules') {
        // Modules tab already exists in HTML, just ensure it's active
        const modulesTab = document.getElementById('modulesTab');
        if (modulesTab) {
          modulesTab.style.display = tab.id === this.currentTab ? 'block' : 'none';
          modulesTab.classList.toggle('active', tab.id === this.currentTab);
        }
        return;
      }

      // Check if tab pane already exists
      let existingPane = document.getElementById(`${tab.id}Tab`);
      if (existingPane) {
        existingPane.style.display = tab.id === this.currentTab ? 'block' : 'none';
        existingPane.classList.toggle('active', tab.id === this.currentTab);
        return;
      }

      // Create new tab pane
      const tabPane = template.content.cloneNode(true);
      const pane = tabPane.querySelector('.tab-pane');
      
      pane.id = `${tab.id}Tab`;
      pane.style.display = tab.id === this.currentTab ? 'block' : 'none';
      pane.classList.toggle('active', tab.id === this.currentTab);
      
      tabContent.appendChild(tabPane);
    });

    console.log(`✅ Built content panes for ${this.discoveredTabs.length} tabs`);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Dynamic tab navigation (event delegation)
    const tabNavigation = document.getElementById('tabNavigation');
    if (tabNavigation) {
      tabNavigation.addEventListener('click', (e) => {
        const tabBtn = e.target.closest('.tab-btn');
        if (tabBtn) {
          const tabName = tabBtn.dataset.tab;
          if (tabName) {
            this.switchTab(tabName);
          }
        }
      });
    }

    // Category filters (modules tab)
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', () => this.filterByCategory(btn.dataset.category));
    });

    // Scan modules button
    document.getElementById('scanModulesBtn')?.addEventListener('click', () => this.scanModules());

    // Quick actions
    document.getElementById('safeMode')?.addEventListener('click', () => this.enterSafeMode());
    document.getElementById('reloadAll')?.addEventListener('click', () => this.reloadAllModules());
    document.getElementById('settingsBtn')?.addEventListener('click', () => this.openGlobalSettings());

    // Module list click delegation
    const moduleList = document.getElementById('moduleList');
    if (moduleList) {
      moduleList.addEventListener('click', (e) => this.handleModuleAction(e));
      moduleList.addEventListener('change', (e) => this.handleModuleToggle(e));
    }
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
    
    const moduleCountEl = document.getElementById('moduleCount');
    const activeCountEl = document.getElementById('activeCount');
    const lastScanEl = document.getElementById('lastScan');
    
    if (moduleCountEl) moduleCountEl.textContent = totalModules;
    if (activeCountEl) activeCountEl.textContent = activeModules;
    
    if (lastScanEl) {
      if (this.lastScan) {
        const scanDate = new Date(this.lastScan);
        lastScanEl.textContent = this.formatRelativeTime(scanDate);
      } else {
        lastScanEl.textContent = 'Never';
      }
    }
  }

  /**
   * Switch tabs dynamically
   */
  async switchTab(tabName) {
    if (this.currentTab === tabName) return;
    
    try {
      // Cleanup previous tab
      if (this.currentTab && this.loadedTabControllers.has(this.currentTab)) {
        this.cleanupTab(this.currentTab);
      }
      
      this.currentTab = tabName;
      
      // Update tab buttons
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
      });
      
      // Update tab content visibility
      document.querySelectorAll('.tab-pane').forEach(pane => {
        const isActive = pane.id === `${tabName}Tab`;
        pane.style.display = isActive ? 'block' : 'none';
        pane.classList.toggle('active', isActive);
      });
      
      // Load tab content if needed (skip modules tab as it's static)
      if (tabName !== 'modules') {
        await this.loadTabWithLoader(tabName);
      }
      
    } catch (error) {
      console.error(`Failed to switch to tab ${tabName}:`, error);
      this.showError('Tab Loading Error', `Failed to load ${tabName} tab`);
    }
  }

  /**
   * Load tab content using improved TabLoader with fallbacks
   */
  async loadTabWithLoader(tabName) {
    try {
      const tabPane = document.getElementById(`${tabName}Tab`);
      if (!tabPane) {
        console.warn(`Tab pane not found: ${tabName}Tab`);
        return;
      }
      
      // Skip if already loaded and contains content
      if (tabPane.dataset.loaded === 'true' && tabPane.innerHTML.trim() && 
          !tabPane.innerHTML.includes('loading-placeholder')) {
        console.log(`♻️ Tab ${tabName} already loaded`);
        return;
      }
      
      // Show loading state
      tabPane.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div><div class="loading-text">Loading...</div></div>';
      
      let html;
      
      try {
        // Try to load tab using TabLoader
        html = await this.tabLoader.loadTab(tabName);
      } catch (metadataError) {
        console.log(`📄 Metadata loading failed, trying direct method for ${tabName}`);
        
        try {
          // Fallback to direct loading
          html = await this.tabLoader.loadTabDirect(tabName);
        } catch (directError) {
          console.log(`📄 Direct loading failed, trying chrome.runtime.getURL for ${tabName}`);
          
          // Final fallback: direct fetch
          const response = await fetch(chrome.runtime.getURL(`core/popup/tabs/${tabName}.html`));
          if (response.ok) {
            html = await response.text();
            
            // Load CSS if available
            try {
              const cssResponse = await fetch(chrome.runtime.getURL(`core/popup/tabs/${tabName}.css`));
              if (cssResponse.ok) {
                const css = await cssResponse.text();
                let styleSheet = document.getElementById(`tab-style-${tabName}`);
                if (!styleSheet) {
                  styleSheet = document.createElement('style');
                  styleSheet.id = `tab-style-${tabName}`;
                  styleSheet.textContent = css;
                  document.head.appendChild(styleSheet);
                }
              }
            } catch (cssError) {
              console.log(`ℹ️ No CSS for ${tabName}`);
            }
            
            // Load JS if available
            try {
              const jsResponse = await fetch(chrome.runtime.getURL(`core/popup/tabs/${tabName}.js`));
              if (jsResponse.ok) {
                const script = document.createElement('script');
                script.src = chrome.runtime.getURL(`core/popup/tabs/${tabName}.js`);
                script.type = 'text/javascript';
                script.id = `tab-script-${tabName}`;
                document.body.appendChild(script);
              }
            } catch (jsError) {
              console.log(`ℹ️ No JS for ${tabName}`);
            }
          } else {
            throw new Error(`Failed to load ${tabName}.html: ${response.status}`);
          }
        }
      }
      
      // Update tab content
      tabPane.innerHTML = html;
      tabPane.dataset.loaded = 'true';
      
      // Initialize tab controller if available
      await this.initializeTabController(tabName);
      
      console.log(`✅ Tab ${tabName} loaded successfully`);
      
    } catch (error) {
      console.error(`Failed to load tab ${tabName}:`, error);
      
      const tabPane = document.getElementById(`${tabName}Tab`);
      if (tabPane) {
        tabPane.innerHTML = `
          <div class="error-placeholder">
            <div class="error-icon">❌</div>
            <div class="error-title">Failed to load ${tabName}</div>
            <div class="error-message">${error.message}</div>
            <button onclick="window.popupManager.loadTabWithLoader('${tabName}')" 
                    style="margin-top: 12px; padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Retry
            </button>
          </div>
        `;
      }
    }
  }

  /**
   * Initialize tab controller
   */
  async initializeTabController(tabName) {
    try {
      const initFunction = window[`init_${tabName}`];
      
      if (typeof initFunction === 'function') {
        console.log(`🎬 Initializing ${tabName} controller`);
        await initFunction(this);
        this.loadedTabControllers.set(tabName, true);
      } else {
        console.log(`ℹ️ No controller found for ${tabName} tab`);
      }
    } catch (error) {
      console.error(`Failed to initialize ${tabName} controller:`, error);
    }
  }

  /**
   * Cleanup tab controller
   */
  cleanupTab(tabName) {
    try {
      if (this.loadedTabControllers.has(tabName)) {
        this.tabLoader.unloadTab(tabName);
        this.loadedTabControllers.delete(tabName);
      }
    } catch (error) {
      console.error(`Failed to cleanup ${tabName} tab:`, error);
    }
  }

  /**
   * Show loading overlay
   */
  showLoadingOverlay(text = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.querySelector('.loading-text');
    
    if (overlay) {
      if (loadingText) loadingText.textContent = text;
      overlay.style.display = 'flex';
    }
  }

  /**
   * Hide loading overlay
   */
  hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  /**
   * Scan for available modules
   */
  async scanModules() {
    if (this.isScanning) return;
    
    this.isScanning = true;
    const scanBtn = document.getElementById('scanModulesBtn');
    
    if (scanBtn) {
      scanBtn.disabled = true;
      scanBtn.innerHTML = '<span class="btn-icon">🔄</span> Scanning...';
    }
    
    try {
      const result = await this.sendMessage({ type: 'SCAN_MODULES' });
      
      if (result.success) {
        await this.loadData();
        this.updateUI();
        this.showNotification(`Found ${result.found || 0} modules`, 'success');
      } else {
        throw new Error(result.error || 'Module scan failed');
      }
    } catch (error) {
      console.error('Module scan failed:', error);
      this.showNotification('Module scan failed', 'error');
    } finally {
      this.isScanning = false;
      
      if (scanBtn) {
        scanBtn.disabled = false;
        scanBtn.innerHTML = '<span class="btn-icon">🔍</span> Scan';
      }
    }
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
    
    if (!moduleList) return;
    
    // Filter modules by category
    const filteredModules = this.getFilteredModules();
    
    if (filteredModules.length === 0) {
      if (emptyState) {
        emptyState.style.display = 'flex';
        // Clear other content but keep empty state
        Array.from(moduleList.children).forEach(child => {
          if (child !== emptyState) {
            child.remove();
          }
        });
      }
      return;
    }
    
    if (emptyState) {
      emptyState.style.display = 'none';
    }
    
    // Sort modules by priority, then name
    filteredModules.sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return a.name.localeCompare(b.name);
    });
    
    // Clear existing modules but keep empty state
    Array.from(moduleList.children).forEach(child => {
      if (child.id !== 'emptyState') {
        child.remove();
      }
    });
    
    // Add filtered modules
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
   * Create module list element
   */
  createModuleElement(module) {
    const template = document.getElementById('moduleTemplate');
    if (!template) {
      console.error('Module template not found');
      return document.createElement('div');
    }
    
    const element = template.content.cloneNode(true);
    const moduleItem = element.querySelector('.module-item');
    
    // Set module data
    if (moduleItem) {
      moduleItem.dataset.moduleId = module.id;
    }
    
    // Fill in module information
    const nameElement = element.querySelector('.module-name');
    const descElement = element.querySelector('.module-description');
    const versionElement = element.querySelector('.module-version');
    const toggleElement = element.querySelector('.module-toggle');
    const statusIndicator = element.querySelector('.status-indicator');
    const statusText = element.querySelector('.status-text');
    
    if (nameElement) nameElement.textContent = module.name;
    if (descElement) descElement.textContent = module.description || '';
    if (versionElement) versionElement.textContent = module.version || '1.0.0';
    if (toggleElement) toggleElement.checked = module.enabled || false;
    
    // Update status
    if (statusIndicator && statusText) {
      this.updateModuleStatus(statusIndicator, statusText, module);
    }
    
    return element;
  }

  /**
   * Update module status indicator
   */
  updateModuleStatus(indicator, textElement, module) {
    // Clear previous classes
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
        throw new Error(result.error || 'Toggle failed');
      }
    } catch (error) {
      console.error(`Failed to toggle module ${moduleId}:`, error);
      
      // Revert toggle state
      event.target.checked = !enabled;
      
      this.showNotification('Failed to toggle module', 'error');
    } finally {
      this.setModuleLoading(moduleId, false);
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
   * Toggle module expansion
   */
  toggleModuleExpansion(moduleItem) {
    const body = moduleItem.querySelector('.module-body');
    if (body) {
      body.style.display = body.style.display === 'none' ? 'block' : 'none';
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
      toggle?.classList.add('loading');
      statusIndicator?.classList.add('loading');
    } else {
      toggle?.classList.remove('loading');
      statusIndicator?.classList.remove('loading');
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
   * Show notification
   */
  showNotification(message, type = 'info', duration = 3000) {
    // Use global notification system if available
    if (window.notifications) {
      window.notifications.show(message, type, { duration });
      return;
    }
    
    // Fallback notification
    console.log(`${type.toUpperCase()}: ${message}`);
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
    this.showNotification('Module settings coming soon', 'info');
  }

  async reloadModule(moduleId) {
    console.log('Reloading module:', moduleId);
    try {
      const result = await this.sendMessage({ type: 'RELOAD_MODULE', moduleId });
      if (result.success) {
        this.showNotification(`Module ${moduleId} reloaded`, 'success');
      }
    } catch (error) {
      this.showNotification('Failed to reload module', 'error');
    }
  }

  async unloadModule(moduleId) {
    console.log('Unloading module:', moduleId);
    this.showNotification('Module unloading coming soon', 'info');
  }

  async openGlobalSettings() {
    console.log('Opening global settings');
    this.showNotification('Global settings coming soon', 'info');
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.popupManager = new PopupManager();
});

console.log('🎯 Dynamic Popup script loaded');
