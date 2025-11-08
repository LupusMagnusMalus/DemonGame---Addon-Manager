// Small addition to existing popup.js for improved TabLoader compatibility
// Add this method to your PopupManager class:

/**
 * Load tab content using improved TabLoader with fallbacks
 */
async loadTabWithLoader(tabName) {
  try {
    const tabPane = document.getElementById(`${tabName}Tab`);
    if (!tabPane) {
      console.warn(`Tab pane not found: ${tabName}Tab`);
      return;
    }
    
    // Skip if already loaded and contains content
    if (tabPane.dataset.loaded === 'true' && tabPane.innerHTML.trim()) {
      console.log(`♻️ Tab ${tabName} already loaded`);
      return;
    }
    
    // Show loading state
    tabPane.innerHTML = '<div class="loading-placeholder">Loading...</div>';
    
    let html;
    
    try {
      // Try to load tab using TabLoader (with metadata)
      html = await this.tabLoader.loadTab(tabName);
    } catch (metadataError) {
      console.log(`📄 Metadata loading failed, trying direct method for ${tabName}`);
      
      try {
        // Fallback to direct loading
        html = await this.tabLoader.loadTabDirect(tabName);
      } catch (directError) {
        console.log(`📄 Direct loading failed, trying chrome.runtime.getURL for ${tabName}`);
        
        // Final fallback: direct fetch
        const response = await fetch(chrome.runtime.getURL(`core/popup/tabs/${tabName}.html`));
        if (response.ok) {
          html = await response.text();
          
          // Also load CSS if available
          try {
            const cssResponse = await fetch(chrome.runtime.getURL(`core/popup/tabs/${tabName}.css`));
            if (cssResponse.ok) {
              const css = await cssResponse.text();
              let styleSheet = document.getElementById(`tab-style-${tabName}`);
              if (!styleSheet) {
                styleSheet = document.createElement('style');
                styleSheet.id = `tab-style-${tabName}`;
                styleSheet.textContent = css;
                document.head.appendChild(styleSheet);
              }
            }
          } catch (cssError) {
            // CSS loading optional
            console.log(`ℹ️ No CSS for ${tabName}`);
          }
          
          // Also load JS if available
          try {
            const jsResponse = await fetch(chrome.runtime.getURL(`core/popup/tabs/${tabName}.js`));
            if (jsResponse.ok) {
              const script = document.createElement('script');
              script.src = chrome.runtime.getURL(`core/popup/tabs/${tabName}.js`);
              script.type = 'text/javascript';
              script.id = `tab-script-${tabName}`;
              document.body.appendChild(script);
            }
          } catch (jsError) {
            // JS loading optional
            console.log(`ℹ️ No JS for ${tabName}`);
          }
        } else {
          throw new Error(`Failed to load ${tabName}.html: ${response.status}`);
        }
      }
    }
    
    // Update tab content
    tabPane.innerHTML = html;
    tabPane.dataset.loaded = 'true';
    
    // Initialize tab controller if available
    await this.initializeTabController(tabName);
    
    console.log(`✅ Tab ${tabName} loaded successfully`);
    
  } catch (error) {
    console.error(`Failed to load tab ${tabName}:`, error);
    
    const tabPane = document.getElementById(`${tabName}Tab`);
    if (tabPane) {
      tabPane.innerHTML = `
        <div class="error-placeholder">
          <div class="error-icon">❌</div>
          <div class="error-title">Failed to load ${tabName}</div>
          <div class="error-message">${error.message}</div>
          <button onclick="window.popupManager.loadTabWithLoader('${tabName}')" 
                  style="margin-top: 12px; padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Retry
          </button>
        </div>
      `;
    }
  }
}

// Usage note:
// Replace the existing loadTabWithLoader method in your PopupManager class with this improved version
// This version provides multiple fallback layers for robust tab loading
