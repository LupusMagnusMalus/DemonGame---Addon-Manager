/**
 * Module Loader - Loading and Lifecycle Management
 * Handles loading, initialization, cleanup, and error handling of modules
 */

class ModuleLoader {
  constructor() {
    this.loadedModules = new Map();
    this.activeModules = new Map();
    this.moduleErrors = new Map();
    this.loadQueue = [];
    this.isLoading = false;
  }

  /**
   * Load and initialize a module
   */
  async loadModule(moduleId, moduleInfo, config = {}) {
    try {
      console.log(`🔄 Loading module: ${moduleId}`);

      // Check if already loaded
      if (this.loadedModules.has(moduleId)) {
        console.log(`⏭️ Module ${moduleId} already loaded`);
        return this.loadedModules.get(moduleId);
      }

      // Validate module info
      if (!moduleInfo || !moduleInfo.path) {
        throw new Error(`Invalid module info for ${moduleId}`);
      }

      // Check page restrictions
      if (!this.shouldLoadOnCurrentPage(moduleInfo)) {
        console.log(`⏭️ Module ${moduleId} skipped (page filter)`);
        return null;
      }

      // Check load timing
      if (!this.shouldLoadNow(moduleInfo)) {
        console.log(`⏭️ Module ${moduleId} deferred (load timing)`);
        this.deferModuleLoad(moduleId, moduleInfo, config);
        return null;
      }

      // Load dependencies first
      if (moduleInfo.dependencies) {
        await this.loadDependencies(moduleId, moduleInfo.dependencies);
      }

      // Load module files
      const module = await this.loadModuleFiles(moduleId, moduleInfo);
      
      // Get module configuration
      const moduleConfig = await this.getModuleConfiguration(moduleId, moduleInfo, config);
      
      // Initialize module
      const initializedModule = await this.initializeModule(moduleId, module, moduleConfig);
      
      // Register loaded module
      this.loadedModules.set(moduleId, initializedModule);
      
      if (initializedModule.active) {
        this.activeModules.set(moduleId, initializedModule);
      }

      // Clear any previous errors
      this.moduleErrors.delete(moduleId);

      console.log(`✅ Module ${moduleId} loaded successfully`);
      
      // Emit load event
      this.emitModuleEvent('moduleLoaded', { moduleId, module: initializedModule });
      
      return initializedModule;

    } catch (error) {
      console.error(`❌ Failed to load module ${moduleId}:`, error);
      
      // Store error for debugging
      this.moduleErrors.set(moduleId, {
        error: error.message,
        timestamp: Date.now(),
        stack: error.stack
      });

      // Emit error event
      this.emitModuleEvent('moduleError', { moduleId, error });
      
      throw error;
    }
  }

  /**
   * Check if module should load on current page
   */
  shouldLoadOnCurrentPage(moduleInfo) {
    if (!moduleInfo.pages || moduleInfo.pages.length === 0) {
      return true; // Load on all pages if no restrictions
    }

    const currentPage = this.getCurrentPageIdentifier();
    return moduleInfo.pages.some(page => {
      // Support wildcards and regex patterns
      if (page.includes('*')) {
        const regex = new RegExp(page.replace(/\*/g, '.*'));
        return regex.test(currentPage);
      }
      return currentPage === page || currentPage.includes(page);
    });
  }

  /**
   * Get current page identifier
   */
  getCurrentPageIdentifier() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    
    // Return filename or path based on what's more useful
    return filename || path.slice(1);
  }

  /**
   * Check if module should load now based on timing
   */
  shouldLoadNow(moduleInfo) {
    const loadOn = moduleInfo.loadOn || 'domready';
    const readyState = document.readyState;

    switch (loadOn) {
      case 'start':
        return true;
      case 'domready':
        return readyState === 'interactive' || readyState === 'complete';
      case 'complete':
        return readyState === 'complete';
      case 'manual':
        return false; // Manual modules don't auto-load
      default:
        return readyState === 'interactive' || readyState === 'complete';
    }
  }

  /**
   * Defer module loading until appropriate time
   */
  deferModuleLoad(moduleId, moduleInfo, config) {
    const loadOn = moduleInfo.loadOn || 'domready';
    
    switch (loadOn) {
      case 'domready':
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            this.loadModule(moduleId, moduleInfo, config);
          });
        }
        break;
        
      case 'complete':
        if (document.readyState !== 'complete') {
          window.addEventListener('load', () => {
            this.loadModule(moduleId, moduleInfo, config);
          });
        }
        break;
    }
  }

  /**
   * Load module dependencies
   */
  async loadDependencies(moduleId, dependencies) {
    for (const [depId, version] of Object.entries(dependencies)) {
      if (depId === 'minExtensionVersion') {
        // Check extension version compatibility
        continue;
      }

      if (!this.loadedModules.has(depId)) {
        // Try to load dependency
        const depInfo = await this.getModuleInfo(depId);
        if (depInfo) {
          await this.loadModule(depId, depInfo);
        } else {
          throw new Error(`Dependency ${depId} not found for module ${moduleId}`);
        }
      }
    }
  }

  /**
   * Get module info from registry
   */
  async getModuleInfo(moduleId) {
    const { modules = {} } = await chrome.storage.local.get('modules');
    return modules[moduleId];
  }

  /**
   * Load module files (scripts, styles, assets)
   */
  async loadModuleFiles(moduleId, moduleInfo) {
    const moduleBase = {
      id: moduleId,
      info: moduleInfo,
      loadedFiles: [],
      styles: [],
      scripts: []
    };

    // Load additional scripts first
    if (moduleInfo.files && moduleInfo.files.scripts) {
      for (const scriptFile of moduleInfo.files.scripts) {
        await this.loadScript(moduleInfo, scriptFile);
        moduleBase.scripts.push(scriptFile);
      }
    }

    // Load styles
    if (moduleInfo.files && moduleInfo.files.styles) {
      for (const styleFile of moduleInfo.files.styles) {
        this.loadStyle(moduleInfo, styleFile);
        moduleBase.styles.push(styleFile);
      }
    }

    // Load main script
    const mainScript = moduleInfo.files?.main || `${moduleId}.js`;
    const moduleUrl = this.getModuleUrl(moduleInfo, mainScript);
    
    try {
      const module = await import(moduleUrl);
      moduleBase.module = module;
      moduleBase.mainScript = mainScript;
      
      return moduleBase;
    } catch (error) {
      throw new Error(`Failed to import main module script: ${error.message}`);
    }
  }

  /**
   * Load additional script file
   */
  async loadScript(moduleInfo, scriptFile) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = this.getModuleUrl(moduleInfo, scriptFile);
      script.type = 'module';
      
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load script: ${scriptFile}`));
      
      document.head.appendChild(script);
    });
  }

  /**
   * Load style file
   */
  loadStyle(moduleInfo, styleFile) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = this.getModuleUrl(moduleInfo, styleFile);
    document.head.appendChild(link);
  }

  /**
   * Get full URL for module file
   */
  getModuleUrl(moduleInfo, filename) {
    return chrome.runtime.getURL(`${moduleInfo.path}/${filename}`);
  }

  /**
   * Get module configuration
   */
  async getModuleConfiguration(moduleId, moduleInfo, overrides = {}) {
    try {
      // Get stored settings
      const { moduleSettings = {} } = await chrome.storage.local.get('moduleSettings');
      const storedConfig = moduleSettings[moduleId] || {};
      
      // Get default settings from manifest
      const defaultConfig = {};
      if (moduleInfo.settings) {
        for (const [key, setting] of Object.entries(moduleInfo.settings)) {
          defaultConfig[key] = setting.default;
        }
      }
      
      // Merge configurations (overrides > stored > defaults)
      const config = {
        ...defaultConfig,
        ...storedConfig,
        ...overrides
      };
      
      return config;
    } catch (error) {
      console.warn(`⚠️ Failed to get configuration for ${moduleId}:`, error);
      return {};
    }
  }

  /**
   * Initialize module
   */
  async initializeModule(moduleId, moduleContainer, config) {
    try {
      const module = moduleContainer.module;
      
      // Create module context
      const context = {
        id: moduleId,
        config,
        info: moduleContainer.info,
        api: window.GameEnhancement
      };
      
      // Initialize if init function exists
      let initResult = null;
      if (typeof module.init === 'function') {
        initResult = await module.init(config, context);
      }
      
      // Create module wrapper
      const wrappedModule = {
        id: moduleId,
        container: moduleContainer,
        context,
        config,
        active: true,
        initResult,
        
        // Module lifecycle methods
        init: module.init,
        cleanup: module.cleanup,
        onSettingsChange: module.onSettingsChange,
        handleInstall: module.handleInstall,
        handleUpdate: module.handleUpdate,
        
        // Control methods
        reload: () => this.reloadModule(moduleId),
        unload: () => this.unloadModule(moduleId),
        updateConfig: (newConfig) => this.updateModuleConfig(moduleId, newConfig)
      };
      
      return wrappedModule;
      
    } catch (error) {
      throw new Error(`Module initialization failed: ${error.message}`);
    }
  }

  /**
   * Unload a module
   */
  async unloadModule(moduleId) {
    try {
      console.log(`🔄 Unloading module: ${moduleId}`);
      
      const module = this.loadedModules.get(moduleId);
      if (!module) {
        console.log(`⏭️ Module ${moduleId} not loaded`);
        return true;
      }
      
      // Call cleanup if available
      if (typeof module.cleanup === 'function') {
        await module.cleanup();
      }
      
      // Remove from active modules
      this.activeModules.delete(moduleId);
      this.loadedModules.delete(moduleId);
      
      // Remove styles
      const styles = document.querySelectorAll(`link[href*="${moduleId}"]`);
      styles.forEach(style => style.remove());
      
      console.log(`✅ Module ${moduleId} unloaded`);
      
      // Emit unload event
      this.emitModuleEvent('moduleUnloaded', { moduleId });
      
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to unload module ${moduleId}:`, error);
      return false;
    }
  }

  /**
   * Reload a module
   */
  async reloadModule(moduleId) {
    try {
      console.log(`🔄 Reloading module: ${moduleId}`);
      
      // Get current config before unloading
      const currentModule = this.loadedModules.get(moduleId);
      const config = currentModule?.config || {};
      
      // Unload first
      await this.unloadModule(moduleId);
      
      // Get fresh module info
      const moduleInfo = await this.getModuleInfo(moduleId);
      if (!moduleInfo) {
        throw new Error(`Module ${moduleId} not found in registry`);
      }
      
      // Reload with current config
      return await this.loadModule(moduleId, moduleInfo, config);
      
    } catch (error) {
      console.error(`❌ Failed to reload module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Update module configuration
   */
  async updateModuleConfig(moduleId, newConfig) {
    try {
      const module = this.loadedModules.get(moduleId);
      if (!module) {
        throw new Error(`Module ${moduleId} not loaded`);
      }
      
      // Update config
      module.config = { ...module.config, ...newConfig };
      
      // Save to storage
      const { moduleSettings = {} } = await chrome.storage.local.get('moduleSettings');
      moduleSettings[moduleId] = module.config;
      await chrome.storage.local.set({ moduleSettings });
      
      // Notify module of config change
      if (typeof module.onSettingsChange === 'function') {
        await module.onSettingsChange(module.config);
      }
      
      console.log(`🔧 Module ${moduleId} configuration updated`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to update config for ${moduleId}:`, error);
      return false;
    }
  }

  /**
   * Get module status
   */
  getModuleStatus(moduleId) {
    if (this.activeModules.has(moduleId)) return 'active';
    if (this.loadedModules.has(moduleId)) return 'loaded';
    if (this.moduleErrors.has(moduleId)) return 'error';
    return 'not-loaded';
  }

  /**
   * Get all loaded modules
   */
  getAllLoadedModules() {
    return new Map(this.loadedModules);
  }

  /**
   * Get all active modules
   */
  getAllActiveModules() {
    return new Map(this.activeModules);
  }

  /**
   * Get module errors
   */
  getModuleErrors() {
    return new Map(this.moduleErrors);
  }

  /**
   * Clear module error
   */
  clearModuleError(moduleId) {
    this.moduleErrors.delete(moduleId);
  }

  /**
   * Emit module events
   */
  emitModuleEvent(eventType, data) {
    if (window.GameEnhancement?.events?.emit) {
      window.GameEnhancement.events.emit(eventType, data);
    }
  }

  /**
   * Load modules in priority order
   */
  async loadModulesByPriority(moduleList) {
    // Sort by priority (higher = load first)
    const sorted = [...moduleList].sort((a, b) => {
      const priorityA = a.moduleInfo?.priority || 0;
      const priorityB = b.moduleInfo?.priority || 0;
      return priorityB - priorityA;
    });

    const results = [];
    for (const { moduleId, moduleInfo, config } of sorted) {
      try {
        const result = await this.loadModule(moduleId, moduleInfo, config);
        results.push({ moduleId, success: true, module: result });
      } catch (error) {
        results.push({ moduleId, success: false, error });
      }
    }

    return results;
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.GameEnhancement = window.GameEnhancement || {};
  window.GameEnhancement.ModuleLoader = ModuleLoader;
}

console.log('🔄 Module Loader System Loaded');
