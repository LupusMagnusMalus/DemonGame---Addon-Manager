// Advanced Sidebar with Stats & Quick Access by Asura (v2.0)
(function() {
  'use strict';

  class AdvancedSidebar {
    constructor() {
      this.settings = null;
      this.statsUpdateInterval = null;
      this.pinnedItems = {
        merchant: [],
        inventory: []
      };
    }

    async init() {
      console.log('🎛️ Initializing Advanced Sidebar');
      
      await this.loadSettings();
      this.createAdvancedSidebar();
      this.initExpandableSections();
      this.setupEventListeners();
      this.fetchAndUpdateStats();
      this.startStatsUpdater();
      this.initQuickAccess();
    }

    async loadSettings() {
      try {
        const result = await chrome.storage.local.get('game-enhancement-config');
        const config = result['game-enhancement-config'];
        
        this.settings = {
          sidebarColor: '#1e1e2e',
          backgroundColor: '#000000',
          statsExpanded: false,
          merchantExpanded: false,
          inventoryExpanded: false,
          pinnedMerchantItems: [],
          pinnedInventoryItems: [],
          pinnedItemsLimit: 3,
          ...config?.asura
        };
      } catch (error) {
        console.warn('Could not load settings:', error);
        this.settings = this.getDefaultSettings();
      }
    }

    getDefaultSettings() {
      return {
        sidebarColor: '#1e1e2e',
        backgroundColor: '#000000',
        statsExpanded: false,
        merchantExpanded: false,
        inventoryExpanded: false,
        pinnedMerchantItems: [],
        pinnedInventoryItems: [],
        pinnedItemsLimit: 3
      };
    }

    createAdvancedSidebar() {
      // Remove existing sidebar if present
      const existingSidebar = document.getElementById('game-sidebar');
      if (existingSidebar) {
        existingSidebar.remove();
      }

      // Create main wrapper structure
      this.createWrapperStructure();
      
      // Create advanced sidebar
      const sidebar = document.createElement('aside');
      sidebar.id = 'game-sidebar';
      sidebar.innerHTML = this.getAdvancedSidebarHTML();
      
      const mainWrapper = document.querySelector('.main-wrapper');
      mainWrapper.insertBefore(sidebar, mainWrapper.firstChild);
      
      this.applyCurrentTheme();
    }

    createWrapperStructure() {
      if (document.querySelector('.main-wrapper')) return;
      
      const mainWrapper = document.createElement('div');
      mainWrapper.className = 'main-wrapper';
      
      const contentArea = document.createElement('div');
      contentArea.className = 'content-area';
      
      // Move existing content
      const existingContainer = document.querySelector('.container') || document.querySelector('.wrap');
      if (existingContainer) {
        contentArea.appendChild(existingContainer);
      } else {
        // Move all body children except topbar
        const children = Array.from(document.body.children);
        children.forEach(child => {
          if (!child.classList.contains('game-topbar') && !child.classList.contains('topbar')) {
            contentArea.appendChild(child);
          }
        });
      }
      
      mainWrapper.appendChild(contentArea);
      document.body.appendChild(mainWrapper);
      
      // Apply body styles
      document.body.style.paddingTop = "55px";
      document.body.style.paddingLeft = "0px";
      document.body.style.margin = "0px";
    }

    getAdvancedSidebarHTML() {
      return `
        <div class="sidebar-header">
          <a href="game_dash.php" style="text-decoration:none;">
            <h2>Game Menu</h2>
          </a>
        </div>

        <ul class="sidebar-menu">
          <li>
            <a href="pvp.php">
              <img src="/images/pvp/season_1/compressed_menu_pvp_season_1.webp" alt="PvP Arena"> 
              PvP Arena
            </a>
          </li>
          
          <li>
            <a href="orc_cull_event.php">
              <img src="/images/events/orc_cull/banner.webp" alt="Event"> 
              War Drums of GRAKTHAR
            </a>
          </li>
          
          <li>
            <a href="active_wave.php?gate=3&wave=3">
              <img src="images/gates/gate_688e438aba7f24.99262397.webp" alt="Gate"> 
              Gate Grakthar
            </a>
          </li>

          <!-- Stats with Expandable Section -->
          <li>
            <div class="sidebar-menu-expandable">
              <a href="stats.php" draggable="false">
                <img src="images/menu/compressed_stats_menu.webp" alt="Stats"> 
                <span id="stats-menu-text">Stats ⚔️<span id="sidebar-attack">-</span> 🛡️<span id="sidebar-defense">-</span> ⚡<span id="sidebar-stamina">-</span> 🔵<span id="sidebar-points">-</span></span>
              </a>
              <button class="expand-btn" id="stats-expand-btn">${this.settings.statsExpanded ? '–' : '+'}</button>
            </div>
            <div id="stats-expanded" class="sidebar-submenu ${this.settings.statsExpanded ? '' : 'collapsed'}">
              ${this.getStatsAllocationHTML()}
            </div>
          </li>

          <li>
            <a href="inventory.php">
              <img src="images/menu/compressed_chest.webp" alt="Inventory"> 
              Inventory & Equipment
            </a>
          </li>

          <li>
            <a href="pets.php">
              <img src="images/menu/compressed_pets.webp" alt="Pets"> 
              Pets & Eggs
            </a>
          </li>

          <li>
            <a href="blacksmith.php">
              <img src="images/menu/compressed_blacksmith.webp" alt="Blacksmith"> 
              Blacksmith
            </a>
          </li>

          <!-- Merchant with Quick Access -->
          <li>
            <div class="sidebar-menu-expandable">
              <a href="merchant.php">
                <img src="images/menu/compressed_merchant.webp" alt="Merchant"> 
                Merchant
              </a>
              <button class="expand-btn" id="merchant-expand-btn">${this.settings.merchantExpanded ? '–' : '+'}</button>
            </div>
            <div id="merchant-expanded" class="sidebar-submenu ${this.settings.merchantExpanded ? '' : 'collapsed'}">
              <div class="quick-access-section" id="merchant-quick-access">
                <div class="quick-access-empty">Visit merchant page to pin items for quick access</div>
              </div>
            </div>
          </li>

          <!-- Inventory Quick Access -->
          <li>
            <div class="sidebar-menu-expandable">
              <a href="inventory.php">
                <img src="images/menu/compressed_chest.webp" alt="Inventory"> 
                Inventory Quick Access
              </a>
              <button class="expand-btn" id="inventory-expand-btn">${this.settings.inventoryExpanded ? '–' : '+'}</button>
            </div>
            <div id="inventory-expanded" class="sidebar-submenu ${this.settings.inventoryExpanded ? '' : 'collapsed'}">
              <div class="quick-access-section" id="inventory-quick-access">
                <div class="quick-access-empty">No items pinned. Visit inventory page to pin items.</div>
              </div>
            </div>
          </li>

          <li>
            <a href="achievements.php">
              <img src="images/menu/compressed_achievement.webp" alt="Achievements"> 
              Achievements
            </a>
          </li>

          <li>
            <a href="collections.php">
              <img src="images/menu/compressed_collections.webp" alt="Collections"> 
              Collections
            </a>
          </li>

          <li>
            <a href="guide.php">
              <img src="images/menu/compressed_guide.webp" alt="Guide"> 
              How To Play
            </a>
          </li>

          <li>
            <a href="leaderboard.php">
              <img src="images/menu/compressed_leaderboard.webp" alt="Leaderboard"> 
              Weekly Leaderboard
            </a>
          </li>

          <li>
            <a href="chat.php">
              <img src="images/menu/compressed_chat.webp" alt="Chat"> 
              Global Chat
            </a>
          </li>

          <li>
            <a href="patches.php">
              <img src="images/menu/compressed_patches.webp" alt="Patches"> 
              Patch Notes
            </a>
          </li>

          <li>
            <a href="manga.php">
              <img src="images/menu/compressed_manga.webp" alt="Manga"> 
              Manga
            </a>
          </li>

          <!-- Settings Link -->
          <li>
            <a href="#" id="settings-link">
              <img src="images/menu/compressed_stats_menu.webp" alt="Settings"> 
              ⚙️ Settings
            </a>
          </li>
        </ul>
      `;
    }

    getStatsAllocationHTML() {
      return `
        <div class="stats-allocation-section">
          <div class="allocation-header">
            <h4>Quick Stat Allocation</h4>
          </div>
          
          <div class="stat-upgrade-row" data-stat="attack">
            <div class="stat-info">
              <span class="stat-icon">⚔️</span>
              <span class="stat-name">Attack:</span>
              <span class="stat-value" id="sidebar-attack-alloc">-</span>
            </div>
            <div class="upgrade-controls">
              <button class="upgrade-btn" data-amount="1">+1</button>
              <button class="upgrade-btn" data-amount="5">+5</button>
            </div>
          </div>

          <div class="stat-upgrade-row" data-stat="defense">
            <div class="stat-info">
              <span class="stat-icon">🛡️</span>
              <span class="stat-name">Defense:</span>
              <span class="stat-value" id="sidebar-defense-alloc">-</span>
            </div>
            <div class="upgrade-controls">
              <button class="upgrade-btn" data-amount="1">+1</button>
              <button class="upgrade-btn" data-amount="5">+5</button>
            </div>
          </div>

          <div class="stat-upgrade-row" data-stat="stamina">
            <div class="stat-info">
              <span class="stat-icon">⚡</span>
              <span class="stat-name">Stamina:</span>
              <span class="stat-value" id="sidebar-stamina-alloc">-</span>
            </div>
            <div class="upgrade-controls">
              <button class="upgrade-btn" data-amount="1">+1</button>
              <button class="upgrade-btn" data-amount="5">+5</button>
            </div>
          </div>

          <div class="points-display">
            <span>Available Points: </span>
            <span class="points-value" id="sidebar-points-alloc">-</span>
          </div>
        </div>
      `;
    }

    initExpandableSections() {
      // Stats section
      const statsBtn = document.getElementById('stats-expand-btn');
      const statsContent = document.getElementById('stats-expanded');
      
      statsBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSection('stats', statsContent, statsBtn);
      });

      // Merchant section
      const merchantBtn = document.getElementById('merchant-expand-btn');
      const merchantContent = document.getElementById('merchant-expanded');
      
      merchantBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSection('merchant', merchantContent, merchantBtn);
      });

      // Inventory section
      const inventoryBtn = document.getElementById('inventory-expand-btn');
      const inventoryContent = document.getElementById('inventory-expanded');
      
      inventoryBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSection('inventory', inventoryContent, inventoryBtn);
      });
    }

    toggleSection(sectionName, content, button) {
      const isCollapsed = content.classList.contains('collapsed');
      
      if (isCollapsed) {
        content.classList.remove('collapsed');
        button.textContent = '–';
        this.settings[`${sectionName}Expanded`] = true;
      } else {
        content.classList.add('collapsed');
        button.textContent = '+';
        this.settings[`${sectionName}Expanded`] = false;
      }
      
      this.saveSettings();
    }

    setupEventListeners() {
      // Stat allocation buttons
      document.querySelectorAll('.upgrade-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const amount = parseInt(btn.dataset.amount);
          const statType = btn.closest('.stat-upgrade-row').dataset.stat;
          this.allocateStats(statType, amount);
        });
      });

      // Settings link
      const settingsLink = document.getElementById('settings-link');
      settingsLink?.addEventListener('click', (e) => {
        e.preventDefault();
        this.showSettingsModal();
      });
    }

    async allocateStats(statType, amount) {
      try {
        // This would normally make an API call to allocate stats
        // For now, just show a notification
        window.GameEnhancement?.NotificationSystem?.info(`Allocating ${amount} points to ${statType}...`);
        
        // Simulate API call
        setTimeout(() => {
          window.GameEnhancement?.NotificationSystem?.success(`${amount} points allocated to ${statType}!`);
          this.fetchAndUpdateStats();
        }, 1000);
        
      } catch (error) {
        console.error('Stat allocation failed:', error);
        window.GameEnhancement?.NotificationSystem?.error('Failed to allocate stats');
      }
    }

    fetchAndUpdateStats() {
      // Extract stats from topbar or page content
      const topbar = document.querySelector('.game-topbar, .topbar');
      if (!topbar) return;

      const stats = this.extractStatsFromPage();
      
      // Update sidebar display
      this.updateStatsDisplay(stats);
    }

    extractStatsFromPage() {
      // This would extract actual stats from the game page
      // Implementation depends on the actual game HTML structure
      return {
        attack: 150,
        defense: 120,
        stamina: 100,
        points: 15
      };
    }

    updateStatsDisplay(stats) {
      // Update main menu stats
      const attackSpan = document.getElementById('sidebar-attack');
      const defenseSpan = document.getElementById('sidebar-defense');
      const staminaSpan = document.getElementById('sidebar-stamina');
      const pointsSpan = document.getElementById('sidebar-points');
      
      if (attackSpan) attackSpan.textContent = stats.attack || '-';
      if (defenseSpan) defenseSpan.textContent = stats.defense || '-';
      if (staminaSpan) staminaSpan.textContent = stats.stamina || '-';
      if (pointsSpan) pointsSpan.textContent = stats.points || '-';

      // Update allocation section
      const allocAttack = document.getElementById('sidebar-attack-alloc');
      const allocDefense = document.getElementById('sidebar-defense-alloc');
      const allocStamina = document.getElementById('sidebar-stamina-alloc');
      const allocPoints = document.getElementById('sidebar-points-alloc');
      
      if (allocAttack) allocAttack.textContent = stats.attack || '-';
      if (allocDefense) allocDefense.textContent = stats.defense || '-';
      if (allocStamina) allocStamina.textContent = stats.stamina || '-';
      if (allocPoints) allocPoints.textContent = stats.points || '-';
    }

    startStatsUpdater() {
      // Update stats every 30 seconds
      this.statsUpdateInterval = setInterval(() => {
        this.fetchAndUpdateStats();
      }, 30000);
    }

    initQuickAccess() {
      // Initialize quick access systems
      this.loadPinnedItems();
      this.setupQuickAccessButtons();
    }

    loadPinnedItems() {
      // Load pinned items from settings
      this.pinnedItems.merchant = this.settings.pinnedMerchantItems || [];
      this.pinnedItems.inventory = this.settings.pinnedInventoryItems || [];
      
      this.updateQuickAccessDisplay();
    }

    updateQuickAccessDisplay() {
      // Update merchant quick access
      const merchantSection = document.getElementById('merchant-quick-access');
      if (merchantSection) {
        if (this.pinnedItems.merchant.length === 0) {
          merchantSection.innerHTML = '<div class="quick-access-empty">Visit merchant page to pin items for quick access</div>';
        } else {
          merchantSection.innerHTML = this.generateQuickAccessHTML(this.pinnedItems.merchant, 'merchant');
        }
      }

      // Update inventory quick access
      const inventorySection = document.getElementById('inventory-quick-access');
      if (inventorySection) {
        if (this.pinnedItems.inventory.length === 0) {
          inventorySection.innerHTML = '<div class="quick-access-empty">No items pinned. Visit inventory page to pin items.</div>';
        } else {
          inventorySection.innerHTML = this.generateQuickAccessHTML(this.pinnedItems.inventory, 'inventory');
        }
      }
    }

    generateQuickAccessHTML(items, type) {
      return items.map(item => `
        <div class="quick-access-item" data-item-id="${item.id}" data-type="${type}">
          <img src="${item.image}" alt="${item.name}" class="item-icon">
          <div class="item-info">
            <span class="item-name">${item.name}</span>
            <span class="item-price">${item.price || 'N/A'}</span>
          </div>
          <div class="item-actions">
            <button class="quick-use-btn" title="Use/Buy">⚡</button>
            <button class="quick-unpin-btn" title="Unpin">📌</button>
          </div>
        </div>
      `).join('');
    }

    setupQuickAccessButtons() {
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-use-btn')) {
          e.preventDefault();
          const item = e.target.closest('.quick-access-item');
          this.useQuickAccessItem(item);
        }
        
        if (e.target.classList.contains('quick-unpin-btn')) {
          e.preventDefault();
          const item = e.target.closest('.quick-access-item');
          this.unpinItem(item);
        }
      });
    }

    async useQuickAccessItem(itemElement) {
      const itemId = itemElement.dataset.itemId;
      const type = itemElement.dataset.type;
      
      try {
        window.GameEnhancement?.NotificationSystem?.info(`Using ${type} item...`);
        
        // This would make an API call to use/buy the item
        // Implementation depends on game API
        
        setTimeout(() => {
          window.GameEnhancement?.NotificationSystem?.success('Item used successfully!');
        }, 1000);
        
      } catch (error) {
        console.error('Quick access item use failed:', error);
        window.GameEnhancement?.NotificationSystem?.error('Failed to use item');
      }
    }

    unpinItem(itemElement) {
      const itemId = itemElement.dataset.itemId;
      const type = itemElement.dataset.type;
      
      // Remove from pinned items
      this.pinnedItems[type] = this.pinnedItems[type].filter(item => item.id !== itemId);
      
      // Update settings
      this.settings[`pinned${type.charAt(0).toUpperCase() + type.slice(1)}Items`] = this.pinnedItems[type];
      this.saveSettings();
      
      // Update display
      this.updateQuickAccessDisplay();
      
      window.GameEnhancement?.NotificationSystem?.info('Item unpinned');
    }

    showSettingsModal() {
      // This would open the advanced settings modal
      // For now, just show a notification
      window.GameEnhancement?.NotificationSystem?.info('Settings modal would open here');
    }

    applyCurrentTheme() {
      const sidebar = document.getElementById('game-sidebar');
      if (sidebar && this.settings) {
        sidebar.style.background = this.settings.sidebarColor;
        document.body.style.backgroundColor = this.settings.backgroundColor;
      }
    }

    async saveSettings() {
      try {
        const result = await chrome.storage.local.get('game-enhancement-config');
        const config = result['game-enhancement-config'] || {};
        
        config.asura = { ...config.asura, ...this.settings };
        
        await chrome.storage.local.set({ 'game-enhancement-config': config });
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    }

    destroy() {
      if (this.statsUpdateInterval) {
        clearInterval(this.statsUpdateInterval);
      }
      
      const sidebar = document.getElementById('game-sidebar');
      if (sidebar) {
        sidebar.remove();
      }
    }
  }

  // Initialize function
  window.initAdvancedSidebar = function(config = {}) {
    const advancedSidebar = new AdvancedSidebar();
    advancedSidebar.init();
    return advancedSidebar;
  };
})();