// Battle Page Features by GonBruck
(function() {
  'use strict';

  class BattleMods {
    constructor() {
      this.totalDamage = 0;
      this.damageTracker = new Map();
    }

    init() {
      if (!window.location.pathname.includes('battle.php')) return;
      
      console.log('⚔️ Initializing Battle Mods');
      
      this.initReducedMonsterSize();
      this.initLootPopupClose();
      this.initDamageTracking();
      this.initLootHighlighting();
      this.setupBattleInterface();
    }

    initReducedMonsterSize() {
      const monsterImages = document.querySelectorAll('.monster-image, .battle-monster img');
      
      monsterImages.forEach(img => {
        img.style.cssText += `
          max-width: 200px;
          max-height: 200px;
          object-fit: contain;
        `;
      });

      // Center battle text
      const battleTexts = document.querySelectorAll('.battle-text, .damage-text, .battle-log');
      battleTexts.forEach(text => {
        text.style.textAlign = 'center';
      });
    }

    initLootPopupClose() {
      // Setup click-anywhere-to-close for loot popups
      document.addEventListener('click', (e) => {
        const lootModal = document.querySelector('.loot-popup, .loot-modal, .battle-reward-modal');
        if (lootModal && !lootModal.contains(e.target)) {
          if (e.target === lootModal || lootModal.classList.contains('closeable')) {
            lootModal.remove();
          }
        }
      });
    }

    initDamageTracking() {
      // Track damage dealt in battles
      const attackButtons = document.querySelectorAll('.attack-btn, button[onclick*="attack"]');
      
      attackButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.trackAttack();
        });
      });

      // Display damage tracker
      this.createDamageDisplay();
    }

    createDamageDisplay() {
      const damageDisplay = document.createElement('div');
      damageDisplay.id = 'damage-tracker';
      damageDisplay.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #1e1e2e;
        color: #f9e2af;
        padding: 15px;
        border-radius: 8px;
        border: 1px solid #45475a;
        z-index: 1000;
        min-width: 200px;
      `;

      damageDisplay.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: #cba6f7;">⚔️ Damage Tracker</h4>
        <div>Total Damage: <span id="total-damage">0</span></div>
        <div>Attacks: <span id="attack-count">0</span></div>
        <div>Average: <span id="avg-damage">0</span></div>
        <button onclick="this.parentElement.style.display='none'" 
                style="margin-top: 10px; padding: 4px 8px; background: #45475a; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Hide
        </button>
      `;

      document.body.appendChild(damageDisplay);
    }

    trackAttack() {
      // This would be enhanced to actually parse damage from battle results
      setTimeout(() => {
        this.updateDamageDisplay();
      }, 1000);
    }

    updateDamageDisplay() {
      // Parse damage from battle log
      const battleLog = document.querySelector('.battle-log, .damage-log');
      if (!battleLog) return;

      const damageMatches = battleLog.textContent.match(/(\d+) damage/gi);
      if (damageMatches) {
        const latestDamage = parseInt(damageMatches[damageMatches.length - 1].match(/\d+/)[0]);
        this.totalDamage += latestDamage;

        document.getElementById('total-damage').textContent = this.totalDamage.toLocaleString();
        
        const attackCount = parseInt(document.getElementById('attack-count').textContent) + 1;
        document.getElementById('attack-count').textContent = attackCount;
        
        const avgDamage = Math.round(this.totalDamage / attackCount);
        document.getElementById('avg-damage').textContent = avgDamage.toLocaleString();
      }
    }

    initLootHighlighting() {
      const lootItems = document.querySelectorAll('.loot-item, .battle-reward');
      
      lootItems.forEach(item => {
        // Check if loot is unlocked based on damage requirement
        const damageReq = item.querySelector('.damage-requirement');
        const isUnlocked = this.checkLootUnlocked(damageReq);
        
        if (isUnlocked) {
          item.style.cssText += `
            background: rgba(34, 197, 94, 0.2);
            border: 2px solid #22c55e;
            box-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
          `;
        } else {
          item.style.cssText += `
            background: rgba(107, 114, 128, 0.2);
            border: 1px solid #6b7280;
            opacity: 0.7;
          `;
        }
      });
    }

    checkLootUnlocked(damageReqElement) {
      if (!damageReqElement) return true;
      
      const reqText = damageReqElement.textContent;
      const reqMatch = reqText.match(/(\d+)/);
      if (reqMatch) {
        const required = parseInt(reqMatch[1]);
        return this.totalDamage >= required;
      }
      
      return true;
    }

    setupBattleInterface() {
      // Add quick action buttons
      const battleArea = document.querySelector('.battle-area, .combat-area');
      if (!battleArea) return;

      const quickActions = document.createElement('div');
      quickActions.className = 'quick-actions';
      quickActions.style.cssText = `
        margin: 15px 0;
        display: flex;
        gap: 10px;
        justify-content: center;
      `;

      quickActions.innerHTML = `
        <button onclick="window.battleMods.usePotion()" class="quick-btn">🧪 Potion</button>
        <button onclick="window.battleMods.retreat()" class="quick-btn">🏃 Retreat</button>
        <button onclick="window.battleMods.toggleAutoAttack()" class="quick-btn">⚡ Auto</button>
      `;

      battleArea.appendChild(quickActions);

      // Add CSS for quick buttons
      const style = document.createElement('style');
      style.textContent = `
        .quick-btn {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }
        .quick-btn:hover {
          background: #2563eb;
        }
      `;
      document.head.appendChild(style);

      // Make methods available
      window.battleMods = this;
    }

    usePotion() {
      // Quick potion usage
      const potionBtn = document.querySelector('button[onclick*="potion"], .use-potion');
      if (potionBtn) {
        potionBtn.click();
      } else {
        window.GameEnhancement?.NotificationSystem?.warning('No potion available');
      }
    }

    retreat() {
      // Quick retreat
      const retreatBtn = document.querySelector('button[onclick*="retreat"], .retreat-btn');
      if (retreatBtn) {
        if (confirm('Are you sure you want to retreat?')) {
          retreatBtn.click();
        }
      } else {
        window.GameEnhancement?.NotificationSystem?.warning('Cannot retreat');
      }
    }

    toggleAutoAttack() {
      // Toggle auto-attack mode
      if (!this.autoAttackInterval) {
        this.startAutoAttack();
      } else {
        this.stopAutoAttack();
      }
    }

    startAutoAttack() {
      const attackBtn = document.querySelector('.attack-btn, button[onclick*="attack"]');
      if (!attackBtn) return;

      this.autoAttackInterval = setInterval(() => {
        if (attackBtn && !attackBtn.disabled) {
          attackBtn.click();
        }
      }, 2000);

      window.GameEnhancement?.NotificationSystem?.success('Auto-attack enabled');
    }

    stopAutoAttack() {
      if (this.autoAttackInterval) {
        clearInterval(this.autoAttackInterval);
        this.autoAttackInterval = null;
        window.GameEnhancement?.NotificationSystem?.info('Auto-attack disabled');
      }
    }
  }

  // Initialize function
  window.initBattleMods = function(config = {}) {
    const battleMods = new BattleMods();
    battleMods.init();
    return battleMods;
  };
})();