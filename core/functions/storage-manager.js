/**
 * Storage Manager - Chrome Extension Storage Wrapper
 * Provides a clean API for storage operations with module-specific functionality
 */

class StorageManager {
  constructor() {
    this.cache = new Map();
    this.listeners = new Map();
    this.initializeListeners();
  }

  /**
   * Initialize storage change listeners
   */
  initializeListeners() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local') {
        this.handleStorageChange(changes);
      }
    });
  }

  /**
   * Handle storage changes and notify listeners
   */
  handleStorageChange(changes) {
    for (const [key, change] of Object.entries(changes)) {
      // Update cache
      if (change.newValue !== undefined) {
        this.cache.set(key, change.newValue);
      } else {
        this.cache.delete(key);
      }
      
      // Notify listeners
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.forEach(callback => {
          try {
            callback(change.newValue, change.oldValue, key);
          } catch (error) {
            console.error('Storage listener error:', error);
          }
        });
      }
    }
  }

  /**
   * Get value(s) from storage
   */
  async get(keys = null) {
    try {
      const result = await chrome.storage.local.get(keys);
      
      // Update cache
      if (keys === null) {
        // Getting all storage
        this.cache.clear();
        for (const [key, value] of Object.entries(result)) {
          this.cache.set(key, value);
        }
      } else if (typeof keys === 'string') {
        // Single key
        if (result[keys] !== undefined) {
          this.cache.set(keys, result[keys]);
        }
      } else if (Array.isArray(keys)) {
        // Array of keys
        for (const key of keys) {
          if (result[key] !== undefined) {
            this.cache.set(key, result[key]);
          }
        }
      } else if (typeof keys === 'object') {
        // Object with defaults
        for (const [key, defaultValue] of Object.entries(keys)) {
          const value = result[key] !== undefined ? result[key] : defaultValue;
          this.cache.set(key, value);
          if (result[key] === undefined) {
            result[key] = defaultValue;
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Storage get error:', error);
      throw error;
    }
  }

  /**
   * Set value(s) in storage
   */
  async set(items) {
    try {
      await chrome.storage.local.set(items);
      
      // Update cache
      for (const [key, value] of Object.entries(items)) {
        this.cache.set(key, value);
      }
      
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      throw error;
    }
  }

  /**
   * Remove key(s) from storage
   */
  async remove(keys) {
    try {
      await chrome.storage.local.remove(keys);
      
      // Update cache
      const keyArray = Array.isArray(keys) ? keys : [keys];
      for (const key of keyArray) {
        this.cache.delete(key);
      }
      
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      throw error;
    }
  }

  /**
   * Clear all storage
   */
  async clear() {
    try {
      await chrome.storage.local.clear();
      this.cache.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  }

  /**
   * Get cached value (synchronous)
   */
  getCached(key) {
    return this.cache.get(key);
  }

  /**
   * Check if key exists in cache
   */
  hasCached(key) {
    return this.cache.has(key);
  }

  /**
   * Get module-specific configuration
   */
  async getModuleConfig(moduleId, defaults = {}) {
    try {
      const { moduleSettings = {} } = await this.get('moduleSettings');
      const config = moduleSettings[moduleId] || {};
      return { ...defaults, ...config };
    } catch (error) {
      console.error(`Failed to get config for module ${moduleId}:`, error);
      return defaults;
    }
  }

  /**
   * Set module-specific configuration
   */
  async setModuleConfig(moduleId, config) {
    try {
      const { moduleSettings = {} } = await this.get('moduleSettings');
      moduleSettings[moduleId] = { ...moduleSettings[moduleId], ...config };
      await this.set({ moduleSettings });
      return true;
    } catch (error) {
      console.error(`Failed to set config for module ${moduleId}:`, error);
      return false;
    }
  }

  /**
   * Update module setting
   */
  async updateModuleSetting(moduleId, settingKey, value) {
    try {
      const config = await this.getModuleConfig(moduleId);
      config[settingKey] = value;
      return await this.setModuleConfig(moduleId, config);
    } catch (error) {
      console.error(`Failed to update setting ${settingKey} for module ${moduleId}:`, error);
      return false;
    }
  }

  /**
   * Get global settings
   */
  async getGlobalSettings(defaults = {}) {
    try {
      const { globalSettings = {} } = await this.get('globalSettings');
      return { ...defaults, ...globalSettings };
    } catch (error) {
      console.error('Failed to get global settings:', error);
      return defaults;
    }
  }

  /**
   * Set global settings
   */
  async setGlobalSettings(settings) {
    try {
      const { globalSettings = {} } = await this.get('globalSettings');
      const updated = { ...globalSettings, ...settings };
      await this.set({ globalSettings: updated });
      return true;
    } catch (error) {
      console.error('Failed to set global settings:', error);
      return false;
    }
  }

  /**
   * Get module registry
   */
  async getModuleRegistry() {
    try {
      const { modules = {} } = await this.get('modules');
      return modules;
    } catch (error) {
      console.error('Failed to get module registry:', error);
      return {};
    }
  }

  /**
   * Set module registry
   */
  async setModuleRegistry(modules) {
    try {
      await this.set({ modules });
      return true;
    } catch (error) {
      console.error('Failed to set module registry:', error);
      return false;
    }
  }

  /**
   * Update module in registry
   */
  async updateModule(moduleId, moduleData) {
    try {
      const modules = await this.getModuleRegistry();
      modules[moduleId] = { ...modules[moduleId], ...moduleData };
      return await this.setModuleRegistry(modules);
    } catch (error) {
      console.error(`Failed to update module ${moduleId}:`, error);
      return false;
    }
  }

  /**
   * Toggle module enabled state
   */
  async toggleModule(moduleId, enabled = null) {
    try {
      const modules = await this.getModuleRegistry();
      const module = modules[moduleId];
      
      if (!module) {
        throw new Error(`Module ${moduleId} not found in registry`);
      }
      
      const newState = enabled !== null ? enabled : !module.enabled;
      module.enabled = newState;
      module.status = newState ? 'active' : 'disabled';
      
      await this.setModuleRegistry(modules);
      return newState;
    } catch (error) {
      console.error(`Failed to toggle module ${moduleId}:`, error);
      return false;
    }
  }

  /**
   * Get theme settings
   */
  async getTheme() {
    try {
      const { theme = 'dark' } = await this.get('theme');
      return theme;
    } catch (error) {
      console.error('Failed to get theme:', error);
      return 'dark';
    }
  }

  /**
   * Set theme
   */
  async setTheme(theme) {
    try {
      await this.set({ theme });
      return true;
    } catch (error) {
      console.error('Failed to set theme:', error);
      return false;
    }
  }

  /**
   * Listen to storage changes for specific key
   */
  addListener(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
  }

  /**
   * Remove storage change listener
   */
  removeListener(key, callback) {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(key);
      }
    }
  }

  /**
   * Get storage usage info
   */
  async getStorageInfo() {
    try {
      const data = await this.get();
      const dataSize = JSON.stringify(data).length;
      
      return {
        bytesInUse: dataSize,
        quota: chrome.storage.local.QUOTA_BYTES,
        percentUsed: (dataSize / chrome.storage.local.QUOTA_BYTES) * 100,
        keys: Object.keys(data).length,
        cacheSize: this.cache.size
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return null;
    }
  }

  /**
   * Export all data for backup
   */
  async exportData() {
    try {
      const data = await this.get();
      return {
        version: '0.1.0',
        timestamp: Date.now(),
        data
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }

  /**
   * Import data from backup
   */
  async importData(exportedData) {
    try {
      if (!exportedData || !exportedData.data) {
        throw new Error('Invalid export data format');
      }
      
      await this.clear();
      await this.set(exportedData.data);
      
      console.log('Data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  /**
   * Reset to defaults
   */
  async reset() {
    try {
      await this.clear();
      
      // Set default values
      const defaults = {
        version: '0.1.0',
        theme: 'dark',
        globalSettings: {
          performance: {
            maxActiveModules: 20,
            lazyLoading: true,
            debugMode: false
          },
          ui: {
            showNotifications: true,
            animationsEnabled: true,
            compactMode: false
          }
        },
        modules: {},
        moduleSettings: {},
        lastModuleScan: null
      };
      
      await this.set(defaults);
      console.log('Storage reset to defaults');
      return true;
    } catch (error) {
      console.error('Failed to reset storage:', error);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.GameEnhancement = window.GameEnhancement || {};
  window.GameEnhancement.StorageManager = StorageManager;
}

console.log('💾 Storage Manager Loaded');
