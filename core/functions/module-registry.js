/**
 * Module Registry - Discovery and Cataloging System
 * Handles scanning, validation, and registration of modules
 */

class ModuleRegistry {
  constructor() {
    this.modules = new Map();
    this.categories = new Map();
    this.lastScan = null;
  }

  /**
   * Manually scan for modules (triggered by user action)
   * This is the main entry point for module discovery
   */
  async scanModules() {
    try {
      console.log('🔍 Starting module scan...');
      
      const startTime = Date.now();
      const foundModules = new Map();
      const errors = [];

      // Scan predefined module directories
      const moduleDirectories = [
        'modules/base',
        'modules/community', 
        'modules/experimental'
      ];

      for (const dir of moduleDirectories) {
        try {
          const categoryModules = await this.scanDirectory(dir);
          for (const [id, module] of categoryModules) {
            foundModules.set(id, module);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to scan directory ${dir}:`, error);
          errors.push({ directory: dir, error: error.message });
        }
      }

      // Validate all found modules
      const validatedModules = new Map();
      for (const [id, module] of foundModules) {
        try {
          const validated = await this.validateModule(id, module);
          if (validated) {
            validatedModules.set(id, validated);
          }
        } catch (error) {
          console.error(`❌ Module ${id} validation failed:`, error);
          errors.push({ moduleId: id, error: error.message });
        }
      }

      // Update registry
      this.modules = validatedModules;
      this.lastScan = Date.now();
      this.updateCategories();

      // Save to storage
      await this.saveRegistry();

      const scanTime = Date.now() - startTime;
      console.log(`✅ Module scan complete: ${validatedModules.size} modules found in ${scanTime}ms`);
      
      return {
        success: true,
        moduleCount: validatedModules.size,
        scanTime,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('❌ Module scan failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Scan a specific directory for modules
   */
  async scanDirectory(directory) {
    const modules = new Map();
    
    // In a real implementation, this would scan the file system
    // For now, we'll simulate with known modules based on directory
    
    const knownModules = this.getKnownModules(directory);
    
    for (const moduleInfo of knownModules) {
      try {
        const manifest = await this.loadModuleManifest(moduleInfo.path);
        if (manifest) {
          const module = {
            ...manifest,
            id: moduleInfo.id,
            path: moduleInfo.path,
            directory: directory,
            category: this.extractCategory(directory),
            author: this.extractAuthor(moduleInfo.path),
            discoveredAt: Date.now()
          };
          modules.set(moduleInfo.id, module);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to load module ${moduleInfo.id}:`, error);
      }
    }

    return modules;
  }

  /**
   * Get known modules for simulation (replace with real file system scan)
   */
  getKnownModules(directory) {
    const modules = {
      'modules/base': [
        { id: 'battle-pass', path: 'modules/base/battle-pass' },
        { id: 'favicon-fix', path: 'modules/base/favicon-fix' },
        { id: 'time-format', path: 'modules/base/time-format' },
        { id: 'battle-stats', path: 'modules/base/battle/stats' },
        { id: 'battle-predictions', path: 'modules/base/battle/predictions' }
      ],
      'modules/community': [
        { id: 'custom-feature', path: 'modules/community/custom-feature' }
      ],
      'modules/experimental': [
        { id: 'ai-assistant', path: 'modules/experimental/ai-assistant' }
      ]
    };

    return modules[directory] || [];
  }

  /**
   * Load and parse module manifest
   */
  async loadModuleManifest(modulePath) {
    try {
      // In real implementation, would fetch the actual file
      // For now, return simulated manifest based on path
      return this.getSimulatedManifest(modulePath);
    } catch (error) {
      throw new Error(`Failed to load manifest from ${modulePath}: ${error.message}`);
    }
  }

  /**
   * Get simulated manifest for development (replace with real file loading)
   */
  getSimulatedManifest(modulePath) {
    const manifests = {
      'modules/base/battle-pass': {
        name: 'Battle Pass Auto-Scroll',
        version: '1.2.0',
        description: 'Automatically scrolls to your current battle pass progress',
        pages: ['battle_pass.php'],
        loadOn: 'domready',
        priority: 10,
        settings: {
          enabled: { type: 'boolean', default: true, label: 'Enable Auto-Scroll' },
          scrollDelay: {
            type: 'number',
            default: 2000,
            min: 0,
            max: 10000,
            step: 100,
            label: 'Scroll Delay (ms)',
            description: 'Time to wait before scrolling'
          },
          scrollTarget: {
            type: 'select',
            default: 'current',
            options: [
              { value: 'current', label: 'Current Progress' },
              { value: 'next', label: 'Next Unlockable' },
              { value: 'start', label: 'Always Start' }
            ],
            label: 'Scroll Target Position'
          }
        },
        icon: '🎯',
        tags: ['quality-of-life', 'automation', 'battle-pass']
      },
      
      'modules/base/favicon-fix': {
        name: 'Favicon Fix',
        version: '1.0.0',
        description: 'Fixes missing favicon issues',
        loadOn: 'start',
        priority: 100,
        settings: {
          enabled: { type: 'boolean', default: true, label: 'Enable Favicon Fix' }
        },
        icon: '🔧',
        tags: ['fix', 'ui']
      },

      'modules/base/time-format': {
        name: '24-Hour Time Format',
        version: '1.1.0',
        description: 'Convert server time to 24-hour format',
        loadOn: 'domready',
        priority: 5,
        settings: {
          enabled: { type: 'boolean', default: false, label: 'Use 24-Hour Format' },
          showSeconds: { type: 'boolean', default: false, label: 'Show Seconds' }
        },
        icon: '🕐',
        tags: ['time', 'format', 'ui']
      }
    };

    return manifests[modulePath] || null;
  }

  /**
   * Validate module manifest and structure
   */
  async validateModule(moduleId, module) {
    try {
      // Required fields validation
      const requiredFields = ['name', 'version'];
      for (const field of requiredFields) {
        if (!module[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate version format (semver)
      if (!this.isValidSemver(module.version)) {
        throw new Error(`Invalid version format: ${module.version}`);
      }

      // Validate settings schema
      if (module.settings) {
        this.validateSettings(module.settings);
      }

      // Auto-generate missing fields
      const validated = {
        ...module,
        id: module.id || moduleId,
        category: module.category || this.extractCategory(module.path),
        author: module.author || this.extractAuthor(module.path),
        subcategory: module.subcategory || '',
        description: module.description || '',
        icon: module.icon || '📦',
        tags: module.tags || [],
        loadOn: module.loadOn || 'domready',
        priority: module.priority || 0,
        pages: module.pages || [],
        dependencies: module.dependencies || {},
        permissions: module.permissions || [],
        files: module.files || {},
        enabled: false, // Default to disabled
        status: 'ready'
      };

      // Ensure enabled setting exists
      if (!validated.settings) {
        validated.settings = {};
      }
      if (!validated.settings.enabled) {
        validated.settings.enabled = {
          type: 'boolean',
          default: true,
          label: 'Enable Module'
        };
      }

      return validated;

    } catch (error) {
      throw new Error(`Module ${moduleId} validation failed: ${error.message}`);
    }
  }

  /**
   * Validate settings schema
   */
  validateSettings(settings) {
    const validTypes = ['boolean', 'number', 'string', 'select', 'multiselect', 'color', 'keybind', 'json'];
    
    for (const [key, setting] of Object.entries(settings)) {
      if (!setting.type || !validTypes.includes(setting.type)) {
        throw new Error(`Invalid setting type for ${key}: ${setting.type}`);
      }
      
      // Type-specific validation
      if (setting.type === 'number') {
        if (setting.min !== undefined && setting.max !== undefined && setting.min > setting.max) {
          throw new Error(`Invalid range for ${key}: min > max`);
        }
      }
      
      if (setting.type === 'select' || setting.type === 'multiselect') {
        if (!setting.options || !Array.isArray(setting.options)) {
          throw new Error(`Setting ${key} requires options array`);
        }
      }
    }
  }

  /**
   * Check if version string is valid semver
   */
  isValidSemver(version) {
    const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
    return semverRegex.test(version);
  }

  /**
   * Extract category from directory path
   */
  extractCategory(path) {
    const match = path.match(/modules\/([^\/]+)/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Extract author from path (if structured as modules/author/module)
   */
  extractAuthor(path) {
    const parts = path.split('/');
    if (parts.length >= 3) {
      return parts[2]; // modules/category/author or modules/category/module
    }
    return 'unknown';
  }

  /**
   * Update category mapping
   */
  updateCategories() {
    this.categories.clear();
    
    for (const [id, module] of this.modules) {
      const category = module.category;
      if (!this.categories.has(category)) {
        this.categories.set(category, []);
      }
      this.categories.get(category).push(id);
    }
  }

  /**
   * Save registry to storage
   */
  async saveRegistry() {
    try {
      const registryData = {
        modules: Object.fromEntries(this.modules),
        categories: Object.fromEntries(this.categories),
        lastModuleScan: this.lastScan
      };

      await chrome.storage.local.set(registryData);
      console.log('💾 Module registry saved to storage');
    } catch (error) {
      console.error('❌ Failed to save registry:', error);
      throw error;
    }
  }

  /**
   * Load registry from storage
   */
  async loadRegistry() {
    try {
      const data = await chrome.storage.local.get(['modules', 'categories', 'lastModuleScan']);
      
      if (data.modules) {
        this.modules = new Map(Object.entries(data.modules));
      }
      
      if (data.categories) {
        this.categories = new Map(Object.entries(data.categories));
      }
      
      this.lastScan = data.lastModuleScan || null;
      
      console.log(`📋 Module registry loaded: ${this.modules.size} modules`);
    } catch (error) {
      console.error('❌ Failed to load registry:', error);
    }
  }

  /**
   * Get module by ID
   */
  getModule(moduleId) {
    return this.modules.get(moduleId);
  }

  /**
   * Get all modules
   */
  getAllModules() {
    return new Map(this.modules);
  }

  /**
   * Get modules by category
   */
  getModulesByCategory(category) {
    const moduleIds = this.categories.get(category) || [];
    const modules = new Map();
    
    for (const id of moduleIds) {
      const module = this.modules.get(id);
      if (module) {
        modules.set(id, module);
      }
    }
    
    return modules;
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const stats = {
      totalModules: this.modules.size,
      categories: this.categories.size,
      lastScan: this.lastScan,
      categoryBreakdown: {}
    };

    for (const [category, moduleIds] of this.categories) {
      stats.categoryBreakdown[category] = moduleIds.length;
    }

    return stats;
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.GameEnhancement = window.GameEnhancement || {};
  window.GameEnhancement.ModuleRegistry = ModuleRegistry;
}

console.log('📋 Module Registry System Loaded');
