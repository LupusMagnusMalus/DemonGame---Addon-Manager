// Asura Tab Controller
(function() {
  'use strict';

  let config = {
    aiRecommendations: false,
    predictiveAnalytics: false,
    autoOptimization: false,
    advancedFilters: false,
    exportTools: false
  };

  async function init_asura(popupController) {
    console.log('⚡ Initializing Asura tab');
    
    await loadAsuraConfig(popupController);
    
    // Use popupController utilities
    popupController.setupFeatureToggles(config, 'asura', async (featureId, enabled) => {
      config[featureId] = enabled;
    });
    
    popupController.setupCategoryCollapse();
    setupQuickActions(popupController);
  }

  async function loadAsuraConfig(popupController) {
    const stored = await popupController.loadConfig();
    if (stored.asura) {
      config = { ...config, ...stored.asura };
    }
    
    // Update UI
    Object.keys(config).forEach(featureId => {
      const toggle = document.getElementById(featureId);
      if (toggle) {
        toggle.checked = config[featureId];
      }
    });
  }

  function setupQuickActions(popupController) {
    const enableAll = document.getElementById('enableAllAsura');
    const disableAll = document.getElementById('disableAllAsura');
    
    if (enableAll) {
      enableAll.addEventListener('click', async () => {
        Object.keys(config).forEach(key => {
          config[key] = true;
          const toggle = document.getElementById(key);
          if (toggle) toggle.checked = true;
        });
        
        const stored = await popupController.loadConfig();
        stored.asura = config;
        await popupController.saveConfig('config', stored);
        
        popupController.showToast('All Asura features enabled', 'success');
      });
    }
    
    if (disableAll) {
      disableAll.addEventListener('click', async () => {
        Object.keys(config).forEach(key => {
          config[key] = false;
          const toggle = document.getElementById(key);
          if (toggle) toggle.checked = false;
        });
        
        const stored = await popupController.loadConfig();
        stored.asura = config;
        await popupController.saveConfig('config', stored);
        
        popupController.showToast('All Asura features disabled', 'success');
      });
    }
  }

  function cleanup_asura() {
    console.log('⚡ Cleaning up Asura tab');
  }

  // Export
  window.init_asura = init_asura;
  window.cleanup_asura = cleanup_asura;
})();