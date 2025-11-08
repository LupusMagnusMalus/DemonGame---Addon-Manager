// Tab Loader - Fully Dynamic Tab Discovery System
class TabLoader {
  constructor() {
    this.tabs = [];
    this.loadedTabs = new Map();
    this.loadedScripts = new Set();
    this.baseTabPath = './tabs/';
    this.tabsBasePath = 'core/popup/tabs/';
  }

  /**
   * Auto-discover all available tabs by scanning for HTML files
   */
  async discoverTabs() {
    console.log('🔍 Auto-discovering tabs...');
    
    const discoveredTabs = [];
    
    // Method 1: Try to scan known tab possibilities
    const potentialTabs = [
      'modules', 'theme', 'about', 'settings', 
      'notifications', 'help', 'debug', 'logs'
    ];
    
    for (const tabId of potentialTabs) {
      try {
        // Check if HTML file exists
        const htmlExists = await this.checkFileExists(`${this.tabsBasePath}${tabId}.html`);
        
        if (htmlExists) {
          // Try to load metadata
          const metadata = await this.loadTabMetadata(tabId);
          discoveredTabs.push({
            id: tabId,
            ...metadata
          });
          console.log(`✅ Tab discovered: ${tabId}`);
        }
      } catch (error) {
        // Tab doesn't exist or failed to load, skip silently
        console.log(`⏭️ Tab ${tabId} not available`);
      }
    }
    
    // Sort tabs by order field
    discoveredTabs.sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 999;
      const orderB = b.order !== undefined ? b.order : 999;
      return orderA - orderB;
    });
    
    this.tabs = discoveredTabs;
    console.log(`✅ Discovered ${this.tabs.length} tabs:`, this.tabs.map(t => `${t.name}(${t.order})`));
    
    return this.tabs;
  }

  /**
   * Check if a file exists by attempting to fetch it
   */
  async checkFileExists(path) {
    try {
      const response = await fetch(chrome.runtime.getURL(path));
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Load tab metadata with fallbacks
   */
  async loadTabMetadata(tabId) {
    // Default metadata
    const fallbackMetadata = {
      name: this.capitalizeFirst(tabId),
      icon: this.getDefaultIcon(tabId),
      order: 999,
      description: `${this.capitalizeFirst(tabId)} tab`
    };
    
    try {
      // Try to load from JSON file
      const metadataPath = `${this.tabsBasePath}${tabId}.json`;
      const response = await fetch(chrome.runtime.getURL(metadataPath));
      
      if (response.ok) {
        const metadata = await response.json();
        return { ...fallbackMetadata, ...metadata };
      }
    } catch (error) {
      console.log(`ℹ️ No metadata for ${tabId}, using fallback`);
    }
    
    return fallbackMetadata;
  }

  /**
   * Get default icon for tab based on name
   */
  getDefaultIcon(tabId) {
    const iconMap = {
      modules: '📦',
      theme: '🎨', 
      about: 'ℹ️',
      settings: '⚙️',
      notifications: '🔔',
      help: '❓',
      debug: '🐛',
      logs: '📝'
    };
    return iconMap[tabId] || '📄';
  }

  /**
   * Capitalize first letter
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Load tab content
   */
  async loadTab(tabId) {
    console.log(`📂 Loading tab: ${tabId}`);
    
    if (this.loadedTabs.has(tabId)) {
      console.log(`♻️ Tab ${tabId} already loaded, using cache`);
      return this.loadedTabs.get(tabId);
    }
    
    try {
      // Load HTML
      const htmlPath = `${this.tabsBasePath}${tabId}.html`;
      const response = await fetch(chrome.runtime.getURL(htmlPath));
      
      if (!response.ok) {
        throw new Error(`Failed to load ${htmlPath}: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Load CSS (optional)
      await this.loadCSS(tabId);
      
      // Load JS (optional)
      await this.loadJS(tabId);
      
      // Cache the HTML
      this.loadedTabs.set(tabId, html);
      
      console.log(`✅ Tab ${tabId} fully loaded`);
      return html;
      
    } catch (error) {
      console.error(`❌ Error loading tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Load CSS file for tab
   */
  async loadCSS(tabId) {
    try {
      const cssPath = `${this.tabsBasePath}${tabId}.css`;
      const response = await fetch(chrome.runtime.getURL(cssPath));
      
      if (response.ok) {
        const css = await response.text();
        
        let styleSheet = document.getElementById(`tab-style-${tabId}`);
        if (!styleSheet) {
          styleSheet = document.createElement('style');
          styleSheet.id = `tab-style-${tabId}`;
          styleSheet.textContent = css;
          document.head.appendChild(styleSheet);
          console.log(`✅ CSS loaded for ${tabId}`);
        }
      }
    } catch (error) {
      console.log(`ℹ️ No CSS for ${tabId}`);
    }
  }

  /**
   * Load JavaScript file for tab
   */
  async loadJS(tabId) {
    if (this.loadedScripts.has(tabId)) {
      console.log(`♻️ JS already loaded for ${tabId}`);
      return;
    }
    
    try {
      const jsPath = `${this.tabsBasePath}${tabId}.js`;
      const response = await fetch(chrome.runtime.getURL(jsPath));
      
      if (response.ok) {
        const script = document.createElement('script');
        script.id = `tab-script-${tabId}`;
        script.src = chrome.runtime.getURL(jsPath);
        script.type = 'text/javascript';
        
        await new Promise((resolve, reject) => {
          script.onload = () => {
            console.log(`✅ JS loaded for ${tabId}`);
            this.loadedScripts.add(tabId);
            resolve();
          };
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }
    } catch (error) {
      console.log(`ℹ️ No JS for ${tabId}`);
    }
  }

  /**
   * Unload tab and cleanup
   */
  unloadTab(tabId) {
    // Execute cleanup function if available
    const cleanupFn = window[`cleanup_${tabId}`];
    if (typeof cleanupFn === 'function') {
      try {
        cleanupFn();
        console.log(`🧹 Cleanup executed for ${tabId}`);
      } catch (error) {
        console.error(`❌ Cleanup error for ${tabId}:`, error);
      }
    }
    
    // Remove from tracking
    this.loadedScripts.delete(tabId);
    
    // Remove CSS
    const styleSheet = document.getElementById(`tab-style-${tabId}`);
    if (styleSheet) {
      styleSheet.remove();
    }
    
    // Remove script (optional, as it's already executed)
    const script = document.getElementById(`tab-script-${tabId}`);
    if (script) {
      script.remove();
    }
  }

  /**
   * Get all discovered tabs metadata
   */
  getTabList() {
    return this.tabs;
  }

  /**
   * Get tab by ID
   */
  getTab(tabId) {
    return this.tabs.find(tab => tab.id === tabId);
  }
}

window.TabLoader = TabLoader;
