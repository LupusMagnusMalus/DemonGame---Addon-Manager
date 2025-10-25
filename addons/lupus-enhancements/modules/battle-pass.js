import 'ProgressTrackScrollActions.js';
// Battle Pass Page Enhancements by Lupus
(function() {
  'use strict';

  class BattlePassMods {
    constructor() {
    }

    init() {
      if (!window.location.pathname.includes('battle_pass.php')) return;

      console.log('🎒 Initializing Battle Pass Mods');
      ProgressTrackScrollAction();
    }
  }

  // Initialize function
  window.initBattlePassMods = function(config = {}) {
    const battlePassMods = new BattlePassMods();
    battlePassMods.init();
    return battlePassMods;
  };
})();