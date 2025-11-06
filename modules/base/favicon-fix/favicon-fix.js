// Favicon Fix (from Lupus Fork integrated in base)
(function() {
  'use strict';

  function fixFavicon() {
    // Remove existing favicons
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
    existingFavicons.forEach(favicon => favicon.remove());

    // Add extension favicon
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    const faviconUrl = (typeof chrome !== 'undefined' && chrome.runtime) 
      ? chrome.runtime.getURL('src/favicon.png')
      : 'src/favicon.png';
    favicon.href = faviconUrl;
    
    document.head.appendChild(favicon);
    console.log('✅ Favicon fixed');
  }

  // Execute when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixFavicon);
  } else {
    fixFavicon();
  }
})();