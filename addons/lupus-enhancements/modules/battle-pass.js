// Battle Pass - Enable scroll function when on battle_pass.php
(function() {
  'use strict';

  class BattlePass {
    constructor() {
      this.enabled = false;
    }

    async init() {
      // Check if we're on battle pass page
      if (!window.location.href.includes('battle_pass.php')) {
        return;
      }
      
      // Load config
      await this.loadConfig();
      
      if (!this.enabled) {
        return;
      }
      
      // Call the scroll function
      if (typeof window.ProgressTrackScrollAction === 'function') {
        window.ProgressTrackScrollAction();
      }
    }

    async loadConfig() {
      try {
        const result = await chrome.storage.local.get(['config']);
        if (result.config?.lupus?.battlePass) {
          this.enabled = true;
        }
      } catch (error) {
        console.error('Battle Pass config load error:', error);
      }
    }
  }

  // Auto-initialize
  const battlePass = new BattlePass();
  battlePass.init();

})();