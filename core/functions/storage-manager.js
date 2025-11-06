// Zentrales Settings Management
(function() {
  'use strict';

  class StorageManager {
    static STORAGE_KEY = 'game-enhancement-config';
    static DEFAULT_CONFIG = {
      base: {
        enabled: true,
        sidebar: true,
        wave_mods: true,
        battle_mods: true,
        inventory_mods: true,
        stats_mods: true,
        pvp_mods: true,
        pets_mods: true,
        event_mods: true,
        monster_filters: true,
        loot_collection: true,
        gate_collapse: true
      },
      lupus: {
        enabled: false,
        enhancedSidebar: false,
        submenus: false,
        rankDetection: false,
        timeFormat24h: false,
        levelGateSwitch: false
      },
      asura: {
        enabled: false,
        advancedSidebar: false,
        advancedSettings: false,
        quickAccess: false,
        advancedFilters: false,
        statAllocation: false,
        waveAutoRefresh: false,
        battlePrediction: false,
        customBackgrounds: false,
        petNaming: false,
        lootHighlighting: false,
        menuCustomization: false,
        debugTools: false
      },
      theme: {
        sidebarColor: 'dark-blue',
        backgroundColor: 'black'
      },
      advanced: {
        pinnedItemsLimit: 3,
        refreshInterval: 60,
        debugMode: false
      }
    };

    static async getConfiguration() {
      try {
        const result = await chrome.storage.local.get(this.STORAGE_KEY);
        const saved = result[this.STORAGE_KEY];
        
        if (saved) {
          // Merge mit Default-Config für neue Features
          return this.mergeConfigs(this.DEFAULT_CONFIG, saved);
        } else {
          // Erste Nutzung - speichere Default-Config
          await this.saveConfiguration(this.DEFAULT_CONFIG);
          return this.DEFAULT_CONFIG;
        }
      } catch (error) {
        console.error('Error loading configuration:', error);
        return this.DEFAULT_CONFIG;
      }
    }

    static async saveConfiguration(config) {
      try {
        await chrome.storage.local.set({ [this.STORAGE_KEY]: config });
        return true;
      } catch (error) {
        console.error('Error saving configuration:', error);
        return false;
      }
    }

    static async updateFeature(category, feature, enabled) {
      const config = await this.getConfiguration();
      if (config[category]) {
        config[category][feature] = enabled;
        return await this.saveConfiguration(config);
      }
      return false;
    }

    static async updateTheme(sidebarColor, backgroundColor) {
      const config = await this.getConfiguration();
      config.theme = {
        sidebarColor: sidebarColor || config.theme.sidebarColor,
        backgroundColor: backgroundColor || config.theme.backgroundColor
      };
      return await this.saveConfiguration(config);
    }

    static async resetToDefaults() {
      return await this.saveConfiguration(this.DEFAULT_CONFIG);
    }

    static async clearAllData() {
      try {
        await chrome.storage.local.remove(this.STORAGE_KEY);
        return true;
      } catch (error) {
        console.error('Error clearing data:', error);
        return false;
      }
    }

    static mergeConfigs(defaultConfig, savedConfig) {
      const merged = JSON.parse(JSON.stringify(defaultConfig));
      
      for (const [category, features] of Object.entries(savedConfig)) {
        if (merged[category]) {
          for (const [feature, value] of Object.entries(features)) {
            if (merged[category].hasOwnProperty(feature)) {
              merged[category][feature] = value;
            }
          }
        }
      }
      
      return merged;
    }

    // Legacy storage migration
    static async migrateLegacySettings() {
      try {
        // Migration von Asura's settings
        const asuraSettings = localStorage.getItem('demonGameExtensionSettings');
        const lupusSettings = this.getLegacyCookieSettings();
        
        if (asuraSettings || lupusSettings) {
          const config = await this.getConfiguration();
          
          if (asuraSettings) {
            const parsed = JSON.parse(asuraSettings);
            config.theme.sidebarColor = this.mapLegacyColor(parsed.sidebarColor);
            config.theme.backgroundColor = this.mapLegacyColor(parsed.backgroundColor);
            config.asura.enabled = true;
            config.asura.advancedSidebar = true;
          }
          
          if (lupusSettings) {
            config.lupus.enabled = true;
            config.lupus.submenus = lupusSettings.submenus;
            config.lupus.timeFormat24h = lupusSettings.timeFormat24h;
          }
          
          await this.saveConfiguration(config);
          
          // Cleanup legacy storage
          localStorage.removeItem('demonGameExtensionSettings');
          this.clearLegacyCookies();
        }
      } catch (error) {
        console.warn('Legacy migration failed:', error);
      }
    }

    static getLegacyCookieSettings() {
      const cookies = document.cookie.split(';');
      const settings = {};
      
      cookies.forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name.startsWith('submenu_')) {
          settings.submenus = true;
        }
        if (name === 'timeFormat24h') {
          settings.timeFormat24h = value === 'true';
        }
      });
      
      return Object.keys(settings).length > 0 ? settings : null;
    }

    static mapLegacyColor(hexColor) {
      const ColorPalette = window.GameEnhancement?.ColorPalette;
      if (!ColorPalette) return 'dark-blue';
      
      const sidebarColor = ColorPalette.SIDEBAR_COLORS.find(c => c.value === hexColor);
      const backgroundColor = ColorPalette.BACKGROUND_COLORS.find(c => c.value === hexColor);
      
      return sidebarColor?.id || backgroundColor?.id || 'dark-blue';
    }

    static clearLegacyCookies() {
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const name = cookie.trim().split('=')[0];
        if (name.startsWith('submenu_') || name === 'timeFormat24h') {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
      });
    }
  }

  // Global verfügbar machen
  window.GameEnhancement = window.GameEnhancement || {};
  window.GameEnhancement.StorageManager = StorageManager;
})();