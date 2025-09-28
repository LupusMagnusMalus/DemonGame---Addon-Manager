// Service Worker for Extension
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🎮 Game Enhancement Manager installed');
  
  if (details.reason === 'install') {
    // First Installation
    console.log('First time installation');

    // Open setup page or show welcome notification
    chrome.tabs.create({
      url: 'https://game.demonicscans.org'
    });
  } else if (details.reason === 'update') {
    // Update from previous version
    console.log('Extension updated');

    // Migration of old settings if necessary
    migrateOldSettings();
  }
});

// Migration of old settings
async function migrateOldSettings() {
  try {
    // Check for old Asura settings
    const asuraSettings = await chrome.storage.local.get('demonGameExtensionSettings');
    
    if (asuraSettings.demonGameExtensionSettings) {
      console.log('Migrating Asura settings...');
      
      const oldSettings = asuraSettings.demonGameExtensionSettings;
      const newConfig = {
        base: { enabled: true, sidebar: false }, // Disable base sidebar if Asura was active
        lupus: { enabled: false },
        asura: {
          enabled: true,
          advancedSidebar: true,
          advancedSettings: true,
          quickAccess: true
        },
        theme: {
          sidebarColor: mapColorToId(oldSettings.sidebarColor),
          backgroundColor: mapColorToId(oldSettings.backgroundColor)
        },
        advanced: {
          pinnedItemsLimit: oldSettings.pinnedItemsLimit || 3,
          refreshInterval: 60,
          debugMode: false
        }
      };
      
      await chrome.storage.local.set({ 'game-enhancement-config': newConfig });
      console.log('Asura settings migrated successfully');
    }

    // Cleanup old settings
    await chrome.storage.local.remove('demonGameExtensionSettings');
    
  } catch (error) {
    console.warn('Settings migration failed:', error);
  }
}

function mapColorToId(hexColor) {
  const colorMap = {
    '#1e1e2e': 'dark-blue',
    '#2d2d3d': 'dark-gray',
    '#1a1a2e': 'night-blue',
    '#16213e': 'navy',
    '#0f3460': 'ocean',
    '#533483': 'purple',
    '#7209b7': 'violet',
    '#2d1b69': 'deep-purple',
    '#0b6623': 'forest',
    '#654321': 'brown',
    '#8b0000': 'dark-red',
    '#000000': 'black'
  };
  
  return colorMap[hexColor] || 'dark-blue';
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  switch (message.type) {
    case 'GET_EXTENSION_INFO':
      sendResponse({
        version: chrome.runtime.getManifest().version,
        name: chrome.runtime.getManifest().name
      });
      break;
      
    case 'OPEN_OPTIONS':
      chrome.runtime.openOptionsPage();
      break;
      
    case 'RELOAD_EXTENSION':
      chrome.runtime.reload();
      break;
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
  
  return true; // Keep message channel open for async response
});

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('game.demonicscans.org')) {
    console.log('Game page loaded, content script should be active');
  }
});

// Context menu items (optional)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'openEnhancementManager',
    title: 'Open Enhancement Manager',
    contexts: ['page'],
    documentUrlPatterns: ['https://game.demonicscans.org/*']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'openEnhancementManager') {
    chrome.action.openPopup();
  }
});

// Periodic cleanup and maintenance
setInterval(async () => {
  // Cleanup old data, check for updates, etc.
  console.log('🧹 Periodic maintenance...');
  
  try {
    // Remove old localStorage entries if they exist
    const tabs = await chrome.tabs.query({ url: 'https://game.demonicscans.org/*' });
    
    for (const tab of tabs) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // Cleanup old localStorage entries
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.startsWith('submenu_') || key === 'demonGameExtensionSettings')) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
          }
        });
      } catch (error) {
        // Tab might not be accessible, ignore
      }
    }
  } catch (error) {
    console.warn('Maintenance task failed:', error);
  }
}, 30 * 60 * 1000); // Every 30 minutes