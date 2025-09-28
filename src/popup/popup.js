// Popup Controller for Multi-Tab Interface
(function() {
  'use strict';

  class PopupController {
    constructor() {
      this.currentConfig = null;
      this.activeTab = 'features';
      this.colorPalette = null;
      this.initialize();
    }

    async initialize() {
      console.log('🎮 Initializing Popup Controller');
      
      await this.loadCurrentConfiguration();
      this.setupTabNavigation();
      this.setupFeatureToggling();
      this.setupColorCustomization();
      this.setupAdvancedSettings();
      this.setupFooterActions();
      this.updateUI();
      this.updateStatus();
    }

    async loadCurrentConfiguration() {
      try {
        // Get config from content script
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'GET_CURRENT_CONFIG'
        });

        if (response && response.config) {
          this.currentConfig = response.config;
        } else {
          // Load from storage as fallback
          const result = await chrome.storage.local.get('game-enhancement-config');
          this.currentConfig = result['game-enhancement-config'] || this.getDefaultConfig();
        }
      } catch (error) {
        console.warn('Could not load config from content script, using defaults:', error);
        this.currentConfig = this.getDefaultConfig();
      }
    }

    getDefaultConfig() {
      return {
        base: {
          enabled: true,
          sidebar: true,
          wave_mods: true,
          battle_mods: true,
          inventory_mods: true,
          stats_mods: true,
          pvp_mods: true,
          pets_mods: true,
          event_mods: true
        },
        lupus: {
          enabled: false,
          submenus: false,
          timeFormat24h: false,
          rankDetection: false,
          levelGateSwitch: false
        },
        asura: {
          enabled: false,
          advancedSidebar: false,
          quickAccess: false,
          advancedFilters: false,
          battlePrediction: false,
          customBackgrounds: false,
          petNaming: false
        },
        theme: {
          sidebarColor: 'dark-blue',
          backgroundColor: 'black'
        },
        advanced: {
          pinnedItemsLimit: 3,
          refreshInterval: 60,
          debugMode: false,
          performanceMode: false
        }
      };
    }

    setupTabNavigation() {
      const tabButtons = document.querySelectorAll('.tab-btn');
      const tabContents = document.querySelectorAll('.tab-content');

      tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const tabId = btn.dataset.tab;
          
          // Update button states
          tabButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          // Update content visibility
          tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabId}-tab`) {
              content.classList.add('active');
            }
          });
          
          this.activeTab = tabId;
          
          // Special handling for customization tab
          if (tabId === 'customization') {
            this.loadColorPalettes();
          }
        });
      });
    }

    setupFeatureToggling() {
      // Base features
      document.querySelectorAll('input[name="base-feature"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const feature = e.target.value;
          this.currentConfig.base[feature] = e.target.checked;
          this.updateFeatureCount();
        });
      });

      // Lupus features
      document.querySelectorAll('input[name="lupus-feature"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const feature = e.target.value;
          this.currentConfig.lupus[feature] = e.target.checked;
          
          // Auto-enable lupus if any feature is enabled
          this.currentConfig.lupus.enabled = this.hasAnyLupusFeature();
          this.updateFeatureCount();
        });
      });

      // Asura features
      document.querySelectorAll('input[name="asura-feature"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const feature = e.target.value;
          this.currentConfig.asura[feature] = e.target.checked;
          
          // Auto-enable asura if any feature is enabled
          this.currentConfig.asura.enabled = this.hasAnyAsuraFeature();
          this.updateFeatureCount();
          
          // Handle conflicts
          this.handleFeatureConflicts(feature, e.target.checked);
        });
      });
    }

    hasAnyLupusFeature() {
      const features = ['submenus', 'timeFormat24h', 'rankDetection', 'levelGateSwitch'];
      return features.some(feature => this.currentConfig.lupus[feature]);
    }

    hasAnyAsuraFeature() {
      const features = ['advancedSidebar', 'quickAccess', 'advancedFilters', 'battlePrediction', 'customBackgrounds', 'petNaming'];
      return features.some(feature => this.currentConfig.asura[feature]);
    }

    handleFeatureConflicts(feature, enabled) {
      if (!enabled) return;

      const conflicts = {
        'advancedSidebar': ['base.sidebar'],
        'advancedFilters': ['base.monster_filters']
      };

      const featureConflicts = conflicts[feature];
      if (featureConflicts) {
        featureConflicts.forEach(conflict => {
          const [category, conflictFeature] = conflict.split('.');
          if (this.currentConfig[category][conflictFeature]) {
            this.currentConfig[category][conflictFeature] = false;
            
            // Update UI
            const conflictCheckbox = document.querySelector(`input[value="${conflictFeature}"]`);
            if (conflictCheckbox) {
              conflictCheckbox.checked = false;
            }
            
            this.showConflictNotification(feature, conflict);
          }
        });
      }
    }

    showConflictNotification(enabledFeature, disabledFeature) {
      const notification = document.createElement('div');
      notification.className = 'conflict-notification';
      notification.innerHTML = `
        <div class="notification-content">
          <span class="notification-icon">⚠️</span>
          <span>Disabled "${disabledFeature}" due to conflict with "${enabledFeature}"</span>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 4000);
    }

    setupColorCustomization() {
      this.loadColorPalettes();
      this.setupPresetButtons();
    }

    loadColorPalettes() {
      // Load sidebar colors
      const sidebarColors = document.getElementById('sidebar-colors');
      if (sidebarColors) {
        sidebarColors.innerHTML = this.generateColorPalette('sidebar');
        this.setupColorSelection('sidebar');
      }

      // Load background colors
      const backgroundColors = document.getElementById('background-colors');
      if (backgroundColors) {
        backgroundColors.innerHTML = this.generateColorPalette('background');
        this.setupColorSelection('background');
      }
    }

    generateColorPalette(type) {
      const colors = type === 'sidebar' ? [
        { id: 'dark-blue', name: 'Dark Blue', value: '#1e1e2e' },
        { id: 'dark-gray', name: 'Dark Gray', value: '#2d2d3d' },
        { id: 'night-blue', name: 'Night Blue', value: '#1a1a2e' },
        { id: 'navy', name: 'Navy', value: '#16213e' },
        { id: 'ocean', name: 'Ocean Blue', value: '#0f3460' },
        { id: 'purple', name: 'Purple', value: '#533483' },
        { id: 'violet', name: 'Violet', value: '#7209b7' },
        { id: 'deep-purple', name: 'Deep Purple', value: '#2d1b69' },
        { id: 'forest', name: 'Forest Green', value: '#0b6623' },
        { id: 'brown', name: 'Brown', value: '#654321' },
        { id: 'dark-red', name: 'Dark Red', value: '#8b0000' },
        { id: 'black', name: 'Black', value: '#000000' }
      ] : [
        { id: 'black', name: 'Black', value: '#000000' },
        { id: 'dark-gray', name: 'Very Dark Gray', value: '#1a1a1a' },
        { id: 'medium-gray', name: 'Dark Gray', value: '#2d2d2d' },
        { id: 'dark-blue', name: 'Dark Blue', value: '#0f0f23' },
        { id: 'dark-purple', name: 'Dark Purple', value: '#1a0033' },
        { id: 'dark-green', name: 'Dark Green', value: '#001a00' },
        { id: 'dark-red', name: 'Dark Red', value: '#1a0000' },
        { id: 'dark-teal', name: 'Dark Teal', value: '#001a1a' }
      ];

      return colors.map(color => `
        <div class="color-option ${this.isColorSelected(type, color.id) ? 'selected' : ''}" 
             data-color-id="${color.id}" 
             data-color-type="${type}"
             style="background: ${color.value}"
             title="${color.name}">
        </div>
      `).join('');
    }

    isColorSelected(type, colorId) {
      const configKey = type === 'sidebar' ? 'sidebarColor' : 'backgroundColor';
      return this.currentConfig.theme[configKey] === colorId;
    }

    setupColorSelection(type) {
      const container = document.getElementById(`${type}-colors`);
      if (!container) return;

      container.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
          // Remove previous selection
          container.querySelectorAll('.color-option').forEach(opt => 
            opt.classList.remove('selected')
          );
          
          // Add selection
          option.classList.add('selected');
          
          // Update config
          const colorId = option.dataset.colorId;
          const configKey = type === 'sidebar' ? 'sidebarColor' : 'backgroundColor';
          this.currentConfig.theme[configKey] = colorId;
          
          // Apply preview
          this.applyColorPreview(type, colorId);
        });
      });
    }

    applyColorPreview(type, colorId) {
      // This would send a preview message to content script
      // For now, just update the popup preview
      console.log(`Preview: ${type} color changed to ${colorId}`);
    }

    setupPresetButtons() {
      const presets = {
        cyberpunk: { sidebar: 'violet', background: 'dark-purple' },
        forest: { sidebar: 'forest', background: 'dark-green' },
        ocean: { sidebar: 'ocean', background: 'dark-blue' },
        sunset: { sidebar: 'dark-red', background: 'dark-red' }
      };

      document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const presetName = btn.dataset.preset;
          const preset = presets[presetName];
          
          if (preset) {
            this.currentConfig.theme.sidebarColor = preset.sidebar;
            this.currentConfig.theme.backgroundColor = preset.background;
            
            // Update UI
            this.loadColorPalettes();
            this.showPresetAppliedNotification(presetName);
          }
        });
      });
    }

    showPresetAppliedNotification(presetName) {
      const notification = document.createElement('div');
      notification.className = 'preset-notification';
      notification.textContent = `${presetName.charAt(0).toUpperCase() + presetName.slice(1)} preset applied!`;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 2000);
    }

    setupAdvancedSettings() {
      // Pinned items limit
      const pinnedLimit = document.getElementById('pinned-items-limit');
      if (pinnedLimit) {
        pinnedLimit.value = this.currentConfig.advanced.pinnedItemsLimit;
        pinnedLimit.addEventListener('change', (e) => {
          this.currentConfig.advanced.pinnedItemsLimit = parseInt(e.target.value);
        });
      }

      // Refresh interval
      const refreshInterval = document.getElementById('refresh-interval');
      if (refreshInterval) {
        refreshInterval.value = this.currentConfig.advanced.refreshInterval;
        refreshInterval.addEventListener('change', (e) => {
          this.currentConfig.advanced.refreshInterval = parseInt(e.target.value);
        });
      }

      // Debug mode
      const debugMode = document.getElementById('debug-mode');
      if (debugMode) {
        debugMode.checked = this.currentConfig.advanced.debugMode;
        debugMode.addEventListener('change', (e) => {
          this.currentConfig.advanced.debugMode = e.target.checked;
        });
      }

      // Performance mode
      const performanceMode = document.getElementById('performance-mode');
      if (performanceMode) {
        performanceMode.checked = this.currentConfig.advanced.performanceMode;
        performanceMode.addEventListener('change', (e) => {
          this.currentConfig.advanced.performanceMode = e.target.checked;
        });
      }
    }

    setupFooterActions() {
      // Apply configuration
      document.getElementById('apply-config').addEventListener('click', () => {
        this.applyConfiguration();
      });

      // Export settings
      document.getElementById('export-settings').addEventListener('click', () => {
        this.exportSettings();
      });

      // Import settings
      document.getElementById('import-settings').addEventListener('click', () => {
        document.getElementById('import-file-input').click();
      });

      document.getElementById('import-file-input').addEventListener('change', (e) => {
        this.importSettings(e.target.files[0]);
      });

      // Reset settings
      document.getElementById('reset-settings').addEventListener('click', () => {
        if (confirm('Reset all settings to defaults? This cannot be undone.')) {
          this.resetToDefaults();
        }
      });

      // Clear all data
      document.getElementById('clear-all-data').addEventListener('click', () => {
        if (confirm('Clear all extension data? This will remove all settings and cannot be undone.')) {
          this.clearAllData();
        }
      });
    }

    async applyConfiguration() {
      const applyBtn = document.getElementById('apply-config');
      const originalText = applyBtn.textContent;
      
      try {
        applyBtn.textContent = '⏳ Applying...';
        applyBtn.disabled = true;

        // Save to storage
        await chrome.storage.local.set({ 'game-enhancement-config': this.currentConfig });

        // Send to content script
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        await chrome.tabs.sendMessage(tab.id, {
          type: 'APPLY_CONFIG',
          config: this.currentConfig
        });

        // Success feedback
        applyBtn.textContent = '✅ Applied!';
        applyBtn.style.background = '#22c55e';
        
        setTimeout(() => {
          applyBtn.textContent = originalText;
          applyBtn.style.background = '';
          applyBtn.disabled = false;
        }, 2000);

      } catch (error) {
        console.error('Failed to apply configuration:', error);
        
        applyBtn.textContent = '❌ Error';
        applyBtn.style.background = '#ef4444';
        
        setTimeout(() => {
          applyBtn.textContent = originalText;
          applyBtn.style.background = '';
          applyBtn.disabled = false;
        }, 2000);
      }
    }

    exportSettings() {
      const dataStr = JSON.stringify(this.currentConfig, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `game-enhancement-config-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }

    async importSettings(file) {
      if (!file) return;

      try {
        const text = await file.text();
        const config = JSON.parse(text);
        
        // Validate config structure
        if (this.validateConfig(config)) {
          this.currentConfig = config;
          this.updateUI();
          
          const notification = document.createElement('div');
          notification.className = 'import-notification success';
          notification.textContent = 'Settings imported successfully!';
          document.body.appendChild(notification);
          
          setTimeout(() => notification.remove(), 3000);
        } else {
          throw new Error('Invalid configuration file');
        }
      } catch (error) {
        console.error('Import failed:', error);
        
        const notification = document.createElement('div');
        notification.className = 'import-notification error';
        notification.textContent = 'Failed to import settings. Please check the file format.';
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
      }
    }

    validateConfig(config) {
      // Basic validation - check if required sections exist
      return config && 
             config.base && 
             config.lupus && 
             config.asura && 
             config.theme && 
             config.advanced;
    }

    async resetToDefaults() {
      this.currentConfig = this.getDefaultConfig();
      this.updateUI();
      
      // Save to storage
      await chrome.storage.local.set({ 'game-enhancement-config': this.currentConfig });
      
      const notification = document.createElement('div');
      notification.className = 'reset-notification';
      notification.textContent = 'Settings reset to defaults!';
      document.body.appendChild(notification);
      
      setTimeout(() => notification.remove(), 3000);
    }

    async clearAllData() {
      await chrome.storage.local.clear();
      this.currentConfig = this.getDefaultConfig();
      this.updateUI();
      
      const notification = document.createElement('div');
      notification.className = 'clear-notification';
      notification.textContent = 'All data cleared!';
      document.body.appendChild(notification);
      
      setTimeout(() => notification.remove(), 3000);
    }

    updateUI() {
      // Update feature checkboxes
      Object.entries(this.currentConfig.base).forEach(([feature, enabled]) => {
        if (feature !== 'enabled') {
          const checkbox = document.querySelector(`input[name="base-feature"][value="${feature}"]`);
          if (checkbox) checkbox.checked = enabled;
        }
      });

      Object.entries(this.currentConfig.lupus).forEach(([feature, enabled]) => {
        if (feature !== 'enabled') {
          const checkbox = document.querySelector(`input[name="lupus-feature"][value="${feature}"]`);
          if (checkbox) checkbox.checked = enabled;
        }
      });

      Object.entries(this.currentConfig.asura).forEach(([feature, enabled]) => {
        if (feature !== 'enabled') {
          const checkbox = document.querySelector(`input[name="asura-feature"][value="${feature}"]`);
          if (checkbox) checkbox.checked = enabled;
        }
      });

      // Update advanced settings
      const pinnedLimit = document.getElementById('pinned-items-limit');
      if (pinnedLimit) pinnedLimit.value = this.currentConfig.advanced.pinnedItemsLimit;

      const refreshInterval = document.getElementById('refresh-interval');
      if (refreshInterval) refreshInterval.value = this.currentConfig.advanced.refreshInterval;

      const debugMode = document.getElementById('debug-mode');
      if (debugMode) debugMode.checked = this.currentConfig.advanced.debugMode;

      const performanceMode = document.getElementById('performance-mode');
      if (performanceMode) performanceMode.checked = this.currentConfig.advanced.performanceMode;

      // Update color selections
      if (this.activeTab === 'customization') {
        this.loadColorPalettes();
      }

      this.updateFeatureCount();
    }

    updateFeatureCount() {
      let count = 0;
      
      // Count base features
      Object.values(this.currentConfig.base).forEach(enabled => {
        if (enabled === true) count++;
      });
      
      // Count lupus features
      Object.entries(this.currentConfig.lupus).forEach(([key, enabled]) => {
        if (key !== 'enabled' && enabled === true) count++;
      });
      
      // Count asura features
      Object.entries(this.currentConfig.asura).forEach(([key, enabled]) => {
        if (key !== 'enabled' && enabled === true) count++;
      });

      const countElement = document.getElementById('active-features-count');
      if (countElement) countElement.textContent = count;
    }

    async updateStatus() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'GET_PAGE_INFO'
        });

        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');

        if (response && response.page) {
          statusIndicator.className = 'status-indicator active';
          statusText.textContent = `Active on ${response.page} page`;
        } else {
          statusIndicator.className = 'status-indicator inactive';
          statusText.textContent = 'Not on game page';
        }
      } catch (error) {
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        
        statusIndicator.className = 'status-indicator inactive';
        statusText.textContent = 'Extension inactive';
      }
    }
  }

  // Initialize popup when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
  });
})();