// Haupt-Content-Script das alle Module orchestriert
(async function() {
  'use strict';
/*
  // Import shared utilities
  await import(chrome.runtime.getURL('core/utils.js'));
  await import(chrome.runtime.getURL('core/storage-manager.js'));
  await import(chrome.runtime.getURL('core/feature-manager.js'));
  await import(chrome.runtime.getURL('core/notification-system.js'));
*/

  class AddonManager {
    constructor() {
      this.config = null;
      this.loadedModules = new Map();
      this.currentPage = this.detectPage();
      this.initialize();
    }

    detectPage() {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      
      if (path.includes('active_wave.php')) return 'wave';
      if (path.includes('battle.php')) return 'battle';
      if (path.includes('inventory.php')) return 'inventory';
      if (path.includes('pvp.php')) return 'pvp';
      if (path.includes('stats.php')) return 'stats';
      if (path.includes('pets.php')) return 'pets';
      if (path.includes('merchant.php')) return 'merchant';
      if (path.includes('blacksmith.php')) return 'blacksmith';
      if (path.includes('event.php')) return 'event';
      if (path.includes('battle_pass.php')) return 'battle_pass';
      if (path.includes('legendary_forge.php')) return 'legendary_forge';
      return 'dashboard';
    }

    async initialize() {
      console.log('🎮 Initializing Game Enhancement Manager v3.0');
      
      // Prüfe ob wir auf der Game-Seite sind
      if (!document.querySelector('.game-topbar')) {
        console.log('Not on game page, skipping initialization');
        return;
      }

      // Lade Konfiguration
      const config = await this.getActiveConfig();
      await this.applyConfiguration(config);
      
      // Message Listener für Popup
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
      });

      console.log('✅ Game Enhancement Manager initialized');
    }

    async getActiveConfig() {
      const StorageManager = window.GameEnhancement.StorageManager;
      return await StorageManager.getConfiguration();
    }

    async applyConfiguration(config) {
      console.log('🔧 Applying configuration:', config);
      
      // Cleanup vorherige Module
      await this.cleanup();
      
      // Core Features (immer aktiv)
      await this.loadCoreFeatures();
      
      // Base Features (GonBruck)
      if (config.base && config.base.enabled) {
        await this.loadBaseFeatures(config.base);
      }
      
      // Lupus Enhancements
      if (config.lupus && config.lupus.enabled) {
        await this.loadLupusFeatures(config.lupus);
      }
      
      // Asura Advanced Features
      if (config.asura && config.asura.enabled) {
        await this.loadAsuraFeatures(config.asura);
      }
      
      // Apply Color Theme
      if (config.theme) {
        await this.applyTheme(config.theme);
      }

      this.config = config;
    }

    async loadCoreFeatures() {
      // Immer geladene Core-Features
      await this.loadCSS('core/color-palette.css');
      await this.loadScript('core/color-palette.js');
      
      // Favicon Fix (immer aktiv)
      await this.loadScript('base/core/favicon-fix.js');
    }

    async loadBaseFeatures(baseConfig) {
      // Base CSS
      await this.loadCSS('base/styles/common.css');
      
      // Sidebar (fast immer gewünscht)
      if (baseConfig.sidebar) {
        await this.loadCSS('base/styles/sidebar.css');
        await this.loadScript('base/modules/sidebar.js');
      }

      // Page-spezifische Module
      const pageModules = {
        'wave': ['wave-mods.js', 'monster-filters.js', 'loot-collection.js', 'gate-collapse.js'],
        'battle': ['battle-mods.js'],
        'inventory': ['inventory-mods.js'],
        'stats': ['stats-mods.js'],
        'pvp': ['pvp-mods.js'],
        'pets': ['pets-mods.js'],
        'event': ['event-mods.js'],
        'merchant': ['merchant-mods.js'],
        'blacksmith': ['blacksmith-mods.js'],
        'battle_pass': ['battle-pass.js'],
        'legendary_forge': ['legendary-forge-mods.js']
      };

      const modules = pageModules[this.currentPage] || [];
      for (const module of modules) {
        if (baseConfig[module.replace('.js', '').replace('-', '_')]) {
          await this.loadScript(`base/modules/${module}`);
          // Lade entsprechende CSS falls vorhanden
          const cssFile = module.replace('.js', '.css');
          await this.loadCSS(`base/styles/${cssFile}`);
        }
      }
    }

    async loadLupusFeatures(lupusConfig) {
      await this.loadCSS('addons/lupus-enhancements/styles/enhanced-sidebar.css');

      // Enhanced Sidebar mit Submenus
      if (lupusConfig.enhancedSidebar) {
        await this.loadScript('addons/lupus-enhancements/modules/enhanced-sidebar.js');
      }

      // Submenu System
      if (lupusConfig.submenus) {
        await this.loadCSS('addons/lupus-enhancements/styles/submenu.css');
        await this.loadScript('addons/lupus-enhancements/modules/submenu-manager.js');
      }

      // Rank Detection
      if (lupusConfig.rankDetection) {
        await this.loadCSS('addons/lupus-enhancements/styles/rank-detection.css');
        await this.loadScript('addons/lupus-enhancements/modules/rank-detection.js');
      }

      // 24h Time Format (popup-gesteuert)
      if (lupusConfig.timeFormat24h) {
        await this.loadCSS('addons/lupus-enhancements/styles/server-time.css');
        await this.loadScript('base/core/time-format.js');
        await this.loadScript('addons/lupus-enhancements/modules/server-time-display.js');
      }

      // Level-based Gate Switching
      if (lupusConfig.levelGateSwitch) {
        await this.loadScript('addons/lupus-enhancements/modules/level-gate-switch.js');
      }

      if (lupusConfig.battlePass) {
        await this.loadScript('addons/lupus-enhancements/progressTrackScrollAction.js');
        await this.loadScript('addons/lupus-enhancements/battle-pass.js');
      }
    }

    async loadAsuraFeatures(asuraConfig) {
      // Cyberpunk Theme System
      await this.loadCSS('addons/asura-advanced/styles/cyberpunk-theme.css');
      
      // Advanced Sidebar (ersetzt Base Sidebar wenn aktiv)
      if (asuraConfig.advancedSidebar) {
        // Entferne Base Sidebar
        document.getElementById('game-sidebar')?.remove();
        
        await this.loadCSS('addons/asura-advanced/styles/advanced-sidebar.css');
        await this.loadScript('addons/asura-advanced/modules/advanced-sidebar.js');
      }

      // Settings Manager & Theme System
      if (asuraConfig.advancedSettings) {
        await this.loadCSS('addons/asura-advanced/styles/settings-modal.css');
        await this.loadScript('addons/asura-advanced/modules/settings-manager.js');
      }

      // Quick Access System
      if (asuraConfig.quickAccess) {
        await this.loadCSS('addons/asura-advanced/styles/quick-access.css');
        await this.loadScript('addons/asura-advanced/modules/quick-access-system.js');
      }

      // Advanced Monster Filters
      if (asuraConfig.advancedFilters) {
        await this.loadCSS('addons/asura-advanced/styles/advanced-filters.css');
        await this.loadScript('addons/asura-advanced/modules/advanced-monster-filters.js');
      }

      // Stat Allocation in Sidebar
      if (asuraConfig.statAllocation) {
        await this.loadCSS('addons/asura-advanced/styles/stat-allocation.css');
        await this.loadScript('addons/asura-advanced/modules/stat-allocation.js');
      }

      // Wave Auto-Refresh
      if (asuraConfig.waveAutoRefresh && this.currentPage === 'wave') {
        await this.loadScript('addons/asura-advanced/modules/wave-auto-refresh.js');
      }

      // PvP Battle Prediction
      if (asuraConfig.battlePrediction && this.currentPage === 'pvp') {
        await this.loadCSS('addons/asura-advanced/styles/battle-prediction.css');
        await this.loadScript('addons/asura-advanced/modules/pvp-battle-prediction.js');
      }

      // Custom Backgrounds
      if (asuraConfig.customBackgrounds) {
        await this.loadCSS('addons/asura-advanced/styles/custom-backgrounds.css');
        await this.loadScript('addons/asura-advanced/modules/custom-backgrounds.js');
      }

      // Pet Naming System
      if (asuraConfig.petNaming && this.currentPage === 'pets') {
        await this.loadCSS('addons/asura-advanced/styles/pet-naming.css');
        await this.loadScript('addons/asura-advanced/modules/pet-naming-system.js');
      }

      // Advanced Loot Highlighting
      if (asuraConfig.lootHighlighting) {
        await this.loadCSS('addons/asura-advanced/styles/loot-highlighting.css');
        await this.loadScript('addons/asura-advanced/modules/loot-highlighting.js');
      }

      // Menu Customization
      if (asuraConfig.menuCustomization) {
        await this.loadCSS('addons/asura-advanced/styles/menu-customization.css');
        await this.loadScript('addons/asura-advanced/modules/menu-customization.js');
      }

      // Debug Tools (Development only)
      if (asuraConfig.debugTools && window.location.hostname === 'localhost') {
        await this.loadScript('addons/asura-advanced/modules/debug-tools.js');
      }
    }

    async applyTheme(themeConfig) {
      const ColorPalette = window.GameEnhancement.ColorPalette;
      
      if (themeConfig.sidebarColor) {
        ColorPalette.applySidebarColor(themeConfig.sidebarColor);
      }
      
      if (themeConfig.backgroundColor) {
        ColorPalette.applyBackgroundColor(themeConfig.backgroundColor);
      }
    }

    async loadScript(path) {
      return new Promise((resolve, reject) => {
      // Check if already loaded
      if (this.loadedModules.has(path)) {
        console.log(`♻️ Script already loaded: ${path}`);
        resolve();
        return;
      }
    
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL(path);
      script.dataset.enhancementManager = path;
    
      script.onload = () => {
        this.loadedModules.set(path, script);
        console.log(`✅ Loaded: ${path}`);
        resolve();
      };
    
      script.onerror = (error) => {
        console.warn(`⚠️ Could not load ${path}:`, error);
        reject(error);
      };
    
      document.head.appendChild(script);
      });
    }

    async loadCSS(path) {
      return new Promise((resolve, reject) => {
      // Check if already loaded
      if (this.loadedModules.has(path)) {
        console.log(`♻️ CSS already loaded: ${path}`);
        resolve();
        return;
      }
    
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = chrome.runtime.getURL(path);
      link.dataset.enhancementManager = path;
    
      link.onload = () => {
        this.loadedModules.set(path, link);
        console.log(`✅ Loaded CSS: ${path}`);
        resolve();
      };
    
      link.onerror = (error) => {
        console.warn(`⚠️ Could not load CSS ${path}:`, error);
        reject(error);
      };
    
      document.head.appendChild(link);
    });
  }

    async cleanup() {
      // Entferne alle geladenen Module
      this.loadedModules.forEach((element, path) => {
        element?.remove();
      });
      this.loadedModules.clear();
      
      // Entferne auch direkt injizierte Elemente
      document.querySelectorAll('[data-enhancement-manager]').forEach(el => el.remove());
    }

    async handleMessage(message, sender, sendResponse) {
      switch (message.type) {
        case 'APPLY_CONFIG':
          await this.applyConfiguration(message.config);
          sendResponse({ success: true });
          break;
          
        case 'GET_CURRENT_CONFIG':
          sendResponse({ config: this.config });
          break;
          
        case 'GET_PAGE_INFO':
          sendResponse({ 
            page: this.currentPage,
            url: window.location.href,
            loadedModules: Array.from(this.loadedModules.keys())
          });
          break;
          
        default:
          sendResponse({ error: 'Unknown message type' });
      }
    }
  }

  // Initialisiere den Manager
  window.gameEnhancementManager = new AddonManager();
})();