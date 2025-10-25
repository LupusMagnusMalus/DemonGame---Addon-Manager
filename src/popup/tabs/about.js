// About Tab Controller
(function() {
  'use strict';

  async function init_about(popupController) {
    console.log('ℹ️ Initializing About tab');
    
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
      }
      
      browserInfo.textContent = browser;
    }
    
    // Setup link buttons
    document.getElementById('openGithub')?.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://github.com/LupusMagnusMalus/DemonGame---Addon-Manager' });
    });
    
    document.getElementById('openIssues')?.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://github.com/LupusMagnusMalus/DemonGame---Addon-Manager/issues' });
    });
    
    document.getElementById('openChangelog')?.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://github.com/LupusMagnusMalus/DemonGame---Addon-Manager/releases' });
    });
  }

  function cleanup_about() {
    console.log('ℹ️ Cleaning up About tab');
  }

  window.init_about = init_about;
  window.cleanup_about = cleanup_about;
})();