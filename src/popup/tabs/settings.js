// Settings Tab Controller - Uses popupController utilities
(function() {
  'use strict';

  class SettingsController {
    constructor() {
      this.popupController = null;
      this.config = { base: {}, lupus: {}, custom: {} };
      this.currentAddon = 'base';
      this.featureDefinitions = this.getFeatureDefinitions();
    }

    async init(popupController) {
      console.log('⚙️ Initializing Settings tab');
      
      this.popupController = popupController;
      this.config = await popupController.loadConfig();
      
      // Initialize addons with defaults if not present
      if (!this.config.base) this.config.base = {};
      if (!this.config.lupus) this.config.lupus = {};
      
      this.setupAddonSelector();
      this.renderFeatures();
      this.setupQuickActions();
      this.setupExportImport();
    }

    getFeatureDefinitions() {
      return {
        base: {
          title: 'Base Features',
          icon: '🎮',
          categories: [
            {
              name: 'Core Enhancements',
              features: [
                { id: 'notificationSystem', name: 'Notification System', description: 'Enhanced in-game notifications' },
                { id: 'itemTooltips', name: 'Item Tooltips', description: 'Detailed item information on hover' },
                { id: 'inventoryView', name: 'Inventory View', description: 'Grid/List view toggle for inventory' },
                { id: 'quickActions', name: 'Quick Actions', description: 'Fast action buttons on items' }
              ]
            },
            {
              name: 'Battle & Stats',
              features: [
                { id: 'battleEnhancements', name: 'Battle Enhancements', description: 'Enhanced battle interface' },
                { id: 'statsDisplay', name: 'Stats Display', description: 'Improved stats visualization' },
                { id: 'pvpEnhancements', name: 'PvP Enhancements', description: 'Better PvP interface' }
              ]
            },
            {
              name: 'Quality of Life',
              features: [
                { id: 'petSummary', name: 'Pet Summary', description: 'Pet statistics and food calculator' },
                { id: 'eventTracking', name: 'Event Tracking', description: 'Track active events' },
                { id: 'monsterFilters', name: 'Monster Filters', description: 'Filter monsters by criteria' },
                { id: 'lootCollection', name: 'Loot Collection', description: 'Quick loot collection tools' },
                { id: 'gateCollapse', name: 'Gate Collapse', description: 'Collapsible gate sections' },
                { id: 'battleAlarm', name: 'Battle Alarm', description: 'Audio alerts for battles' }
              ]
            }
          ]
        },
        lupus: {
          title: 'Lupus Enhancements',
          icon: '🚀',
          categories: [
            {
              name: 'Advanced Features',
              features: [
                { id: 'fastActions', name: 'Fast Actions', description: 'Speed up common actions' },
                { id: 'autoRefresh', name: 'Auto Refresh', description: 'Automatic page refresh' },
                { id: 'customThemes', name: 'Custom Themes', description: 'Additional theme options' },
                { id: 'advancedStats', name: 'Advanced Stats', description: 'Detailed statistics tracking' },
                { id: 'bulkActions', name: 'Bulk Actions', description: 'Perform bulk operations' }
              ]
            }
          ]
        }
      };
    }

    setupAddonSelector() {
      const cards = document.querySelectorAll('.addon-card');
      
      cards.forEach(card => {
        card.addEventListener('click', () => {
          const addon = card.getAttribute('data-addon');
          this.switchAddon(addon);
        });
      });
    }

    switchAddon(addon) {
      this.currentAddon = addon;
      
      document.querySelectorAll('.addon-card').forEach(card => {
        card.classList.remove('active');
      });
      document.querySelector(`[data-addon="${addon}"]`)?.classList.add('active');
      
      this.renderFeatures();
    }

    renderFeatures() {
      const container = document.getElementById('featureList');
      if (!container) return;
      
      const addonDef = this.featureDefinitions[this.currentAddon];
      if (!addonDef) return;
      
      let html = '';
      
      addonDef.categories.forEach(category => {
        html += `
          <div class="feature-category">
            <div class="category-header">
              <div class="category-title">${category.name}</div>
              <span class="category-toggle">▼</span>
            </div>
            <div class="category-features">
              ${category.features.map(f => this.renderFeature(f)).join('')}
            </div>
          </div>
        `;
      });
      
      container.innerHTML = html;
      this.setupFeatureToggles();
      
      // Use popupController utility for category collapse
      this.popupController.setupCategoryCollapse();
    }

    renderFeature(feature) {
      const isEnabled = this.config[this.currentAddon][feature.id] || false;
      
      return `
        <div class="feature-item">
          <div class="feature-info">
            <div class="feature-name">${feature.name}</div>
            <div class="feature-description">${feature.description}</div>
          </div>
          <div class="toggle-switch">
            <input type="checkbox" id="${feature.id}" ${isEnabled ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </div>
        </div>
      `;
    }

    setupFeatureToggles() {
      const addonDef = this.featureDefinitions[this.currentAddon];
      if (!addonDef) return;
      
      const features = {};
      addonDef.categories.forEach(category => {
        category.features.forEach(feature => {
          features[feature.id] = this.config[this.currentAddon][feature.id] || false;
        });
      });
      
      // Use popupController utility for automatic toggle setup
      this.popupController.setupFeatureToggles(features, this.currentAddon, (featureId, enabled) => {
        this.config[this.currentAddon][featureId] = enabled;
      });
    }

    setupQuickActions() {
      document.getElementById('enableAll')?.addEventListener('click', () => this.enableAllFeatures());
      document.getElementById('disableAll')?.addEventListener('click', () => this.disableAllFeatures());
      document.getElementById('resetToDefaults')?.addEventListener('click', () => this.resetToDefaults());
    }

    async enableAllFeatures() {
      const addonDef = this.featureDefinitions[this.currentAddon];
      if (!addonDef) return;
      
      addonDef.categories.forEach(category => {
        category.features.forEach(feature => {
          this.config[this.currentAddon][feature.id] = true;
        });
      });
      
      await this.popupController.saveConfig('config', this.config);
      this.renderFeatures();
      this.popupController.showToast('All features enabled', 'success');
    }

    async disableAllFeatures() {
      const addonDef = this.featureDefinitions[this.currentAddon];
      if (!addonDef) return;
      
      addonDef.categories.forEach(category => {
        category.features.forEach(feature => {
          this.config[this.currentAddon][feature.id] = false;
        });
      });
      
      await this.popupController.saveConfig('config', this.config);
      this.renderFeatures();
      this.popupController.showToast('All features disabled', 'success');
    }

    async resetToDefaults() {
      if (!confirm('Reset all settings to defaults? This cannot be undone.')) return;
      
      this.config[this.currentAddon] = {};
      await this.popupController.saveConfig('config', this.config);
      this.renderFeatures();
      this.popupController.showToast('Settings reset to defaults', 'success');
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