// Automatic Tab Discovery and Loading System
// Discovers tabs by attempting to load known tab files
class TabLoader {
  constructor() {
    this.tabs = [];
    this.tabsDirectory = 'popup/tabs/';
    this.knownTabs = [
      'settings',
      'notifications', 
      'asura',
      'about'
    ];
  }

  async discoverTabs() {
    const discoveredTabs = [];
    
    // Try to load each known tab
    for (const tabId of this.knownTabs) {
      try {
        const response = await fetch(chrome.runtime.getURL(`${this.tabsDirectory}${tabId}.html`));
        if (response.ok) {
          // Try to load metadata if exists
          const metadata = await this.loadTabMetadata(tabId);
          discoveredTabs.push({
            id: tabId,
            name: metadata.name || this.formatTabName(tabId),
            icon: metadata.icon || '📄',
            order: metadata.order || 999
          });
        }
      } catch (error) {
        // Tab doesn't exist, skip it
        console.log(`Tab ${tabId} not found, skipping`);
      }
    }
    
    this.tabs = discoveredTabs.sort((a, b) => a.order - b.order);
    return this.tabs;
  }

  async loadTabMetadata(tabId) {
    try {
      const response = await fetch(chrome.runtime.getURL(`${this.tabsDirectory}${tabId}.json`));
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // Metadata is optional
    }
    return {};
  }

  formatTabName(tabId) {
    return tabId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async loadTab(tabId) {
    const basePath = this.tabsDirectory + tabId;
    
    try {
      // Load HTML
      const htmlResponse = await fetch(chrome.runtime.getURL(`${basePath}.html`));
      const html = await htmlResponse.text();
      
      // Load CSS if exists
      await this.loadTabCSS(basePath);
      
      // Load JS if exists
      await this.loadTabJS(basePath);
      
      return html;
    } catch (error) {
      console.error(`Failed to load tab ${tabId}:`, error);
      throw error;
    }
  }

  async loadTabCSS(basePath) {
    try {
      const response = await fetch(chrome.runtime.getURL(`${basePath}.css`));
      if (response.ok) {
        const css = await response.text();
        const styleId = `tab-style-${basePath.split('/').pop()}`;
        
        // Remove old style if exists
        document.getElementById(styleId)?.remove();
        
        // Add new style
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
      }
    } catch (error) {
      // CSS is optional
      console.log(`No CSS found for ${basePath}`);
    }
  }

  async loadTabJS(basePath) {
    try {
      const response = await fetch(chrome.runtime.getURL(`${basePath}.js`));
      if (response.ok) {
        const js = await response.text();
        const scriptId = `tab-script-${basePath.split('/').pop()}`;
        
        // Remove old script if exists
        document.getElementById(scriptId)?.remove();
        
        // Add new script
        const script = document.createElement('script');
        script.id = scriptId;
        script.textContent = js;
        document.body.appendChild(script);
      }
    } catch (error) {
      // JS is optional
      console.log(`No JS found for ${basePath}`);
    }
  }

  unloadTab(tabId) {
    // Remove tab-specific styles and scripts
    document.getElementById(`tab-style-${tabId}`)?.remove();
    document.getElementById(`tab-script-${tabId}`)?.remove();
    
    // Call cleanup if exists
    if (window[`cleanup_${tabId}`]) {
      window[`cleanup_${tabId}`]();
      delete window[`cleanup_${tabId}`];
    }
  }
}

window.TabLoader = TabLoader;