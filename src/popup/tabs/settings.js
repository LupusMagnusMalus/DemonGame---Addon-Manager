// Settings Tab Controller - Complete with working toggles
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
      
      console.log('✅ Settings tab initialized');
    }

    getFeatureDefinitions() {
      return {
        base: {
          title: 'Base Features (GonBruck)',
          icon: '🎮',
          description: 'Core game enhancements and quality of life improvements',
          features: [
            // Core - WICHTIG: enabled muss existieren!
            { 
              id: 'enabled', 
              name: 'Enable Base Features', 
              description: 'Master switch for all base features (must be ON)', 
              category: 'Core',
              important: true
            },
            { 
              id: 'sidebar', 
              name: 'Enhanced Sidebar', 
              description: 'Improved sidebar with quick navigation', 
              category: 'Core' 
            },
            
            // Wave Page (IDs mit Unterstrichen!)
            { 
              id: 'wave_mods', 
              name: 'Wave Enhancements', 
              description: 'General wave page improvements', 
              category: 'Wave' 
            },
            { 
              id: 'monster_filters', 
              name: 'Monster Filters', 
              description: 'Filter monsters by HP, level, type', 
              category: 'Wave' 
            },
            { 
              id: 'loot_collection', 
              name: 'Quick Loot Collection', 
              description: 'Fast loot collection tools', 
              category: 'Wave' 
            },
            { 
              id: 'gate_collapse', 
              name: 'Collapsible Gates', 
              description: 'Collapse/expand gate sections', 
              category: 'Wave' 
            },
            
            // Battle
            { 
              id: 'battle_mods', 
              name: 'Battle Enhancements', 
              description: 'Enhanced battle interface and information', 
              category: 'Battle' 
            },
            
            // Inventory
            { 
              id: 'inventory_mods', 
              name: 'Inventory Enhancements', 
              description: 'Improved inventory management', 
              category: 'Inventory' 
            },
            
            // Stats
            { 
              id: 'stats_mods', 
              name: 'Stats Display', 
              description: 'Enhanced statistics visualization', 
              category: 'Stats' 
            },
            
            // PvP
            { 
              id: 'pvp_mods', 
              name: 'PvP Enhancements', 
              description: 'Better PvP interface and tracking', 
              category: 'PvP' 
            },
            
            // Pets
            { 
              id: 'pets_mods', 
              name: 'Pet Management', 
              description: 'Pet statistics and management tools', 
              category: 'Pets' 
            },
            
            // Other
            { 
              id: 'event_mods', 
              name: 'Event Tracking', 
              description: 'Track active events and timers', 
              category: 'Other' 
            },
            { 
              id: 'merchant_mods', 
              name: 'Merchant Enhancements', 
              description: 'Improved merchant interface', 
              category: 'Other' 
            },
            { 
              id: 'blacksmith_mods', 
              name: 'Blacksmith Enhancements', 
              description: 'Better blacksmith tools', 
              category: 'Other' 
            },
            { 
              id: 'legendary_forge_mods', 
              name: 'Legendary Forge', 
              description: 'Legendary forge improvements', 
              category: 'Other' 
            }
          ]
        },
        lupus: {
          title: 'Lupus Enhancements',
          icon: '🚀',
          description: 'Advanced features and automation',
          features: [
            // Core
            { 
              id: 'enabled', 
              name: 'Enable Lupus Features', 
              description: 'Master switch for all Lupus enhancements', 
              category: 'Core',
              important: true
            },
            
            // Interface (IDs in camelCase!)
            { 
              id: 'enhancedSidebar', 
              name: 'Enhanced Sidebar', 
              description: 'Enhanced sidebar with submenus', 
              category: 'Interface' 
            },
            { 
              id: 'submenus', 
              name: 'Submenu System', 
              description: 'Advanced submenu navigation', 
              category: 'Interface' 
            },
            { 
              id: 'rankDetection', 
              name: 'Rank Detection', 
              description: 'Automatic rank detection and display', 
              category: 'Interface' 
            },
            { 
              id: 'timeFormat24h', 
              name: '24-Hour Time Format', 
              description: 'Display server time in 24-hour format', 
              category: 'Interface' 
            },
            
            // Automation
            { 
              id: 'levelGateSwitch', 
              name: 'Level-based Gate Switching', 
              description: 'Automatically switch gates based on level', 
              category: 'Automation' 
            },
            
            // Battle Pass
            { 
              id: 'battlePass', 
              name: 'Battle Pass Scroll', 
              description: 'Enable smooth horizontal scrolling on battle pass page', 
              category: 'Battle Pass' 
            }
          ]
        },
        asura: {
          title: 'Asura Advanced',
          icon: '⚡',
          description: 'Professional-grade tools and advanced features',
          features: [
            // Core
            { 
              id: 'enabled', 
              name: 'Enable Asura Features', 
              description: 'Master switch for all Asura features', 
              category: 'Core',
              important: true
            },
            
            // Interface (IDs in camelCase!)
            { 
              id: 'advancedSidebar', 
              name: 'Advanced Sidebar', 
              description: 'Professional sidebar (replaces base sidebar)', 
              category: 'Interface' 
            },
            { 
              id: 'advancedSettings', 
              name: 'Advanced Settings Manager', 
              description: 'Advanced settings and theme system', 
              category: 'Interface' 
            },
            { 
              id: 'quickAccess', 
              name: 'Quick Access System', 
              description: 'Quick access toolbar for common actions', 
              category: 'Interface' 
            },
            { 
              id: 'menuCustomization', 
              name: 'Menu Customization', 
              description: 'Customize menu layout and appearance', 
              category: 'Interface' 
            },
            
            // Wave Features
            { 
              id: 'advancedFilters', 
              name: 'Advanced Monster Filters', 
              description: 'Complex filtering and search options', 
              category: 'Wave' 
            },
            { 
              id: 'lootHighlighting', 
              name: 'Advanced Loot Highlighting', 
              description: 'Highlight valuable loot with custom rules', 
              category: 'Wave' 
            },
            
            // Stats
            { 
              id: 'statAllocation', 
              name: 'Sidebar Stat Allocation', 
              description: 'Allocate stats directly from sidebar', 
              category: 'Stats' 
            },
            
            // Automation
            { 
              id: 'waveAutoRefresh', 
              name: 'Wave Auto-Refresh', 
              description: 'Automatically refresh wave page', 
              category: 'Automation' 
            },
            
            // PvP
            { 
              id: 'battlePrediction', 
              name: 'Battle Outcome Prediction', 
              description: 'Predict PvP battle outcomes', 
              category: 'PvP' 
            },
            
            // Theme
            { 
              id: 'customBackgrounds', 
              name: 'Custom Backgrounds', 
              description: 'Set custom page backgrounds', 
              category: 'Theme' 
            },
            
            // Pets
            { 
              id: 'petNaming', 
              name: 'Pet Naming System', 
              description: 'Give custom names to your pets', 
              category: 'Pets' 
            }
          ]
        }
      };
    }

    async loadConfig() {
      try {
        const result = await chrome.storage.local.get(['config']);
        const stored = result.config || {};
        
        // Initialize with defaults
        this.config.base = stored.base || { enabled: false };
        this.config.lupus = stored.lupus || { enabled: false };
        this.config.asura = stored.asura || { enabled: false };
        
        console.log('📋 Config loaded:', this.config);
      } catch (error) {
        console.error('❌ Failed to load config:', error);
      }
    }

    async saveConfig() {
      try {
        await chrome.storage.local.set({ config: this.config });
        console.log('💾 Config saved:', this.config);
        return true;
      } catch (error) {
        console.error('❌ Failed to save config:', error);
        return false;
      }
    }

    setupCategorySelector() {
      const selector = document.getElementById('categorySelector');
      if (!selector) {
        console.error('❌ Category selector not found!');
        return;
      }
      
      selector.innerHTML = Object.keys(this.featureDefinitions).map(key => {
        const def = this.featureDefinitions[key];
        return `<option value="${key}">${def.icon} ${def.title}</option>`;
      }).join('');
      
      selector.value = this.currentCategory;
      
      selector.addEventListener('change', (e) => {
        console.log('📂 Category changed to:', e.target.value);
        this.currentCategory = e.target.value;
        this.renderFeatures();
      });
      
      console.log('✅ Category selector setup complete');
    }

    renderFeatures() {
      const container = document.getElementById('featuresContainer');
      if (!container) {
        console.error('❌ Features container not found!');
        return;
      }
      
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
      
      console.log('✅ Features rendered for category:', this.currentCategory);
      
      // Setup toggles AFTER rendering
      this.setupFeatureToggles();
      
      // Setup category collapse
      this.popupController.setupCategoryCollapse();
    }

    renderFeature(feature) {
      const isEnabled = this.config[this.currentCategory][feature.id] || false;
      const toggleId = `${this.currentCategory}-${feature.id}`;
      
      return `
        <div class="feature-item" data-feature-id="${feature.id}">
          <div class="feature-info">
            <div class="feature-name">
              ${feature.name}
              ${feature.important ? '<span class="feature-badge">REQUIRED</span>' : ''}
            </div>
            <div class="feature-description">${feature.description}</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" 
                   id="${toggleId}" 
                   data-feature="${feature.id}"
                   data-namespace="${this.currentCategory}"
                   ${isEnabled ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      `;
    }

    setupFeatureToggles() {
      console.log('🔧 Setting up feature toggles...');
      
      const toggles = document.querySelectorAll('.feature-item input[type="checkbox"]');
      console.log(`📊 Found ${toggles.length} toggle switches`);
      
      if (toggles.length === 0) {
        console.error('❌ No toggles found! Check HTML rendering.');
        return;
      }
      
      toggles.forEach((toggle, index) => {
        const featureId = toggle.getAttribute('data-feature');
        const namespace = toggle.getAttribute('data-namespace');
        const isChecked = toggle.checked;
        
        console.log(`Toggle ${index}: ${namespace}.${featureId} = ${isChecked}, id="${toggle.id}"`);
        
        // Test if toggle is clickable
        toggle.addEventListener('click', (e) => {
          console.log('🖱️ Toggle CLICKED:', namespace, featureId);
        });
        
        // Main change handler
        toggle.addEventListener('change', async (e) => {
          const isEnabled = e.target.checked;
          
          console.log(`🔄 Toggle CHANGED: ${namespace}.${featureId} = ${isEnabled}`);
          
          // Update config
          if (!this.config[namespace]) {
            this.config[namespace] = {};
          }
          this.config[namespace][featureId] = isEnabled;
          
          // Save
          const saved = await this.saveConfig();
          
          if (saved) {
            this.popupController.showToast(
              `${this.getFeatureName(featureId)} ${isEnabled ? 'enabled' : 'disabled'}`,
              'success'
            );
            
            // Notify content script
            await this.notifyContentScript();
            
          } else {
            // Revert on failure
            e.target.checked = !isEnabled;
            this.config[namespace][featureId] = !isEnabled;
            this.popupController.showToast('Failed to save settings', 'error');
          }
        });
      });
      
      console.log('✅ Feature toggles setup complete');
    }

    async notifyContentScript() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab || !tab.id) {
          console.log('ℹ️ No active tab - changes will apply on next page load');
          return;
        }
        
        console.log(`📤 Sending APPLY_CONFIG to tab ${tab.id}`);
        console.log('📦 Config being sent:', this.config);
        
        chrome.tabs.sendMessage(tab.id, {
          type: 'APPLY_CONFIG',
          config: this.config
        }).then(response => {
          console.log('✅ Content script responded:', response);
        }).catch(error => {
          console.log('⚠️ Content script not responding:', error.message);
          
          // Offer reload
          if (confirm('Settings saved. Reload page to apply changes?')) {
            chrome.tabs.reload(tab.id);
          }
        });
        
      } catch (error) {
        console.error('❌ Failed to notify content script:', error);
      }
    }

    getFeatureName(featureId) {
      const def = this.featureDefinitions[this.currentCategory];
      const feature = def.features.find(f => f.id === featureId);
      return feature ? feature.name : featureId;
    }

    setupQuickActions() {
      const enableAll = document.getElementById('enableAll');
      const disableAll = document.getElementById('disableAll');
      const resetBtn = document.getElementById('resetToDefaults');
      
      if (enableAll) {
        enableAll.addEventListener('click', async () => {
          console.log('⚡ Enable All clicked');
          
          const def = this.featureDefinitions[this.currentCategory];
          
          def.features.forEach(feature => {
            this.config[this.currentCategory][feature.id] = true;
          });
          
          await this.saveConfig();
          this.renderFeatures();
          this.popupController.showToast(`All ${this.currentCategory} features enabled`, 'success');
          await this.notifyContentScript();
        });
      }
      
      if (disableAll) {
        disableAll.addEventListener('click', async () => {
          console.log('⛔ Disable All clicked');
          
          const def = this.featureDefinitions[this.currentCategory];
          
          def.features.forEach(feature => {
            this.config[this.currentCategory][feature.id] = false;
          });
          
          await this.saveConfig();
          this.renderFeatures();
          this.popupController.showToast(`All ${this.currentCategory} features disabled`, 'success');
          await this.notifyContentScript();
        });
      }
      
      if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
          if (!confirm('Reset all settings to defaults? This cannot be undone.')) return;
          
          console.log('🔄 Reset to Defaults clicked');
          
          this.config[this.currentCategory] = { enabled: false };
          await this.saveConfig();
          
          this.renderFeatures();
          this.popupController.showToast('Settings reset to defaults', 'success');
          await this.notifyContentScript();
        });
      }
      
      console.log('✅ Quick actions setup complete');
    }

    setupExportImport() {
      const exportBtn = document.getElementById('exportConfig');
      const importBtn = document.getElementById('importConfig');
      const importFile = document.getElementById('importFile');
      
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          console.log('📤 Export clicked');
          this.popupController.exportConfig(this.config, `lupus-config-${Date.now()}.json`);
        });
      }
      
      if (importBtn && importFile) {
        importBtn.addEventListener('click', () => {
          console.log('📥 Import clicked');
          importFile.click();
        });
        
        importFile.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          
          console.log('📂 File selected:', file.name);
          
          const imported = await this.popupController.importConfig(file);
          if (imported) {
            this.config = imported;
            await this.saveConfig();
            this.renderFeatures();
            this.popupController.showToast('Configuration imported successfully', 'success');
            await this.notifyContentScript();
          }
          
          // Reset file input
          importFile.value = '';
        });
      }
      
      console.log('✅ Export/Import setup complete');
    }
  }

  // Export
  window.init_settings = async function(popupController) {
    console.log('🎬 Initializing Settings controller...');
    const controller = new SettingsController();
    await controller.init(popupController);
  };

  window.cleanup_settings = function() {
    console.log('🧹 Cleaning up Settings tab');
  };
  
})();