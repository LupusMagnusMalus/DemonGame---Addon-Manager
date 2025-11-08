// Favicon Fix (from Lupus Fork integrated in base) - Path Corrected
(function() {
  'use strict';

  async function init(config) {
    console.log('🔧 Initializing Favicon Fix module');
    fixFavicon();
  }

  function fixFavicon() {
    // Remove existing favicons
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
    existingFavicons.forEach(favicon => favicon.remove());

    // Add extension favicon
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    
    // Corrected path for new structure
    const faviconUrl = (typeof chrome !== 'undefined' && chrome.runtime) 
      ? chrome.runtime.getURL('core/icons/favicon.png')
      : 'core/icons/favicon.png';
    favicon.href = faviconUrl;
    
    document.head.appendChild(favicon);
    console.log('✅ Favicon fixed');
  }

  function cleanup() {
    console.log('🧹 Favicon Fix cleanup');
  }

  // Export functions for module system
  if (typeof window !== 'undefined') {
    window.GameEnhancement = window.GameEnhancement || {};
    window.GameEnhancement.modules = window.GameEnhancement.modules || {};
    window.GameEnhancement.modules['favicon-fix'] = {
      init,
      cleanup,
      fixFavicon
    };
  }

  // Also export as module
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { init, cleanup, fixFavicon };
  }

  // Legacy support - execute immediately if not in module context
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    // Execute when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fixFavicon);
    } else {
      fixFavicon();
    }
  }
})();
