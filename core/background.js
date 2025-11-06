/**
 * DemonGame Addon Manager - Background Service Worker
 * Handles extension lifecycle, storage, and cross-tab communication
 */

// Extension lifecycle
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('🎯 DemonGame Addon Manager installed/updated');
  
  if (details.reason === 'install') {
    await initializeExtension();
  } else if (details.reason === 'update') {
    await handleExtensionUpdate(details.previousVersion);
  }
});

chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 DemonGame Addon Manager started');
});

// Initialize extension with default settings
async function initializeExtension() {
  try {
    const defaultSettings = {
      version: '0.1.0',
      theme: 'dark',
      debugMode: false,
      lastModuleScan: null,
      activeModules: {},
      moduleSettings: {},
      globalSettings: {
        performance: {
          maxActiveModules: 20,
          lazyLoading: true,
          debugMode: false
        },
        ui: {
          showNotifications: true,
          animationsEnabled: true,
          compactMode: false
        }
      }
    };
    
    await chrome.storage.local.set(defaultSettings);
    console.log('✅ Extension initialized with default settings');
  } catch (error) {
    console.error('❌ Failed to initialize extension:', error);
  }
}

// Handle extension updates
async function handleExtensionUpdate(previousVersion) {
  try {
    console.log(`📦 Updating from version ${previousVersion} to 0.1.0`);
    
    // Migration logic here if needed
    const settings = await chrome.storage.local.get();
    settings.version = '0.1.0';
    
    await chrome.storage.local.set(settings);
    console.log('✅ Extension updated successfully');
  } catch (error) {
    console.error('❌ Failed to update extension:', error);
  }
}

// Message handling for cross-tab communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message, sender) {
  try {
    switch (message.type) {
      case 'SCAN_MODULES':
        return await scanModules();
      
      case 'RELOAD_MODULE':
        return await reloadModule(message.moduleId);
      
      case 'GET_MODULE_STATUS':
        return await getModuleStatus(message.moduleId);
      
      case 'TOGGLE_MODULE':
        return await toggleModule(message.moduleId, message.enabled);
      
      case 'GET_SETTINGS':
        return await chrome.storage.local.get();
      
      case 'UPDATE_SETTINGS':
        await chrome.storage.local.set(message.settings);
        return { success: true };
      
      case 'ENTER_SAFE_MODE':
        return await enterSafeMode();
      
      default:
        console.warn('Unknown message type:', message.type);
        return { error: 'Unknown message type' };
    }
  } catch (error) {
    console.error('❌ Error handling message:', error);
    return { error: error.message };
  }
}

// Module management functions
async function scanModules() {
  try {
    console.log('🔍 Scanning for modules...');
    
    // This would normally scan the file system
    // For now, we'll return a placeholder result
    const modules = {
      'battle-pass': {
        id: 'battle-pass',
        name: 'Battle Pass Auto-Scroll',
        category: 'base',
        version: '1.0.0',
        enabled: false,
        status: 'ready'
      }
    };
    
    await chrome.storage.local.set({ 
      modules,
      lastModuleScan: Date.now()
    });
    
    console.log('✅ Module scan complete:', Object.keys(modules).length, 'modules found');
    return { success: true, count: Object.keys(modules).length };
  } catch (error) {
    console.error('❌ Module scan failed:', error);
    return { error: error.message };
  }
}

async function toggleModule(moduleId, enabled) {
  try {
    const { modules = {} } = await chrome.storage.local.get('modules');
    
    if (!modules[moduleId]) {
      throw new Error(`Module ${moduleId} not found`);
    }
    
    modules[moduleId].enabled = enabled;
    modules[moduleId].status = enabled ? 'active' : 'disabled';
    
    await chrome.storage.local.set({ modules });
    
    console.log(`🔄 Module ${moduleId} ${enabled ? 'enabled' : 'disabled'}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to toggle module:', error);
    return { error: error.message };
  }
}

async function reloadModule(moduleId) {
  try {
    // Send message to content script to reload specific module
    const tabs = await chrome.tabs.query({ 
      url: ['*://demonicscans.org/*', '*://*.demonicscans.org/*'] 
    });
    
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'RELOAD_MODULE',
        moduleId
      }).catch(() => {}); // Ignore errors if content script not ready
    }
    
    console.log(`🔄 Module ${moduleId} reload signal sent`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to reload module:', error);
    return { error: error.message };
  }
}

async function getModuleStatus(moduleId) {
  try {
    const { modules = {} } = await chrome.storage.local.get('modules');
    return { status: modules[moduleId]?.status || 'not-found' };
  } catch (error) {
    return { error: error.message };
  }
}

async function enterSafeMode() {
  try {
    const { modules = {} } = await chrome.storage.local.get('modules');
    
    // Disable all non-critical modules
    for (const moduleId in modules) {
      if (!modules[moduleId].critical) {
        modules[moduleId].enabled = false;
        modules[moduleId].status = 'safe-mode';
      }
    }
    
    await chrome.storage.local.set({ 
      modules,
      safeMode: true,
      safeModeTimestamp: Date.now()
    });
    
    console.log('🛡️ Safe mode enabled');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to enter safe mode:', error);
    return { error: error.message };
  }
}

// Error reporting
chrome.runtime.onSuspend.addListener(() => {
  console.log('💤 DemonGame Addon Manager suspended');
});
