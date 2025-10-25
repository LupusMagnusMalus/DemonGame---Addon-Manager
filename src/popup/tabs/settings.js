// Settings Tab Controller - Complete Feature Management
(function() {
  'use strict';

  class SettingsController {
    constructor() {
      this.popupController = null;
      this.config = { base: {}, lupus: {}, asura: {} };
      this.currentCategory = 'base';
      this.featureDefinitions = this.getFeatureDefinitions();
    }

    async init(popupController) {
      console.log('⚙️ Initializing Settings tab');
      
      this.popupController = popupController;
      await this.loadConfig();
      
      this.setupCategorySelector();
      this.renderFeatures();
      this.setupQuickActions();
      this.setupExportImport();
    }

    getFeatureDefinitions() {
      return {
        base: {
          title: 'Base Features',
          icon: '🎮',
          description: 'Core enhancements and quality-of-life improvements',
          features: [
            {
              id: 'notificationSystem',
              name: 'Enhanced Notifications',
              description: 'Improved notification system with sound alerts',
              category: 'Core'
            },
            {
              id: 'itemTooltips',
              name: 'Item Tooltips',
              description: 'Detailed item information on hover',
              category: 'Core'
            },
            {
              id: 'inventoryView',
              name: 'Inventory Grid/List Toggle',
              description: 'Switch between grid and list view',
              category: 'Core'
            },
            {
              id: 'quickActions',
              name: 'Quick Action Buttons',
              description: 'Fast action buttons on items',
              category: 'Core'
            },
            {
              id: 'battleEnhancements',
              name: 'Battle Interface',
              description: 'Enhanced battle UI and information',
              category: 'Battle'
            },
            {
              id: 'statsDisplay',
              name: 'Stats Display',
              description: 'Improved statistics visualization',
              category: 'Battle'
            },
            {
              id: 'pvpEnhancements',
              name: 'PvP Enhancements',
              description: 'Better PvP interface and tracking',
              category: 'Battle'
            },
            {
              id: 'petSummary',
              name: 'Pet Summary',
              description: 'Pet statistics and food calculator',
              category: 'Quality of Life'
            },
            {
              id: 'eventTracking',
              name: 'Event Tracking',
              description: 'Track active events and timers',
              category: 'Quality of Life'
            },
            {
              id: 'monsterFilters',
              name: 'Monster Filters',
              description: 'Filter monsters by various criteria',
              category: 'Quality of Life'
            },
            {
              id: 'lootCollection',
              name: 'Quick Loot Collection',
              description: 'Fast loot collection tools',
              category: 'Quality of Life'
            },
            {
              id: 'gateCollapse',
              name: 'Collapsible Gates',
              description: 'Collapse/expand gate sections',
              category: 'Quality of Life'
            },
            {
              id: 'battleAlarm',
              name: 'Battle Alarms',
              description: 'Audio alerts for important battles',
              category: 'Quality of Life'
            }
          ]
        },
        lupus: {
          title: 'Lupus Extended',
          icon: '🚀',
          description: 'Advanced features and automation',
          features: [
            {
              id: 'fastActions',
              name: 'Fast Actions',
              description: 'Speed up common actions',
              category: 'Automation'
            },
            {
              id: 'autoRefresh',
              name: 'Auto Refresh',
              description: 'Automatic page refresh at intervals',
              category: 'Automation'
            },
            {
              id: 'battlePass',
              name: 'Battle Pass Tracker',
              description: 'Track and display battle pass progress',
              category: 'Tracking'
            },
            {
              id: 'customThemes',
              name: 'Custom Themes',
              description: 'Additional theme customization options',
              category: 'Advanced'
            },
            {
              id: 'advancedStats',
              name: 'Advanced Statistics',
              description: 'Detailed statistics and analytics',
              category: 'Advanced'
            },
            {
              id: 'bulkActions',
              name: 'Bulk Actions',
              description: 'Perform operations on multiple items',
              category: 'Advanced'
            }
          ]
        },
        asura: {
          title: 'Asura Professional',
          icon: '⚡',
          description: 'Professional-grade tools and AI features',
          features: [
            {
              id: 'aiRecommendations',
              name: 'AI Recommendations',
              description: 'Intelligent gameplay suggestions',
              category: 'AI-Powered'
            },
            {
              id: 'predictiveAnalytics',
              name: 'Predictive Analytics',
              description: 'Predict battle outcomes and strategies',
              category: 'AI-Powered'
            },
            {
              id: 'autoOptimization',
              name: 'Auto Optimization',
              description: 'Automatically optimize stats and equipment',
              category: 'AI-Powered'
            },
            {
              id: 'advancedFilters',
              name: 'Advanced Filters',
              description: 'Complex filtering and search options',
              category: 'Professional'
            },
            {
              id: 'exportTools',
              name: 'Export Tools',
              description: 'Export data in multiple formats',
              category: 'Professional'
            },
            {
              id: 'macroSystem',
              name: 'Macro System',
              description: 'Create and run custom macros',
              category: 'Professional'
            }
          ]
        }
      };
    }

    async loadConfig() {
      const stored = await this.popupController.loadConfig();
      
      // Initialize with defaults if not present
      this.config.base = stored.base || {};
      this.config.lupus = stored.lupus || {};
      this.config.asura = stored.asura || {};
      
      console.log('📋 Config loaded:', this.config);
    }

    setupCategorySelector() {
      const selector = document.getElementById('categorySelector');
      if (!selector) return;
      
      selector.innerHTML = Object.keys(this.featureDefinitions).map(key => {
        const def = this.featureDefinitions[key];
        return `<option value="${key}">${def.icon} ${def.title}</option>`;
      }).join('');
      
      selector.value = this.currentCategory;
      
      selector.addEventListener('change', (e) => {
        this.currentCategory = e.target.value;
        this.renderFeatures();
      });
    }

    renderFeatures() {
      const container = document.getElementById('featuresContainer');
      if (!container) return;
      
      const def = this.featureDefinitions[this.currentCategory];
      
      // Group features by category
      const grouped = {};
      def.features.forEach(feature => {
        if (!grouped[feature.category]) {
          grouped[feature.category] = [];
        }
        grouped[feature.category].push(feature);
      });
      
      let html = `
        <div class="category-info">
          <h2>${def.icon} ${def.title}</h2>
          <p>${def.description}</p>
        </div>
      `;
      
      Object.keys(grouped).forEach(categoryName => {
        html += `
          <div class="feature-category">
            <div class="category-header">
              <div class="category-title">
                <span class="category-icon">📦</span>
                ${categoryName}
              </div>
              <span class="category-toggle">▼</span>
            </div>
            <div class="category-features">
              ${grouped[categoryName].map(f => this.renderFeature(f)).join('')}
            </div>
          </div>
        `;
      });
      
      container.innerHTML = html;
      
      // Setup toggles
      this.setupFeatureToggles();
      
      // Setup category collapse
      this.popupController.setupCategoryCollapse();
    }

    renderFeature(feature) {
      const isEnabled = this.config[this.currentCategory][feature.id] || false;
      
      return `
        <div class="feature-item">
          <div class="feature-info">
            <div class="feature-name">
              ${feature.name}
              <span class="feature-badge ${this.currentCategory}">${this.currentCategory.toUpperCase()}</span>
            </div>
            <div class="feature-description">${feature.description}</div>
          </div>
          <div class="toggle-switch">
            <input type="checkbox" id="${feature.id}" ${isEnabled ? 'checked' : ''} data-namespace="${this.currentCategory}">
            <span class="toggle-slider"></span>
          </div>
        </div>
      `;
    }

    setupFeatureToggles() {
      document.querySelectorAll('.feature-item input[type="checkbox"]').forEach(toggle => {
        toggle.addEventListener('change', async (e) => {
          const featureId = e.target.id;
          const namespace = e.target.getAttribute('data-namespace');
          const isEnabled = e.target.checked;
          
          console.log(`🔄 Toggle changed: ${namespace}.${featureId} = ${isEnabled}`);
          
          // Update local config
          this.config[namespace][featureId] = isEnabled;
          
          // Save to storage
          const fullConfig = await this.popupController.loadConfig();
          fullConfig[namespace] = this.config[namespace];
          await this.popupController.saveConfig('config', fullConfig);
          
          // Show feedback
          this.popupController.showToast(
            `${this.getFeatureName(featureId)} ${isEnabled ? 'enabled' : 'disabled'}`,
            'success'
          );
          
          // Notify content script if on demonichunter.com
          try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url && tab.url.includes('demonichunter.com')) {
              chrome.tabs.sendMessage(tab.id, {
                type: 'FEATURE_CHANGED',
                namespace: namespace,
                featureId: featureId,
                enabled: isEnabled
              }).catch(() => {
                console.log('Could not notify content script (page might need refresh)');
              });
            }
          } catch (error) {
            console.warn('Could not notify tab:', error);
          }
        });
      });
    }

    getFeatureName(featureId) {
      for (const category of Object.values(this.featureDefinitions)) {
        const feature = category.features.find(f => f.id === featureId);
        if (feature) return feature.name;
      }
      return featureId;
    }

    setupQuickActions() {
      document.getElementById('enableAll')?.addEventListener('click', async () => {
        const def = this.featureDefinitions[this.currentCategory];
        
        def.features.forEach(feature => {
          this.config[this.currentCategory][feature.id] = true;
          const toggle = document.getElementById(feature.id);
          if (toggle) toggle.checked = true;
        });
        
        const fullConfig = await this.popupController.loadConfig();
        fullConfig[this.currentCategory] = this.config[this.currentCategory];
        await this.popupController.saveConfig('config', fullConfig);
        
        this.popupController.showToast('All features enabled', 'success');
      });
      
      document.getElementById('disableAll')?.addEventListener('click', async () => {
        const def = this.featureDefinitions[this.currentCategory];
        
        def.features.forEach(feature => {
          this.config[this.currentCategory][feature.id] = false;
          const toggle = document.getElementById(feature.id);
          if (toggle) toggle.checked = false;
        });
        
        const fullConfig = await this.popupController.loadConfig();
        fullConfig[this.currentCategory] = this.config[this.currentCategory];
        await this.popupController.saveConfig('config', fullConfig);
        
        this.popupController.showToast('All features disabled', 'success');
      });
      
      document.getElementById('resetToDefaults')?.addEventListener('click', async () => {
        if (!confirm('Reset all settings to defaults? This cannot be undone.')) return;
        
        this.config[this.currentCategory] = {};
        
        const fullConfig = await this.popupController.loadConfig();
        fullConfig[this.currentCategory] = {};
        await this.popupController.saveConfig('config', fullConfig);
        
        this.renderFeatures();
        this.popupController.showToast('Settings reset to defaults', 'success');
      });
    }

    setupExportImport() {
      const exportBtn = document.getElementById('exportConfig');
      const importBtn = document.getElementById('importConfig');
      const importFile = document.getElementById('importFile');
      
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          this.popupController.exportConfig(this.config);
        });
      }
      
      if (importBtn && importFile) {
        importBtn.addEventListener('click', () => importFile.click());
        
        importFile.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (file) {
            const imported = await this.popupController.importConfig(file);
            if (imported) {
              this.config = imported;
              await this.popupController.saveConfig('config', this.config);
              this.renderFeatures();
            }
          }
        });
      }
    }
  }

  // Export
  window.init_settings = async function(popupController) {
    const controller = new SettingsController();
    await controller.init(popupController);
  };

  window.cleanup_settings = function() {
    console.log('⚙️ Cleaning up Settings tab');
  };
})();