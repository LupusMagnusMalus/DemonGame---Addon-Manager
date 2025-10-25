// Basic Monster Filtering aus GonBruck
(function() {
  'use strict';

  class MonsterFilters {
    constructor() {
      this.filters = {
        name: '',
        hp: 'all',
        playerCount: 'all'
      };
      this.monsters = [];
    }

    init() {
      if (!window.location.pathname.includes('active_wave.php')) return;
      
      console.log('🔍 Initializing Basic Monster Filters');
      
      this.extractMonsterData();
      this.createFilterUI();
      this.setupFilterEventListeners();
      this.addMonsterEnhancements();
    }

    extractMonsterData() {
      const monsterElements = document.querySelectorAll('.monster-card, .monster-item, .battle-card');
      
      monsterElements.forEach(element => {
        const monsterData = this.extractSingleMonsterData(element);
        this.monsters.push(monsterData);
      });

      console.log(`Found ${this.monsters.length} monsters`);
    }

    extractSingleMonsterData(element) {
      const name = element.querySelector('.monster-name, h3, h4, .battle-title')?.textContent.trim() || 'Unknown Monster';
      
      // Extract HP percentage
      const hpText = element.querySelector('.monster-hp, .hp, .health')?.textContent || '';
      const hpMatch = hpText.match(/(\d+)%/);
      const hpPercent = hpMatch ? parseInt(hpMatch[1]) : 100;
      
      // Extract player count
      const playerText = element.querySelector('.player-count, .players')?.textContent || '';
      const playerMatch = playerText.match(/(\d+)/);
      const playerCount = playerMatch ? parseInt(playerMatch[1]) : 0;
      
      // Extract wave information
      const waveText = element.textContent.toLowerCase();
      let wave = 'unknown';
      if (waveText.includes('wave 1')) wave = '1';
      else if (waveText.includes('wave 2')) wave = '2';
      else if (waveText.includes('continue')) wave = 'continue';

      return {
        element,
        name,
        hpPercent,
        playerCount,
        wave
      };
    }

    createFilterUI() {
      const monstersContainer = document.querySelector('.monster-container, .battles-container');
      if (!monstersContainer) return;

      const filterContainer = document.createElement('div');
      filterContainer.className = 'monster-filter-container';
      filterContainer.innerHTML = `
        <div class="filter-panel">
          <div class="filter-header">
            <h3>🔍 Monster Filters</h3>
            <button class="filter-toggle-btn" id="filter-toggle">Hide Filters</button>
          </div>
          
          <div class="filter-content" id="filter-content">
            <div class="filter-row">
              <div class="filter-group">
                <label for="monster-name-filter">Monster Name:</label>
                <input type="text" id="monster-name-filter" placeholder="Search by name...">
              </div>
              
              <div class="filter-group">
                <label for="monster-hp-filter">HP Level:</label>
                <select id="monster-hp-filter">
                  <option value="all">All HP Levels</option>
                  <option value="empty">Empty (0%)</option>
                  <option value="low">Low (1-25%)</option>
                  <option value="medium">Medium (26-75%)</option>
                  <option value="high">High (76-99%)</option>
                  <option value="full">Full (100%)</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label for="monster-player-filter">Player Count:</label>
                <select id="monster-player-filter">
                  <option value="all">All Player Counts</option>
                  <option value="empty">Empty (0 players)</option>
                  <option value="few">Few (1-2 players)</option>
                  <option value="many">Many (3-5 players)</option>
                  <option value="full">Full (6+ players)</option>
                </select>
              </div>
            </div>
            
            <div class="filter-actions">
              <button id="apply-filters" class="filter-btn primary">Apply Filters</button>
              <button id="clear-filters" class="filter-btn secondary">Clear All</button>
            </div>
            
            <div class="quick-filters">
              <span class="quick-filter-label">Quick Filters:</span>
              <button class="quick-filter-btn" data-filter="low-hp">Low HP</button>
              <button class="quick-filter-btn" data-filter="empty-battles">Empty Battles</button>
              <button class="quick-filter-btn" data-filter="continue-battles">Continue Battles</button>
            </div>
          </div>
          
          <div class="filter-stats">
            <span class="stats-text">
              Showing <span id="visible-monsters">${this.monsters.length}</span> of ${this.monsters.length} monsters
            </span>
          </div>
        </div>
      `;

      monstersContainer.parentNode.insertBefore(filterContainer, monstersContainer);
      this.addFilterCSS();
    }

    setupFilterEventListeners() {
      // Toggle filter panel
      const toggleBtn = document.getElementById('filter-toggle');
      const filterContent = document.getElementById('filter-content');
      
      toggleBtn?.addEventListener('click', () => {
        const isHidden = filterContent.style.display === 'none';
        filterContent.style.display = isHidden ? 'block' : 'none';
        toggleBtn.textContent = isHidden ? 'Hide Filters' : 'Show Filters';
      });

      // Filter inputs
      document.getElementById('monster-name-filter')?.addEventListener('input', () => {
        this.filters.name = document.getElementById('monster-name-filter').value;
        this.debounceApplyFilters();
      });

      document.getElementById('monster-hp-filter')?.addEventListener('change', () => {
        this.filters.hp = document.getElementById('monster-hp-filter').value;
        this.applyFilters();
      });

      document.getElementById('monster-player-filter')?.addEventListener('change', () => {
        this.filters.playerCount = document.getElementById('monster-player-filter').value;
        this.applyFilters();
      });

      // Filter actions
      document.getElementById('apply-filters')?.addEventListener('click', () => {
        this.applyFilters();
      });

      document.getElementById('clear-filters')?.addEventListener('click', () => {
        this.clearAllFilters();
      });

      // Quick filters
      document.querySelectorAll('.quick-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.applyQuickFilter(btn.dataset.filter);
        });
      });

      // Debounced apply for name filter
      this.debounceApplyFilters = this.debounce(() => {
        this.applyFilters();
      }, 300);
    }

    applyFilters() {
      let visibleCount = 0;

      this.monsters.forEach(monster => {
        const shouldShow = this.passesFilters(monster);
        
        monster.element.style.display = shouldShow ? '' : 'none';
        
        if (shouldShow) {
          visibleCount++;
        }
      });

      this.updateFilterStats(visibleCount);
      console.log(`Applied filters: ${visibleCount}/${this.monsters.length} monsters visible`);
    }

    passesFilters(monster) {
      // Name filter
      if (this.filters.name) {
        if (!monster.name.toLowerCase().includes(this.filters.name.toLowerCase())) {
          return false;
        }
      }

      // HP filter
      if (this.filters.hp !== 'all') {
        if (!this.passesHPFilter(monster)) {
          return false;
        }
      }

      // Player count filter
      if (this.filters.playerCount !== 'all') {
        if (!this.passesPlayerCountFilter(monster)) {
          return false;
        }
      }

      return true;
    }

    passesHPFilter(monster) {
      const hp = monster.hpPercent;
      
      switch (this.filters.hp) {
        case 'empty': return hp === 0;
        case 'low': return hp > 0 && hp <= 25;
        case 'medium': return hp > 25 && hp <= 75;
        case 'high': return hp > 75 && hp < 100;
        case 'full': return hp === 100;
        default: return true;
      }
    }

    passesPlayerCountFilter(monster) {
      const count = monster.playerCount;
      
      switch (this.filters.playerCount) {
        case 'empty': return count === 0;
        case 'few': return count >= 1 && count <= 2;
        case 'many': return count >= 3 && count <= 5;
        case 'full': return count >= 6;
        default: return true;
      }
    }

    clearAllFilters() {
      this.filters = {
        name: '',
        hp: 'all',
        playerCount: 'all'
      };

      // Reset UI
      document.getElementById('monster-name-filter').value = '';
      document.getElementById('monster-hp-filter').value = 'all';
      document.getElementById('monster-player-filter').value = 'all';

      this.applyFilters();
      
      window.GameEnhancement?.NotificationSystem?.info('All filters cleared');
    }

    applyQuickFilter(filterType) {
      this.clearAllFilters();
      
      switch (filterType) {
        case 'low-hp':
          this.filters.hp = 'low';
          document.getElementById('monster-hp-filter').value = 'low';
          break;
          
        case 'empty-battles':
          this.filters.playerCount = 'empty';
          document.getElementById('monster-player-filter').value = 'empty';
          break;
          
        case 'continue-battles':
          // Filter by monsters with "continue" in the text
          this.filters.name = 'continue';
          document.getElementById('monster-name-filter').value = 'continue';
          break;
      }

      this.applyFilters();
      
      const filterName = filterType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
      window.GameEnhancement?.NotificationSystem?.success(`Applied ${filterName} filter`);
    }

    updateFilterStats(visibleCount) {
      const statsElement = document.getElementById('visible-monsters');
      if (statsElement) {
        statsElement.textContent = visibleCount;
      }

      const statsContainer = document.querySelector('.filter-stats');
      if (statsContainer) {
        const totalCount = this.monsters.length;
        const hiddenCount = totalCount - visibleCount;
        
        statsContainer.innerHTML = `
          <span class="stats-text">
            Showing ${visibleCount} of ${totalCount} monsters
            ${hiddenCount > 0 ? `(${hiddenCount} hidden)` : ''}
          </span>
        `;
      }
    }

    addMonsterEnhancements() {
      // Add HP indicators to monsters
      this.addHPIndicators();
      
      // Add player count indicators
      this.addPlayerCountIndicators();
      
      // Add quick action buttons
      this.addQuickActionButtons();
    }

    addHPIndicators() {
      this.monsters.forEach(monster => {
        if (monster.hpPercent !== null) {
          const indicator = this.createHPIndicator(monster.hpPercent);
          monster.element.appendChild(indicator);
        }
      });
    }

    createHPIndicator(hpPercent) {
      const indicator = document.createElement('div');
      indicator.className = 'hp-indicator';
      
      const hpClass = this.getHPClass(hpPercent);
      
      indicator.innerHTML = `
        <div class="hp-bar">
          <div class="hp-fill ${hpClass}" style="width: ${hpPercent}%"></div>
        </div>
        <span class="hp-text">${hpPercent}%</span>
      `;
      
      indicator.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: rgba(30, 30, 46, 0.9);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        z-index: 10;
        min-width: 50px;
      `;

      // Make monster container relative if not already
      if (getComputedStyle(monster.element).position === 'static') {
        monster.element.style.position = 'relative';
      }

      return indicator;
    }

    getHPClass(hpPercent) {
      if (hpPercent === 0) return 'hp-empty';
      if (hpPercent <= 25) return 'hp-low';
      if (hpPercent <= 75) return 'hp-medium';
      if (hpPercent < 100) return 'hp-high';
      return 'hp-full';
    }

    addPlayerCountIndicators() {
      this.monsters.forEach(monster => {
        if (monster.playerCount !== null) {
          const indicator = this.createPlayerCountIndicator(monster.playerCount);
          monster.element.appendChild(indicator);
        }
      });
    }

    createPlayerCountIndicator(playerCount) {
      const indicator = document.createElement('div');
      indicator.className = 'player-count-indicator';
      
      const countClass = this.getPlayerCountClass(playerCount);
      
      indicator.innerHTML = `
        <span class="player-icon">👥</span>
        <span class="player-count-text ${countClass}">${playerCount}</span>
      `;
      
      indicator.style.cssText = `
        position: absolute;
        bottom: 5px;
        left: 5px;
        background: rgba(30, 30, 46, 0.9);
        padding: 3px 6px;
        border-radius: 4px;
        font-size: 10px;
        color: #cdd6f4;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 3px;
      `;

      // Make monster container relative if not already
      if (getComputedStyle(monster.element).position === 'static') {
        monster.element.style.position = 'relative';
      }

      return indicator;
    }

    getPlayerCountClass(playerCount) {
      if (playerCount === 0) return 'count-empty';
      if (playerCount <= 2) return 'count-few';
      if (playerCount <= 5) return 'count-many';
      return 'count-full';
    }

    addQuickActionButtons() {
      this.monsters.forEach(monster => {
        const actions = this.createQuickActionButtons(monster);
        monster.element.appendChild(actions);
      });
    }

    createQuickActionButtons(monster) {
      const actions = document.createElement('div');
      actions.className = 'monster-quick-actions';
      actions.innerHTML = `
        <button class="quick-action-btn battle-btn" title="Join Battle">⚔️</button>
        <button class="quick-action-btn info-btn" title="Monster Info">ℹ️</button>
      `;
      
      actions.style.cssText = `
        position: absolute;
        bottom: 5px;
        right: 5px;
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.2s ease;
        z-index: 10;
      `;

      // Show actions on hover
      monster.element.addEventListener('mouseenter', () => {
        actions.style.opacity = '1';
      });

      monster.element.addEventListener('mouseleave', () => {
        actions.style.opacity = '0';
      });

      // Setup action listeners
      actions.querySelector('.battle-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.joinBattle(monster);
      });

      actions.querySelector('.info-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showMonsterInfo(monster);
      });

      return actions;
    }

    joinBattle(monster) {
      window.GameEnhancement?.NotificationSystem?.info(`Joining battle against ${monster.name}...`);
      
      // Simulate joining battle
      setTimeout(() => {
        window.GameEnhancement?.NotificationSystem?.success(`Joined battle against ${monster.name}!`);
      }, 1000);
    }

    showMonsterInfo(monster) {
      const modal = this.createMonsterInfoModal(monster);
      document.body.appendChild(modal);
    }

    createMonsterInfoModal(monster) {
      const modal = document.createElement('div');
      modal.className = 'monster-info-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>👹 ${monster.name}</h3>
            <button class="modal-close">×</button>
          </div>
          
          <div class="modal-body">
            <div class="monster-details">
              <div class="detail-row">
                <span class="detail-label">HP:</span>
                <span class="detail-value">${monster.hpPercent}%</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Players Fighting:</span>
                <span class="detail-value">${monster.playerCount}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Wave:</span>
                <span class="detail-value">${monster.wave}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Battle Status:</span>
                <span class="detail-value">${this.getBattleStatus(monster)}</span>
              </div>
            </div>
            
            <div class="battle-recommendation">
              <h4>💡 Recommendation</h4>
              <p>${this.getBattleRecommendation(monster)}</p>
            </div>
            
            <div class="monster-actions">
              <button class="modal-btn primary">Join Battle</button>
              <button class="modal-btn secondary">Watch Battle</button>
            </div>
          </div>
        </div>
      `;
      
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
      
      modal.querySelector('.modal-close')?.addEventListener('click', () => modal.remove());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
      
      return modal;
    }

    getBattleStatus(monster) {
      if (monster.hpPercent === 0) return 'Defeated';
      if (monster.playerCount === 0) return 'Waiting for players';
      if (monster.playerCount >= 6) return 'Battle full';
      return 'Active battle';
    }

    getBattleRecommendation(monster) {
      if (monster.hpPercent === 0) {
        return 'This monster has been defeated. Look for other battles.';
      }
      
      if (monster.playerCount === 0) {
        return 'No players fighting yet - great opportunity to get first hits!';
      }
      
      if (monster.playerCount >= 6) {
        return 'Battle is full. Wait for space or find another monster.';
      }
      
      if (monster.hpPercent <= 25) {
        return 'Low HP - join quickly for potential killing blow rewards!';
      }
      
      if (monster.hpPercent === 100) {
        return 'Fresh monster - good for consistent damage and experience.';
      }
      
      return 'Active battle with moderate HP - good chance for rewards.';
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

    addFilterCSS() {
      const style = document.createElement('style');
      style.textContent = `
        .monster-filter-container {
          background: #1e1e2e;
          border: 1px solid #45475a;
          border-radius: 8px;
          margin-bottom: 20px;
          overflow: hidden;
        }
        
        .filter-panel {
          position: relative;
        }
        
        .filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background: linear-gradient(90deg, rgba(116, 192, 252, 0.1), rgba(203, 166, 247, 0.1));
          border-bottom: 1px solid #45475a;
        }
        
        .filter-header h3 {
          margin: 0;
          color: #74c0fc;
          font-size: 16px;
          font-weight: 600;
        }
        
        .filter-toggle-btn {
          padding: 6px 12px;
          background: rgba(203, 166, 247, 0.2);
          border: 1px solid #cba6f7;
          border-radius: 4px;
          color: #cba6f7;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }
        
        .filter-toggle-btn:hover {
          background: rgba(203, 166, 247, 0.3);
        }
        
        .filter-content {
          padding: 20px;
        }
        
        .filter-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .filter-group label {
          color: #f9e2af;
          font-size: 13px;
          font-weight: 500;
        }
        
        .filter-group input[type="text"],
        .filter-group select {
          padding: 8px 12px;
          background: #313244;
          border: 1px solid #45475a;
          border-radius: 4px;
          color: #cdd6f4;
          font-size: 14px;
        }
        
        .filter-group input[type="text"]:focus,
        .filter-group select:focus {
          outline: none;
          border-color: #cba6f7;
        }
        
        .filter-group input[type="text"]::placeholder {
          color: #6c7086;
        }
        
        .filter-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-bottom: 15px;
        }
        
        .filter-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .filter-btn.primary {
          background: #a6e3a1;
          color: #1e1e2e;
        }
        
        .filter-btn.primary:hover {
          background: #94e2d5;
          transform: translateY(-1px);
        }
        
        .filter-btn.secondary {
          background: #45475a;
          color: #cdd6f4;
          border: 1px solid #6c7086;
        }
        
        .filter-btn.secondary:hover {
          background: #585b70;
        }
        
        .quick-filters {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .quick-filter-label {
          color: #a6adc8;
          font-size: 13px;
          font-weight: 500;
        }
        
        .quick-filter-btn {
          padding: 4px 10px;
          background: rgba(116, 192, 252, 0.1);
          border: 1px solid rgba(116, 192, 252, 0.3);
          border-radius: 12px;
          color: #74c0fc;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .quick-filter-btn:hover {
          background: rgba(116, 192, 252, 0.2);
          transform: translateY(-1px);
        }
        
        .filter-stats {
          padding: 10px 20px;
          background: rgba(249, 226, 175, 0.05);
          border-top: 1px solid rgba(249, 226, 175, 0.1);
          text-align: center;
          font-size: 13px;
          color: #f9e2af;
        }
        
        /* HP Indicator Styles */
        .hp-indicator {
          color: #cdd6f4;
        }
        
        .hp-bar {
          width: 40px;
          height: 4px;
          background: #45475a;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 2px;
        }
        
        .hp-fill {
          height: 100%;
          transition: width 0.3s ease;
        }
        
        .hp-fill.hp-empty {
          background: #6c7086;
        }
        
        .hp-fill.hp-low {
          background: #f38ba8;
        }
        
        .hp-fill.hp-medium {
          background: #f9e2af;
        }
        
        .hp-fill.hp-high {
          background: #74c0fc;
        }
        
        .hp-fill.hp-full {
          background: #a6e3a1;
        }
        
        .hp-text {
          font-weight: 600;
        }
        
        /* Player Count Indicator Styles */
        .player-count-indicator .player-icon {
          font-size: 10px;
        }
        
        .count-empty {
          color: #6c7086;
        }
        
        .count-few {
          color: #f9e2af;
        }
        
        .count-many {
          color: #74c0fc;
        }
        
        .count-full {
          color: #f38ba8;
        }
        
        /* Quick Action Buttons */
        .quick-action-btn {
          width: 24px;
          height: 24px;
          background: #45475a;
          border: none;
          border-radius: 4px;
          color: #cdd6f4;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .quick-action-btn:hover {
          background: #585b70;
          transform: scale(1.1);
        }
        
        .battle-btn:hover {
          background: #a6e3a1;
          color: #1e1e2e;
        }
        
        .info-btn:hover {
          background: #74c0fc;
          color: #1e1e2e;
        }
        
        /* Monster Info Modal */
        .monster-info-modal .modal-content {
          background: #1e1e2e;
          border: 1px solid #45475a;
          border-radius: 8px;
          min-width: 400px;
          max-width: 500px;
        }
        
        .monster-info-modal .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #45475a;
        }
        
        .monster-info-modal .modal-header h3 {
          color: #f9e2af;
          margin: 0;
        }
        
        .monster-info-modal .modal-close {
          background: none;
          border: none;
          color: #cdd6f4;
          font-size: 24px;
          cursor: pointer;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        
        .monster-info-modal .modal-close:hover {
          background: #45475a;
        }
        
        .monster-info-modal .modal-body {
          padding: 20px;
        }
        
        .monster-details {
          margin-bottom: 20px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(69, 71, 90, 0.3);
        }
        
        .detail-label {
          color: #a6adc8;
          font-weight: 500;
        }
        
        .detail-value {
          color: #cdd6f4;
          font-weight: 600;
        }
        
        .battle-recommendation {
          background: #313244;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        
        .battle-recommendation h4 {
          color: #f9e2af;
          margin: 0 0 8px 0;
          font-size: 14px;
        }
        
        .battle-recommendation p {
          color: #cdd6f4;
          margin: 0;
          font-size: 13px;
          line-height: 1.4;
        }
        
        .monster-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        
        .modal-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .modal-btn.primary {
          background: #a6e3a1;
          color: #1e1e2e;
        }
        
        .modal-btn.primary:hover {
          background: #94e2d5;
        }
        
        .modal-btn.secondary {
          background: #45475a;
          color: #cdd6f4;
        }
        
        .modal-btn.secondary:hover {
          background: #585b70;
        }
      `;
      
      document.head.appendChild(style);
    }
  }

  // Initialize function
  window.initMonsterFilters = function(config = {}) {
    const monsterFilters = new MonsterFilters();
    monsterFilters.init();
    return monsterFilters;
  };
})();