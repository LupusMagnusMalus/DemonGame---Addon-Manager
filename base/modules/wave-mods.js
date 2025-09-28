// Wave Page Enhancements by GonBruck
(function() {
  'use strict';

  class WaveMods {
    constructor() {
      this.monsterFiltersSettings = {
        nameFilter: "",
        hideImg: false,
        battleLimitAlarm: false,
        battleLimitAlarmSound: true,
        battleLimitAlarmVolume: 70,
        monsterTypeFilter: [],
        hpFilter: "",
        playerCountFilter: ""
      };
    }

    init() {
      if (!window.location.pathname.includes('active_wave.php')) return;
      
      console.log('🌊 Initializing Wave Mods');
      
      this.initGateCollapse();
      this.initMonsterFilter();
      this.initInstaLoot();
      this.initContinueBattleFirst();
      this.initMonsterSorting();
      this.initInstantJoinBattle();
    }

    initGateCollapse() {
      const gateInfo = document.querySelector('.gate-info, .wave-info');
      if (!gateInfo) return;

      // Hide gate info by default
      gateInfo.style.display = 'none';

      // Create toggle button
      const toggleBtn = document.createElement('button');
      toggleBtn.textContent = 'Show Gate Info';
      toggleBtn.className = 'gate-toggle-btn';
      toggleBtn.style.cssText = `
        margin: 10px 0;
        padding: 8px 16px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      `;

      toggleBtn.onclick = () => {
        const isHidden = gateInfo.style.display === 'none';
        gateInfo.style.display = isHidden ? 'block' : 'none';
        toggleBtn.textContent = isHidden ? 'Hide Gate Info' : 'Show Gate Info';
      };

      gateInfo.parentNode.insertBefore(toggleBtn, gateInfo);
    }

    initMonsterFilter() {
      const monstersContainer = document.querySelector('.monster-container');
      if (!monstersContainer) return;

      // Create filter UI
      const filterContainer = document.createElement('div');
      filterContainer.className = 'monster-filters';
      filterContainer.innerHTML = `
        <div style="background: #1e1e2e; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #cba6f7; margin: 0 0 15px 0;">Monster Filters</h3>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <label style="color: #f9e2af; display: block; margin-bottom: 5px;">Filter by Name:</label>
              <input type="text" id="monster-name-filter" placeholder="Monster name..." 
                     style="width: 100%; padding: 8px; background: #313244; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px;">
            </div>
            
            <div>
              <label style="color: #f9e2af; display: block; margin-bottom: 5px;">Filter by HP:</label>
              <select id="monster-hp-filter" style="width: 100%; padding: 8px; background: #313244; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px;">
                <option value="">All HP Levels</option>
                <option value="low">Low HP (1-25%)</option>
                <option value="medium">Medium HP (26-75%)</option>
                <option value="high">High HP (76-99%)</option>
                <option value="full">Full HP (100%)</option>
              </select>
            </div>
          </div>
          
          <div style="margin-top: 15px;">
            <label style="color: #f9e2af; display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="hide-monster-images">
              Hide Monster Images
            </label>
          </div>
        </div>
      `;

      monstersContainer.parentNode.insertBefore(filterContainer, monstersContainer);
      this.setupFilterEventListeners();
    }

    setupFilterEventListeners() {
      const nameFilter = document.getElementById('monster-name-filter');
      const hpFilter = document.getElementById('monster-hp-filter');
      const hideImages = document.getElementById('hide-monster-images');

      const applyFilters = () => {
        this.applyMonsterFilters();
      };

      nameFilter?.addEventListener('input', applyFilters);
      hpFilter?.addEventListener('change', applyFilters);
      hideImages?.addEventListener('change', applyFilters);
    }

    applyMonsterFilters() {
      const nameFilter = document.getElementById('monster-name-filter')?.value.toLowerCase() || '';
      const hpFilter = document.getElementById('monster-hp-filter')?.value || '';
      const hideImages = document.getElementById('hide-monster-images')?.checked || false;

      const monsters = document.querySelectorAll('.monster-card, .monster-item');
      
      monsters.forEach(monster => {
        let show = true;

        // Name filter
        if (nameFilter) {
          const monsterName = monster.querySelector('.monster-name, h3, h4')?.textContent.toLowerCase() || '';
          show = show && monsterName.includes(nameFilter);
        }

        // HP filter
        if (hpFilter) {
          const hpText = monster.querySelector('.monster-hp, .hp')?.textContent || '';
          const hpMatch = hpText.match(/(\d+)%/);
          if (hpMatch) {
            const hpPercent = parseInt(hpMatch[1]);
            switch (hpFilter) {
              case 'low': show = show && hpPercent <= 25; break;
              case 'medium': show = show && hpPercent > 25 && hpPercent <= 75; break;
              case 'high': show = show && hpPercent > 75 && hpPercent < 100; break;
              case 'full': show = show && hpPercent === 100; break;
            }
          }
        }

        // Hide images
        const monsterImg = monster.querySelector('img');
        if (monsterImg) {
          monsterImg.style.display = hideImages ? 'none' : '';
        }

        monster.style.display = show ? '' : 'none';
      });
    }

    initInstaLoot() {
      const lootLinks = document.querySelectorAll('a[href*="loot"]');
      
      lootLinks.forEach(link => {
        const instaBtn = document.createElement('button');
        instaBtn.textContent = 'Insta Loot';
        instaBtn.className = 'insta-loot-btn';
        instaBtn.style.cssText = `
          margin-left: 10px;
          padding: 4px 8px;
          background: #22c55e;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        `;

        instaBtn.onclick = (e) => {
          e.preventDefault();
          this.collectLootInstantly(link.href);
        };

        link.parentNode.appendChild(instaBtn);
      });
    }

    async collectLootInstantly(lootUrl) {
      try {
        const response = await fetch(lootUrl);
        const html = await response.text();
        
        // Parse loot results
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const lootResults = doc.querySelector('.loot-results, .battle-results');
        
        if (lootResults) {
          this.showLootModal(lootResults.innerHTML);
          window.GameEnhancement?.NotificationSystem?.success('Loot collected successfully!');
        } else {
          window.GameEnhancement?.NotificationSystem?.error('No loot found');
        }
      } catch (error) {
        console.error('Loot collection failed:', error);
        window.GameEnhancement?.NotificationSystem?.error('Failed to collect loot');
      }
    }

    showLootModal(content) {
      const modal = document.createElement('div');
      modal.className = 'loot-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;

      modal.innerHTML = `
        <div style="background: #1e1e2e; padding: 20px; border-radius: 8px; max-width: 500px; max-height: 70vh; overflow-y: auto;">
          <h3 style="color: #f9e2af; margin-top: 0;">Loot Results</h3>
          ${content}
          <button onclick="this.closest('.loot-modal').remove()" 
                  style="margin-top: 15px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Close
          </button>
        </div>
      `;

      // Close on background click
      modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
      };

      document.body.appendChild(modal);
    }

    initContinueBattleFirst() {
      const monsters = document.querySelectorAll('.monster-card, .monster-item');
      const monstersContainer = document.querySelector('.monster-container');
      if (!monstersContainer) return;

      const continueBattles = [];
      const newBattles = [];

      monsters.forEach(monster => {
        const battleText = monster.textContent.toLowerCase();
        if (battleText.includes('continue') || battleText.includes('ongoing')) {
          continueBattles.push(monster);
        } else {
          newBattles.push(monster);
        }
      });

      // Clear container and re-add in correct order
      monstersContainer.innerHTML = '';
      continueBattles.forEach(monster => monstersContainer.appendChild(monster));
      newBattles.forEach(monster => monstersContainer.appendChild(monster));
    }

    initMonsterSorting() {
      const monsters = document.querySelectorAll('.monster-card, .monster-item');
      const monstersContainer = document.querySelector('.monster-container');
      if (!monstersContainer) return;

      // Sort by HP percentage (lowest first)
      const sortedMonsters = Array.from(monsters).sort((a, b) => {
        const getHp = (monster) => {
          const hpText = monster.querySelector('.monster-hp, .hp')?.textContent || '';
          const hpMatch = hpText.match(/(\d+)%/);
          return hpMatch ? parseInt(hpMatch[1]) : 100;
        };

        return getHp(a) - getHp(b);
      });

      // Clear and re-add sorted
      monstersContainer.innerHTML = '';
      sortedMonsters.forEach(monster => monstersContainer.appendChild(monster));
    }

    initInstantJoinBattle() {
      const battleLinks = document.querySelectorAll('a[href*="battle.php"]');
      
      battleLinks.forEach(link => {
        const joinBtn = document.createElement('button');
        joinBtn.textContent = '⚔️ Quick Join';
        joinBtn.className = 'quick-join-btn';
        joinBtn.style.cssText = `
          margin-left: 10px;
          padding: 4px 8px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        `;

        joinBtn.onclick = (e) => {
          e.preventDefault();
          this.joinBattleInstantly(link.href);
        };

        link.parentNode.appendChild(joinBtn);
      });
    }

    async joinBattleInstantly(battleUrl) {
      try {
        window.GameEnhancement?.NotificationSystem?.info('Joining battle...');
        window.location.href = battleUrl + '&instant=true';
      } catch (error) {
        console.error('Failed to join battle:', error);
        window.GameEnhancement?.NotificationSystem?.error('Failed to join battle');
      }
    }
  }

  // Initialize function
  window.initWaveMods = function(config = {}) {
    const waveMods = new WaveMods();
    waveMods.init();
    return waveMods;
  };
})();