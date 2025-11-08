// About Tab Controller
(function() {
  'use strict';

  async function init_about(popupController) {
    console.log('ℹ️ Initializing About tab');
    
    try {
      // Load version from manifest
      const manifest = chrome.runtime.getManifest();
      const versionElement = document.getElementById('aboutVersion');
      if (versionElement) {
        versionElement.textContent = `Version ${manifest.version}`;
      }
      
      // Load extension ID
      const extensionId = document.getElementById('extensionId');
      if (extensionId) {
        extensionId.textContent = chrome.runtime.id;
      }
      
      // Load browser info
      const browserInfo = document.getElementById('browserInfo');
      if (browserInfo) {
        const userAgent = navigator.userAgent;
        let browser = 'Unknown';
        
        if (userAgent.includes('Edg/')) {
          browser = 'Microsoft Edge';
        } else if (userAgent.includes('Chrome/')) {
          browser = 'Google Chrome';
        } else if (userAgent.includes('Firefox/')) {
          browser = 'Mozilla Firefox';
        } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
          browser = 'Safari';
        }
        
        browserInfo.textContent = browser;
      }
      
      // Setup link buttons with error handling
      setupButton('openGithub', 'https://github.com/LupusMagnusMalus/DemonGame---Addon-Manager');
      setupButton('openIssues', 'https://github.com/LupusMagnusMalus/DemonGame---Addon-Manager/issues');
      setupButton('openChangelog', 'https://github.com/LupusMagnusMalus/DemonGame---Addon-Manager/releases');
      setupButton('openGithubLupus', 'https://github.com/LupusMagnusMalus');
      setupButton('openGithubLupusRepo', 'https://github.com/LupusMagnusMalus/DemonGame---Addon-Manager');
      
      console.log('✅ About tab initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize About tab:', error);
    }
  }
  
  function setupButton(buttonId, url) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener('click', () => {
        try {
          chrome.tabs.create({ url: url });
        } catch (error) {
          console.error(`Failed to open URL ${url}:`, error);
          // Fallback: try to open in current window
          window.open(url, '_blank');
        }
      });
    } else {
      console.warn(`Button ${buttonId} not found in DOM`);
    }
  }

  function cleanup_about() {
    console.log('ℹ️ Cleaning up About tab');
    
    // Remove event listeners to prevent memory leaks
    const buttons = [
      'openGithub', 'openIssues', 'openChangelog', 'openGithubLupus', 
      'openGithubLupusRepo', 'openGithubGonBruck', 'openGithubGonBruckRepo', 
      'openGithubAsura', 'openGithubAsuraRepo'
    ];
    
    buttons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      if (button) {
        // Clone and replace to remove all event listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
      }
    });
  }

  // Export functions globally
  window.init_about = init_about;
  window.cleanup_about = cleanup_about;
})();
