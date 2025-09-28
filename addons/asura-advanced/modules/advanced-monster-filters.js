// Advanced Monster Filtering System by Asura (v2.0)
(function() {
  'use strict';

  class AdvancedMonsterFilters {
    constructor() {
      this.filterSettings = {
        nameFilter: "",
        waveFilter: "all",
        hpFilter: "all",
        playerCountFilter: "all",
        monsterTypeFilter: [],
        hideImages: false,
        sortBy: "hp"
      };
      this.availableMonsterTypes = [
        'Orc Raider of Grakthar',
        'Orc Archer',
        'Orc Grunt of Grakthar',
        'Orc Berserker',
        'Orc Shaman',
        'Goblin Scout',
        'Troll Warrior',
        'Dark Mage'
      ];
    }

    init() {
      if (!window.location.pathname.includes('active_wave.php')) return;
      
      console.log('🔍 Initializing Advanced Monster Filters');
      
      this.createAdvancedFilterUI();
      this.setupFilterEventListeners();
      this.loadSavedFilters();
      this.applyFilters();
    }

    createAdvancedFilterUI() {
      const monstersContainer = document.querySelector('.monster-container');
      if (!monstersContainer) return;

      const filterContainer = document.createElement('div');
      filterContainer.className = 'advanced-monster-filters';
      filterContainer.innerHTML = this.getAdvancedFilterHTML();

      monstersContainer.parentNode.insertBefore(filterContainer, monstersContainer);
    }

    getAdvancedFilterHTML() {
      return `
        <div class="filter-panel">
          <div class="filter-header">
            <h3>🔍 Advanced Monster Filters</h3>
            <button class="filter-toggle-btn" id="filter-toggle">Show Filters</button>
          </div>
          
          <div class="filter-content collapsed" id="filter-content">
            <!-- Basic Filters Row -->
            <div class="filter-row">
              <div class="filter-group">
                <label>Monster Name:</label>
                <input type="text" id="name-filter" placeholder="Search by name..." value="${this.filterSettings.nameFilter}">
              </div>
              
              <div class="filter-group">
                <label>Wave:</label>
                <select id="wave-filter">
                  <option value="all">All Waves</option>
                  <option value="1">Wave 1</option>
                  <option value="2">Wave 2</option>
                  <option value="continue">Continue Battle</option>
                </select>
              </div>
            </div>

            <!-- HP and Player Count Row -->
            <div class="filter-row">
              <div class="filter-group">
                <label>HP Level:</label>
                <select id="hp-filter">
                  <option value="all">All HP Levels</option>
                  <option value="empty">Empty (0%)</option>
                  <option value="low">Low (1-25%)</option>
                  <option value="medium">Medium (26-75%)</option>
                  <option value="high">High (76-99%)</option>
                  <option value="full">Full (100%)</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label>Player Count:</label>
                <select id="player-count-filter">
                  <option value="all">All Player Counts</option>
                  <option value="empty">Empty (0 players)</option>
                  <option value="few">Few (1-2 players)</option>
                  <option value="many">Many (3-5 players)</option>
                  <option value="full">Full (6+ players)</option>
                </select>
              </div>
            </div>

            <!-- Monster Type Selection -->
            <div class="filter-row">
              <div class="filter-group full-width">
                <label>Monster Types (Select Multiple):</label>
                <div class="monster-type-grid" id="monster-type-grid">
                  ${this.generateMonsterTypeCheckboxes()}
                </div>
              </div>
            </div>

            <!-- Display Options -->
            <div class="filter-row">
              <div class="filter-group">
                <label>Sort By:</label>
                <select id="sort-filter">
                  <option value="hp">HP (Lowest First)</option>
                  <option value="hp-desc">HP (Highest First)</option>
                  <option value="players">Player Count</option>
                  <option value="name">Monster Name</option>
                  <option value="wave">Wave Number</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="hide-images">
                  Hide Monster Images
                </label>
              </div>
            </div>

            <!-- Filter Actions -->
            <div class="filter-actions">
              <button id="apply-filters" class="filter-btn primary">Apply Filters</button>
              <button id="clear-filters" class="filter-btn secondary">Clear All</button>
              <button id="save-preset" class="filter-btn secondary">Save Preset</button>
            </div>

            <!-- Quick Presets -->
            <div class="filter-presets">
              <h4>Quick Presets:</h4>
              <div class="preset-buttons">
                <button class="preset-btn" data-preset="low-hp">Low HP Only</button>
                <button class="preset-btn" data-preset="continue-battles">Continue Battles</button>
                <button class="preset-btn" data-preset="empty-battles">Empty Battles</button>
                <button class="preset-btn" data-preset="orcs-only">Orcs Only</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    generateMonsterTypeCheckboxes() {
      return this.availableMonsterTypes.map(type => `
        <label class="monster-type-option">
          <input type="checkbox" value="${type}" ${this.filterSettings.monsterTypeFilter.includes(type) ? 'checked' : ''}>
          <span>${type}</span>
        </label>
      `).join('');
    }

    setupFilterEventListeners() {
      // Toggle filter panel
      const toggleBtn = document.getElementById('filter-toggle');
      const filterContent = document.getElementById('filter-content');
      
      toggleBtn?.addEventListener('click', () => {
        const isCollapsed = filterContent.classList.contains('collapsed');
        filterContent.classList.toggle('collapsed');
        toggleBtn.textContent = isCollapsed ? 'Hide Filters' : 'Show Filters';
      });

      // Filter inputs
      document.getElementById('name-filter')?.addEventListener('input', () => {
        this.filterSettings.nameFilter = document.getElementById('name-filter').value;
        this.debounceApplyFilters();
      });

      document.getElementById('wave-filter')?.addEventListener('change', () => {
        this.filterSettings.waveFilter = document.getElementById('wave-filter').value;
        this.applyFilters();
      });

      document.getElementById('hp-filter')?.addEventListener('change', () => {
        this.filterSettings.hpFilter = document.getElementById('hp-filter').value;
        this.applyFilters();
      });

      document.getElementById('player-count-filter')?.addEventListener('change', () => {
        this.filterSettings.playerCountFilter = document.getElementById('player-count-filter').value;
        this.applyFilters();
      });

      document.getElementById('sort-filter')?.addEventListener('change', () => {
        this.filterSettings.sortBy = document.getElementById('sort-filter').value;
        this.applyFilters();
      });

      document.getElementById('hide-images')?.addEventListener('change', () => {
        this.filterSettings.hideImages = document.getElementById('hide-images').checked;
        this.applyFilters();
      });

      // Monster type checkboxes
      document.querySelectorAll('#monster-type-grid input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          this.updateMonsterTypeFilter();
          this.applyFilters();
        });
      });

      // Filter actions
      document.getElementById('apply-filters')?.addEventListener('click', () => {
        this.applyFilters();
      });

      document.getElementById('clear-filters')?.addEventListener('click', () => {
        this.clearAllFilters();
      });

      document.getElementById('save-preset')?.addEventListener('click', () => {
        this.saveCurrentAsPreset();
      });

      // Preset buttons
      document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.applyPreset(btn.dataset.preset);
        });
      });

      // Debounced apply for name filter
      this.debounceApplyFilters = this.debounce(() => {
        this.applyFilters();
      }, 300);
    }

    updateMonsterTypeFilter() {
      const checkedTypes = Array.from(
        document.querySelectorAll('#monster-type-grid input[type="checkbox"]:checked')
      ).map(cb => cb.value);
      
      this.filterSettings.monsterTypeFilter = checkedTypes;
    }

    applyFilters() {
      const monsters = document.querySelectorAll('.monster-card, .monster-item, .battle-card');
      const filteredMonsters = [];

      monsters.forEach(monster => {
        if (this.passesFilters(monster)) {
          filteredMonsters.push(monster);
          monster.style.display = '';
        } else {
          monster.style.display = 'none';
        }
      });

      // Apply sorting
      this.sortMonsters(filteredMonsters);

      // Apply image hiding
      this.toggleMonsterImages();

      // Update filter stats
      this.updateFilterStats(filteredMonsters.length, monsters.length);

      // Save filter settings
      this.saveFilterSettings();
    }

    passesFilters(monster) {
      // Name filter
      if (this.filterSettings.nameFilter) {
        const monsterName = this.getMonsterName(monster).toLowerCase();
        if (!monsterName.includes(this.filterSettings.nameFilter.toLowerCase())) {
          return false;
        }
      }

      // Wave filter
      if (this.filterSettings.waveFilter !== 'all') {
        if (!this.passesWaveFilter(monster)) {
          return false;
        }
      }

      // HP filter
      if (this.filterSettings.hpFilter !== 'all') {
        if (!this.passesHPFilter(monster)) {
          return false;
        }
      }

      // Player count filter
      if (this.filterSettings.playerCountFilter !== 'all') {
        if (!this.passesPlayerCountFilter(monster)) {
          return false;
        }
      }

      // Monster type filter
      if (this.filterSettings.monsterTypeFilter.length > 0) {
        if (!this.passesMonsterTypeFilter(monster)) {
          return false;
        }
      }

      return true;
    }

    getMonsterName(monster) {
      const nameEl = monster.querySelector('.monster-name, h3, h4, .battle-title');
      return nameEl ? nameEl.textContent.trim() : '';
    }

    passesWaveFilter(monster) {
      const wave = this.filterSettings.waveFilter;
      const monsterText = monster.textContent.toLowerCase();
      
      switch (wave) {
        case '1':
          return monsterText.includes('wave 1') || monsterText.includes('gate=3&wave=3');
        case '2':
          return monsterText.includes('wave 2') || monsterText.includes('gate=3&wave=5');
        case 'continue':
          return monsterText.includes('continue') || monsterText.includes('ongoing');
        default:
          return true;
      }
    }

    passesHPFilter(monster) {
      const hpText = monster.querySelector('.monster-hp, .hp, .health')?.textContent || '';
      const hpMatch = hpText.match(/(\d+)%/);
      
      if (!hpMatch) return this.filterSettings.hpFilter === 'all';
      
      const hpPercent = parseInt(hpMatch[1]);
      
      switch (this.filterSettings.hpFilter) {
        case 'empty': return hpPercent === 0;
        case 'low': return hpPercent > 0 && hpPercent <= 25;
        case 'medium': return hpPercent > 25 && hpPercent <= 75;
        case 'high': return hpPercent > 75 && hpPercent < 100;
        case 'full': return hpPercent === 100;
        default: return true;
      }
    }

    passesPlayerCountFilter(monster) {
      const playerText = monster.querySelector('.player-count, .players')?.textContent || '';
      const playerMatch = playerText.match(/(\d+)/);
      
      if (!playerMatch) return this.filterSettings.playerCountFilter === 'all';
      
      const playerCount = parseInt(playerMatch[1]);
      
      switch (this.filterSettings.playerCountFilter) {
        case 'empty': return playerCount === 0;
        case 'few': return playerCount >= 1 && playerCount <= 2;
        case 'many': return playerCount >= 3 && playerCount <= 5;
        case 'full': return playerCount >= 6;
        default: return true;
      }
    }

    passesMonsterTypeFilter(monster) {
      const monsterName = this.getMonsterName(monster);
      return this.filterSettings.monsterTypeFilter.some(type => 
        monsterName.includes(type)
      );
    }

    sortMonsters(monsters) {
      const container = document.querySelector('.monster-container');
      if (!container) return;

      monsters.sort((a, b) => {
        switch (this.filterSettings.sortBy) {
          case 'hp':
            return this.getMonsterHP(a) - this.getMonsterHP(b);
          case 'hp-desc':
            return this.getMonsterHP(b) - this.getMonsterHP(a);
          case 'players':
            return this.getPlayerCount(a) - this.getPlayerCount(b);
          case 'name':
            return this.getMonsterName(a).localeCompare(this.getMonsterName(b));
          case 'wave':
            return this.getWaveNumber(a) - this.getWaveNumber(b);
          default:
            return 0;
        }
      });

      // Re-append in sorted order
      monsters.forEach(monster => container.appendChild(monster));
    }

    getMonsterHP(monster) {
      const hpText = monster.querySelector('.monster-hp, .hp')?.textContent || '';
      const hpMatch = hpText.match(/(\d+)%/);
      return hpMatch ? parseInt(hpMatch[1]) : 100;
    }

    getPlayerCount(monster) {
      const playerText = monster.querySelector('.player-count, .players')?.textContent || '';
      const playerMatch = playerText.match(/(\d+)/);
      return playerMatch ? parseInt(playerMatch[1]) : 0;
    }

    getWaveNumber(monster) {
      const monsterText = monster.textContent.toLowerCase();
      if (monsterText.includes('wave 1')) return 1;
      if (monsterText.includes('wave 2')) return 2;
      if (monsterText.includes('continue')) return 0; // Continue battles first
      return 3; // Unknown waves last
    }

    toggleMonsterImages() {
      const images = document.querySelectorAll('.monster-card img, .monster-item img');
      images.forEach(img => {
        img.style.display = this.filterSettings.hideImages ? 'none' : '';
      });
    }

    updateFilterStats(filtered, total) {
      // Update or create filter stats display
      let statsEl = document.querySelector('.filter-stats');
      if (!statsEl) {
        statsEl = document.createElement('div');
        statsEl.className = 'filter-stats';
        const filterPanel = document.querySelector('.advanced-monster-filters');
        filterPanel.appendChild(statsEl);
      }

      statsEl.innerHTML = `
        <span class="stats-text">
          Showing ${filtered} of ${total} monsters
          ${filtered !== total ? `(${total - filtered} hidden)` : ''}
        </span>
      `;
    }

    applyPreset(presetName) {
      switch (presetName) {
        case 'low-hp':
          this.filterSettings = {
            ...this.filterSettings,
            hpFilter: 'low',
            sortBy: 'hp'
          };
          break;
          
        case 'continue-battles':
          this.filterSettings = {
            ...this.filterSettings,
            waveFilter: 'continue',
            sortBy: 'hp'
          };
          break;
          
        case 'empty-battles':
          this.filterSettings = {
            ...this.filterSettings,
            playerCountFilter: 'empty',
            sortBy: 'hp'
          };
          break;
          
        case 'orcs-only':
          this.filterSettings = {
            ...this.filterSettings,
            monsterTypeFilter: this.availableMonsterTypes.filter(type => type.includes('Orc'))
          };
          break;
      }

      this.updateFilterUI();
      this.applyFilters();
      
      window.GameEnhancement?.NotificationSystem?.success(`Applied ${presetName} preset`);
    }

    clearAllFilters() {
      this.filterSettings = {
        nameFilter: "",
        waveFilter: "all",
        hpFilter: "all",
        playerCountFilter: "all",
        monsterTypeFilter: [],
        hideImages: false,
        sortBy: "hp"
      };

      this.updateFilterUI();
      this.applyFilters();
      
      window.GameEnhancement?.NotificationSystem?.info('All filters cleared');
    }

    updateFilterUI() {
      // Update all filter inputs to match current settings
      document.getElementById('name-filter').value = this.filterSettings.nameFilter;
      document.getElementById('wave-filter').value = this.filterSettings.waveFilter;
      document.getElementById('hp-filter').value = this.filterSettings.hpFilter;
      document.getElementById('player-count-filter').value = this.filterSettings.playerCountFilter;
      document.getElementById('sort-filter').value = this.filterSettings.sortBy;
      document.getElementById('hide-images').checked = this.filterSettings.hideImages;

      // Update monster type checkboxes
      document.querySelectorAll('#monster-type-grid input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = this.filterSettings.monsterTypeFilter.includes(checkbox.value);
      });
    }

    saveCurrentAsPreset() {
      const presetName = prompt('Enter a name for this preset:');
      if (!presetName) return;

      // Save to localStorage (could be enhanced to use chrome.storage)
      const presets = JSON.parse(localStorage.getItem('monster-filter-presets') || '{}');
      presets[presetName] = { ...this.filterSettings };
      localStorage.setItem('monster-filter-presets', JSON.stringify(presets));

      window.GameEnhancement?.NotificationSystem?.success(`Preset "${presetName}" saved`);
    }

    async loadSavedFilters() {
      try {
        const result = await chrome.storage.local.get('monster-filter-settings');
        if (result['monster-filter-settings']) {
          this.filterSettings = { ...this.filterSettings, ...result['monster-filter-settings'] };
          this.updateFilterUI();
        }
      } catch (error) {
        console.warn('Could not load saved filter settings:', error);
      }
    }

    async saveFilterSettings() {
      try {
        await chrome.storage.local.set({ 'monster-filter-settings': this.filterSettings });
      } catch (error) {
        console.warn('Could not save filter settings:', error);
      }
    }

    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
  }

  // Initialize function
  window.initAdvancedMonsterFilters = function(config = {}) {
    const filters = new AdvancedMonsterFilters();
    filters.init();
    return filters;
  };
})();