/**
 * DemonGame Addon Manager - Content Script
 * Main entry point for module loading and DOM manipulation
 */

// Global namespace for modules
window.GameEnhancement = {};

// Module system state
let moduleSystem = {
  loaded: new Map(),
  active: new Map(),
  settings: {},
  ready: false
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

async function initialize() {
  try {
    console.log('🎮 DemonGame Addon Manager - Content Script Loading');
    
    // Load core functions
    await loadCoreFunctions();
    
    // Setup global API
    setupGlobalAPI();
    
    // Load module system
    await initializeModuleSystem();
    
    // Load active modules
    await loadActiveModules();
    
    moduleSystem.ready = true;
    console.log('✅ DemonGame Addon Manager - Ready');
    
  } catch (error) {
    console.error('❌ Failed to initialize DemonGame Addon Manager:', error);
  }
}

// Load core functions dynamically
async function loadCoreFunctions() {
  const coreModules = [
    'storage-manager',
    'utils',
    'logger',
    'module-registry',
    'module-loader',
    'dependency-resolver',
    'notification-system',
    'color-palette'
  ];
  
  for (const module of coreModules) {
    try {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL(`core/functions/${module}.js`);
      script.type = 'module';
      document.head.appendChild(script);
      
      // Wait for script to load
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
      });
    } catch (error) {
      console.error(`❌ Failed to load core module ${module}:`, error);
    }
  }
}

// Setup global API for modules
function setupGlobalAPI() {
  window.GameEnhancement = {
    // Storage API
    storage: {
      get: async (keys) => {
        return await chrome.storage.local.get(keys);
      },
      set: async (items) => {
        return await chrome.storage.local.set(items);
      },
      getModuleConfig: async (moduleId) => {
        const { moduleSettings = {} } = await chrome.storage.local.get('moduleSettings');
        return moduleSettings[moduleId] || {};
      },
      setModuleConfig: async (moduleId, config) => {
        const { moduleSettings = {} } = await chrome.storage.local.get('moduleSettings');
        moduleSettings[moduleId] = { ...moduleSettings[moduleId], ...config };
        await chrome.storage.local.set({ moduleSettings });
      }
    },
    
    // DOM Utilities
    dom: {
      waitForElement: async (selector, timeout = 10000) => {
        return new Promise((resolve, reject) => {
          const element = document.querySelector(selector);
          if (element) return resolve(element);
          
          const observer = new MutationObserver((mutations) => {
            const element = document.querySelector(selector);
            if (element) {
              observer.disconnect();
              resolve(element);
            }
          });
          
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
          
          setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
          }, timeout);
        });
      },
      
      onPageReady: (callback) => {
        if (document.readyState === 'complete') {
          callback();
        } else {
          window.addEventListener('load', callback);
        }
      },
      
      injectCSS: (css, id) => {
        const existing = document.getElementById(id);
        if (existing) existing.remove();
        
        const style = document.createElement('style');
        style.id = id;
        style.textContent = css;
        document.head.appendChild(style);
      }
    },
    
    // Event System
    events: {
      listeners: new Map(),
      
      on: (event, callback) => {
        if (!window.GameEnhancement.events.listeners.has(event)) {
          window.GameEnhancement.events.listeners.set(event, new Set());
        }
        window.GameEnhancement.events.listeners.get(event).add(callback);
      },
      
      emit: (event, data) => {
        const listeners = window.GameEnhancement.events.listeners.get(event);
        if (listeners) {
          listeners.forEach(callback => {
            try {
              callback(data);
            } catch (error) {
              console.error(`❌ Event listener error for ${event}:`, error);
            }
          });
        }
      },
      
      off: (event, callback) => {
        const listeners = window.GameEnhancement.events.listeners.get(event);
        if (listeners) {
          listeners.delete(callback);
        }
      }
    },
    
    // Module Management
    modules: {
      getModule: (moduleId) => moduleSystem.active.get(moduleId),
      isLoaded: (moduleId) => moduleSystem.loaded.has(moduleId),
      loadModule: async (moduleId) => {
        // This would be implemented by module-loader
        console.log(`Loading module: ${moduleId}`);
      }
    },
    
    // UI Utilities
    ui: {
      showNotification: (message, type = 'info', duration = 5000) => {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `game-enhancement-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: var(--notification-bg, #333);
          color: var(--notification-text, white);
          padding: 12px 16px;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          z-index: 10000;
          transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => notification.remove(), 300);
        }, duration);
      },
      
      showToast: (message) => {
        window.GameEnhancement.ui.showNotification(message, 'info', 3000);
      },
      
      showModal: (content, options = {}) => {
        // Modal implementation would go here
        console.log('Modal:', content, options);
      }
    },
    
    // Theme System
    theme: {
      getCurrentTheme: async () => {
        const { theme = 'dark' } = await chrome.storage.local.get('theme');
        return theme;
      },
      
      getColor: (colorKey) => {
        return getComputedStyle(document.documentElement).getPropertyValue(`--${colorKey}`);
      },
      
      applyColors: (colors) => {
        for (const [key, value] of Object.entries(colors)) {
          document.documentElement.style.setProperty(`--${key}`, value);
        }
      }
    },
    
    // Utilities
    utils: {
      debounce: (func, delay) => {
        let timeoutId;
        return (...args) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func.apply(null, args), delay);
        };
      },
      
      throttle: (func, limit) => {
        let inThrottle;
        return (...args) => {
          if (!inThrottle) {
            func.apply(null, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
          }
        };
      },
      
      deepClone: (obj) => JSON.parse(JSON.stringify(obj))
    }
  };
}

// Initialize module system
async function initializeModuleSystem() {
  try {
    const settings = await chrome.storage.local.get([
      'modules',
      'moduleSettings',
      'globalSettings'
    ]);
    
    moduleSystem.settings = settings;
    console.log('📋 Module system initialized');
  } catch (error) {
    console.error('❌ Failed to initialize module system:', error);
  }
}

// Load active modules
async function loadActiveModules() {
  try {
    const { modules = {} } = await chrome.storage.local.get('modules');
    
    for (const [moduleId, moduleInfo] of Object.entries(modules)) {
      if (moduleInfo.enabled && moduleInfo.status === 'active') {
        await loadModule(moduleId, moduleInfo);
      }
    }
    
    console.log(`✅ Loaded ${moduleSystem.active.size} active modules`);
  } catch (error) {
    console.error('❌ Failed to load modules:', error);
  }
}

// Load individual module
async function loadModule(moduleId, moduleInfo) {
  try {
    // Check if module should load on current page
    if (moduleInfo.pages && moduleInfo.pages.length > 0) {
      const currentPage = window.location.pathname.split('/').pop();
      if (!moduleInfo.pages.includes(currentPage)) {
        console.log(`⏭️ Module ${moduleId} skipped (page filter)`);
        return;
      }
    }
    
    // Load module script
    const moduleUrl = chrome.runtime.getURL(`modules/${moduleInfo.category}/${moduleId}/${moduleId}.js`);
    const module = await import(moduleUrl);
    
    // Get module configuration
    const config = await window.GameEnhancement.storage.getModuleConfig(moduleId);
    
    // Initialize module
    if (typeof module.init === 'function') {
      await module.init(config);
      moduleSystem.active.set(moduleId, module);
      console.log(`✅ Module ${moduleId} loaded successfully`);
    } else {
      console.warn(`⚠️ Module ${moduleId} has no init function`);
    }
    
  } catch (error) {
    console.error(`❌ Failed to load module ${moduleId}:`, error);
    
    // Report module error to background
    chrome.runtime.sendMessage({
      type: 'MODULE_ERROR',
      moduleId,
      error: error.message
    });
  }
}

// Message handling from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleContentMessage(message).then(sendResponse);
  return true;
});

async function handleContentMessage(message) {
  try {
    switch (message.type) {
      case 'RELOAD_MODULE':
        return await reloadModule(message.moduleId);
      
      case 'GET_PAGE_INFO':
        return {
          url: window.location.href,
          title: document.title,
          ready: moduleSystem.ready
        };
      
      default:
        return { error: 'Unknown message type' };
    }
  } catch (error) {
    return { error: error.message };
  }
}

// Reload specific module
async function reloadModule(moduleId) {
  try {
    // Cleanup existing module
    const existingModule = moduleSystem.active.get(moduleId);
    if (existingModule && typeof existingModule.cleanup === 'function') {
      await existingModule.cleanup();
    }
    
    moduleSystem.active.delete(moduleId);
    
    // Reload module info
    const { modules = {} } = await chrome.storage.local.get('modules');
    const moduleInfo = modules[moduleId];
    
    if (moduleInfo && moduleInfo.enabled) {
      await loadModule(moduleId, moduleInfo);
    }
    
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to reload module ${moduleId}:`, error);
    return { error: error.message };
  }
}

// Global error handling
window.addEventListener('error', (event) => {
  if (event.error && event.error.stack && event.error.stack.includes('modules/')) {
    console.error('🚨 Module error detected:', event.error);
    // Could report to background for error tracking
  }
});

console.log('📋 DemonGame Addon Manager - Content Script Loaded');
