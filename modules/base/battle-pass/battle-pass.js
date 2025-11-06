// Battle Pass - Execute scroll after page fully loaded
(function() {
  'use strict';

  console.log('🎯 Battle Pass module loaded');

  // Check if we're on battle pass page
  if (!window.location.href.includes('battle_pass.php')) {
    console.log('🎯 Not on battle_pass.php, skipping');
    return;
  }

  console.log('🎯 On battle_pass.php - waiting for page to be fully loaded...');

  // Wait for page to be fully loaded and stable
  function waitForPageStable() {
    return new Promise((resolve) => {
      // Wait for DOM content loaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          console.log('🎯 DOMContentLoaded fired');
          // Wait additional 2 seconds for any post-load scrolling to finish
          setTimeout(resolve, 2000);
        });
      } else {
        console.log('🎯 DOM already ready');
        // Page already loaded, wait 2 seconds for stability
        setTimeout(resolve, 2000);
      }
    });
  }

  // Execute scroll function when stable
  waitForPageStable().then(() => {
    console.log('🎯 Page stable, executing ProgressTrackScrollAction()');
    
    if (typeof window.ProgressTrackScrollAction === 'function') {
      window.ProgressTrackScrollAction();
      console.log('✅ ProgressTrackScrollAction executed successfully');
    } else {
      console.error('❌ ProgressTrackScrollAction function not found!');
    }
  });

})();