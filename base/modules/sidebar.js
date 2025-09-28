// Basic Sidebar by GonBruck (modulised)
(function() {
  'use strict';

  class BaseSidebar {
    constructor() {
      this.sidebar = null;
      this.settings = null;
    }

    init() {
      console.log('🎯 Initializing Base Sidebar');
      
      // Skip if advanced sidebar is already present
      if (document.getElementById('game-sidebar')) {
        console.log('Sidebar already exists, skipping base sidebar');
        return;
      }

      this.createSidebarStructure();
      this.setupEventListeners();
      this.fetchAndUpdateStats();
      this.startStatsUpdater();
    }

    createSidebarStructure() {
      // Check if we need wrapper
      const noContainerPage = !document.querySelector('.container') && !document.querySelector('.wrap');
      
      if (noContainerPage) {
        this.createWrapper();
      }

      this.sidebar = document.createElement('aside');
      this.sidebar.id = 'game-sidebar';
      this.sidebar.innerHTML = this.getSidebarHTML();
      
      if (noContainerPage) {
        const wrapper = document.querySelector('.main-wrapper');
        wrapper.insertBefore(this.sidebar, wrapper.firstChild);
      } else {
        document.body.appendChild(this.sidebar);
      }

      // Apply basic styles
      this.applyBasicStyles();
    }

    createWrapper() {
      const mainWrapper = document.createElement('div');
      mainWrapper.className = 'main-wrapper';
      
      const contentArea = document.createElement('div');
      contentArea.className = 'content-area';
      
      // Move existing content
      const existingContainer = document.querySelector('.container') || document.querySelector('.wrap') || document.body;
      while (existingContainer.firstChild) {
        contentArea.appendChild(existingContainer.firstChild);
      }
      
      mainWrapper.appendChild(contentArea);
      document.body.appendChild(mainWrapper);
    }

    getSidebarHTML() {
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
              Event
            </a>
          </li>
          <li>
            <a href="active_wave.php?gate=3&wave=3">
              <img src="images/gates/gate_688e438aba7f24.99262397.webp" alt="Gate"> 
              Gate Grakthar
            </a>
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
            <a href="stats.php">
              <img src="images/menu/compressed_stats_menu.webp" alt="Stats"> 
              Stats
            </a>
          </li>
          <li>
            <a href="blacksmith.php">
              <img src="images/menu/compressed_blacksmith.webp" alt="Blacksmith"> 
              Blacksmith
            </a>
          </li>
          <li>
            <a href="merchant.php">
              <img src="images/menu/compressed_merchant.webp" alt="Merchant"> 
              Merchant
            </a>
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
        </ul>
      `;
    }

    applyBasicStyles() {
      // Body adjustments
      document.body.style.paddingTop = "55px";
      document.body.style.paddingLeft = "200px";
      document.body.style.margin = "0px";

      // Apply current theme
      const currentTheme = window.GameEnhancement?.ColorPalette?.getCurrentTheme();
      if (currentTheme) {
        window.GameEnhancement.ColorPalette.applySidebarColor(currentTheme.sidebar);
        window.GameEnhancement.ColorPalette.applyBackgroundColor(currentTheme.background);
      }
    }

    setupEventListeners() {
      // Future: Add event listeners for interactions
    }

    fetchAndUpdateStats() {
      // Future: Stats fetching logic
    }

    startStatsUpdater() {
      // Future: Periodic stats updates
    }
  }

  // Initialize function
  window.initBaseSidebar = function(config = {}) {
    const sidebar = new BaseSidebar();
    sidebar.init();
    return sidebar;
  };

  // Auto-initialize if no config system present
  if (!window.gameEnhancementManager) {
    window.initBaseSidebar();
  }
})();