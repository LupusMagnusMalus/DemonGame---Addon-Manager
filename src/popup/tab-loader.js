// Tab Loader - CSP-compliant Dynamic Tab Loading
class TabLoader {
  constructor() {
    this.tabs = [];
    this.loadedTabs = new Map();
    this.loadedScripts = new Set();
    this.baseTabPath = './tabs/';
  }

  async discoverTabs() {
    console.log('🔍 Discovering tabs...');
    
    const tabIds = ['settings', 'notifications', 'theme', 'asura', 'about'];
    
    for (const tabId of tabIds) {
      try {
        const metadataPath = `${this.baseTabPath}${tabId}.json`;
        console.log(`📋 Loading metadata for ${tabId} from ${metadataPath}`);
        
        const response = await fetch(metadataPath);
        if (!response.ok) {
          console.warn(`⚠️ Could not load ${tabId}.json:`, response.status);
          continue;
        }
        
        const metadata = await response.json();
        this.tabs.push({
          id: tabId,
          ...metadata
        });
        
        console.log(`✅ Tab registered: ${tabId}`);
      } catch (error) {
        console.warn(`⚠️ Failed to load tab ${tabId}:`, error);
      }
    }
    
    console.log(`✅ Discovered ${this.tabs.length} tabs:`, this.tabs.map(t => t.id));
    return this.tabs;
  }

  async loadTab(tabId) {
    console.log(`📂 Loading tab: ${tabId}`);
    
    if (this.loadedTabs.has(tabId)) {
      console.log(`♻️ Tab ${tabId} already loaded, using cache`);
      return this.loadedTabs.get(tabId);
    }
    
    try {
      // Load HTML
      const htmlPath = `${this.baseTabPath}${tabId}.html`;
      console.log(`📄 Loading HTML from: ${htmlPath}`);
      
      const htmlResponse = await fetch(htmlPath);
      if (!htmlResponse.ok) {
        throw new Error(`Failed to load ${htmlPath}: ${htmlResponse.status}`);
      }
      const html = await htmlResponse.text();
      
      // Load CSS
      await this.loadCSS(tabId);
      
      // Load JS (CSP-compliant)
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

  async loadCSS(tabId) {
    const cssPath = `${this.baseTabPath}${tabId}.css`;
    console.log(`🎨 Loading CSS from: ${cssPath}`);
    
    try {
      const cssResponse = await fetch(cssPath);
      if (cssResponse.ok) {
        const css = await cssResponse.text();
        
        let styleSheet = document.getElementById(`tab-style-${tabId}`);
        if (!styleSheet) {
          styleSheet = document.createElement('style');
          styleSheet.id = `tab-style-${tabId}`;
          styleSheet.textContent = css;
          document.head.appendChild(styleSheet);
          console.log(`✅ CSS loaded for ${tabId}`);
        }
      } else {
        console.warn(`⚠️ No CSS file for ${tabId}`);
      }
    } catch (error) {
      console.warn(`⚠️ CSS loading error for ${tabId}:`, error);
    }
  }

  async loadJS(tabId) {
    const jsPath = `${this.baseTabPath}${tabId}.js`;
    
    // Skip if already loaded
    if (this.loadedScripts.has(tabId)) {
      console.log(`♻️ JS already loaded for ${tabId}`);
      return;
    }
    
    console.log(`⚙️ Loading JS from: ${jsPath}`);
    
    try {
      const jsResponse = await fetch(jsPath);
      if (jsResponse.ok) {
        // Create script element with src attribute (CSP-compliant)
        const script = document.createElement('script');
        script.id = `tab-script-${tabId}`;
        script.src = jsPath;
        script.type = 'text/javascript';
        
        // Wait for script to load
        await new Promise((resolve, reject) => {
          script.onload = () => {
            console.log(`✅ JS loaded for ${tabId}`);
            this.loadedScripts.add(tabId);
            resolve();
          };
          script.onerror = (error) => {
            console.error(`❌ JS loading error for ${tabId}:`, error);
            reject(error);
          };
          
          document.body.appendChild(script);
        });
      } else {
        console.warn(`⚠️ No JS file for ${tabId}`);
      }
    } catch (error) {
      console.warn(`⚠️ JS loading error for ${tabId}:`, error);
    }
  }

  unloadTab(tabId) {
    const cleanupFn = window[`cleanup_${tabId}`];
    if (cleanupFn && typeof cleanupFn === 'function') {
      try {
        cleanupFn();
        console.log(`🧹 Cleanup executed for ${tabId}`);
      } catch (error) {
        console.error(`❌ Cleanup error for ${tabId}:`, error);
      }
    }
  }
}

window.TabLoader = TabLoader;