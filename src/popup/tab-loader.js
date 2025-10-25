// Tab Loader - Dynamic Tab Loading System
class TabLoader {
  constructor() {
    this.tabs = [];
    this.loadedTabs = new Map();
    this.baseTabPath = './tabs/'; // Relativ zu popup.html
  }

  async discoverTabs() {
    console.log('🔍 Discovering tabs...');
    
    // Liste aller verfügbaren Tabs
    const tabIds = ['settings', 'notifications', 'themes', 'asura', 'about'];
    
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
    
    // Check if already loaded
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
      const cssPath = `${this.baseTabPath}${tabId}.css`;
      console.log(`🎨 Loading CSS from: ${cssPath}`);
      
      const cssResponse = await fetch(cssPath);
      if (cssResponse.ok) {
        const css = await cssResponse.text();
        
        // Check if stylesheet already exists
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
      
      // Load JS
      const jsPath = `${this.baseTabPath}${tabId}.js`;
      console.log(`⚙️ Loading JS from: ${jsPath}`);
      
      const jsResponse = await fetch(jsPath);
      if (jsResponse.ok) {
        const js = await jsResponse.text();
        
        // Check if script already exists
        if (!document.getElementById(`tab-script-${tabId}`)) {
          const script = document.createElement('script');
          script.id = `tab-script-${tabId}`;
          script.textContent = js;
          document.body.appendChild(script);
          console.log(`✅ JS loaded for ${tabId}`);
        }
      } else {
        console.warn(`⚠️ No JS file for ${tabId}`);
      }
      
      // Cache the HTML
      this.loadedTabs.set(tabId, html);
      
      console.log(`✅ Tab ${tabId} fully loaded`);
      return html;
      
    } catch (error) {
      console.error(`❌ Error loading tab ${tabId}:`, error);
      throw error;
    }
  }

  unloadTab(tabId) {
    // Call cleanup function if exists
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

// Export
window.TabLoader = TabLoader;