// Collapsible Submenu System by Lupus
(function() {
  'use strict';

  class SubmenuManager {
    constructor() {
      this.submenuStates = new Map();
      this.cookiePrefix = 'submenu_';
    }

    init() {
      console.log('📂 Initializing Submenu Manager');
      
      this.addSubmenusToSidebar();
      this.restoreSubmenuStates();
      this.setupGlobalStyles();
    }

    addSubmenusToSidebar() {
      const sidebar = document.getElementById('game-sidebar');
      if (!sidebar) return;

      // Add submenu to Gate Grakthar
      this.addSubmenuToGateItem();
      
      // Add submenu to Event
      this.addSubmenuToEventItem();
      
      // Add submenu to Inventory (if enhanced)
      this.addSubmenuToInventoryItem();
    }

    addSubmenuToGateItem() {
      const gateLink = document.querySelector('a[href*="active_wave.php"]');
      if (!gateLink) return;

      const listItem = gateLink.parentElement;
      listItem.classList.add('has-submenu');
      
      // Create submenu container
      const submenuContainer = document.createElement('div');
      submenuContainer.className = 'submenu-container';
      
      // Create toggle button
      const toggle = document.createElement('button');
      toggle.className = 'submenu-toggle';
      toggle.innerHTML = '⯆';
      toggle.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSubmenu('gate', submenuContainer, toggle);
      };
      
      // Create submenu
      const submenu = document.createElement('div');
      submenu.className = 'submenu collapsed';
      submenu.innerHTML = `
        <a href="active_wave.php?gate=3&wave=3" class="submenu-item">
          <span class="submenu-icon">🌊</span>
          Wave 1
        </a>
        <a href="active_wave.php?gate=3&wave=5" class="submenu-item">
          <span class="submenu-icon">🌊</span>
          Wave 2
        </a>
      `;
      
      submenuContainer.appendChild(toggle);
      submenuContainer.appendChild(submenu);
      
      // Modify main link style
      gateLink.style.paddingRight = '45px';
      gateLink.style.position = 'relative';
      
      listItem.appendChild(submenuContainer);
    }

    addSubmenuToEventItem() {
      const eventLink = document.querySelector('a[href*="orc_cull_event.php"]');
      if (!eventLink) return;

      const listItem = eventLink.parentElement;
      listItem.classList.add('has-submenu');
      
      const submenuContainer = document.createElement('div');
      submenuContainer.className = 'submenu-container';
      
      const toggle = document.createElement('button');
      toggle.className = 'submenu-toggle';
      toggle.innerHTML = '⯆';
      toggle.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSubmenu('event', submenuContainer, toggle);
      };
      
      const submenu = document.createElement('div');
      submenu.className = 'submenu collapsed';
      submenu.innerHTML = `
        <a href="orc_cull_event.php" class="submenu-item">
          <span class="submenu-icon">📊</span>
          Event Status
        </a>
        <a href="active_wave.php?event=true" class="submenu-item">
          <span class="submenu-icon">⚔️</span>
          Event Battle
        </a>
      `;
      
      submenuContainer.appendChild(toggle);
      submenuContainer.appendChild(submenu);
      
      eventLink.style.paddingRight = '45px';
      eventLink.style.position = 'relative';
      
      listItem.appendChild(submenuContainer);
    }

    addSubmenuToInventoryItem() {
      const inventoryLink = document.querySelector('a[href*="inventory.php"]');
      if (!inventoryLink) return;

      const listItem = inventoryLink.parentElement;
      listItem.classList.add('has-submenu');
      
      const submenuContainer = document.createElement('div');
      submenuContainer.className = 'submenu-container';
      
      const toggle = document.createElement('button');
      toggle.className = 'submenu-toggle';
      toggle.innerHTML = '⯆';
      toggle.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSubmenu('inventory', submenuContainer, toggle);
      };
      
      const submenu = document.createElement('div');
      submenu.className = 'submenu collapsed';
      submenu.innerHTML = `
        <a href="inventory.php" class="submenu-item">
          <span class="submenu-icon">🎒</span>
          All Items
        </a>
        <a href="inventory.php?filter=equipment" class="submenu-item">
          <span class="submenu-icon">⚔️</span>
          Equipment
        </a>
        <a href="inventory.php?filter=consumables" class="submenu-item">
          <span class="submenu-icon">🧪</span>
          Consumables
        </a>
      `;
      
      submenuContainer.appendChild(toggle);
      submenuContainer.appendChild(submenu);
      
      inventoryLink.style.paddingRight = '45px';
      inventoryLink.style.position = 'relative';
      
      listItem.appendChild(submenuContainer);
    }

    toggleSubmenu(key, container, toggle) {
      const submenu = container.querySelector('.submenu');
      const isCollapsed = submenu.classList.contains('collapsed');
      
      if (isCollapsed) {
        submenu.classList.remove('collapsed');
        toggle.innerHTML = '⯅';
        this.saveSubmenuState(key, true);
      } else {
        submenu.classList.add('collapsed');
        toggle.innerHTML = '⯆';
        this.saveSubmenuState(key, false);
      }
    }

    saveSubmenuState(key, isOpen) {
      const expires = new Date();
      expires.setDate(expires.getDate() + 30); // 30 days
      
      document.cookie = `${this.cookiePrefix}${key}=${isOpen ? 'open' : 'closed'}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
      this.submenuStates.set(key, isOpen);
    }

    restoreSubmenuStates() {
      const cookies = document.cookie.split(';');
      
      cookies.forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name.startsWith(this.cookiePrefix)) {
          const key = name.replace(this.cookiePrefix, '');
          const isOpen = value === 'open';
          
          this.submenuStates.set(key, isOpen);
          
          if (isOpen) {
            setTimeout(() => this.openSubmenu(key), 100);
          }
        }
      });
    }

    openSubmenu(key) {
      const containers = document.querySelectorAll('.submenu-container');
      
      containers.forEach(container => {
        const toggle = container.querySelector('.submenu-toggle');
        const submenu = container.querySelector('.submenu');
        
        // This is a simplified approach - in a real implementation,
        // you'd want to identify containers by data attributes
        if (submenu && this.submenuStates.get(key)) {
          submenu.classList.remove('collapsed');
          toggle.innerHTML = '⯅';
        }
      });
    }

    setupGlobalStyles() {
      if (document.getElementById('submenu-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'submenu-styles';
      style.textContent = `
        .has-submenu {
          position: relative;
        }
        
        .submenu-container {
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
        }
        
        .submenu-toggle {
          background: none;
          border: none;
          color: #cdd6f4;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
          font-size: 14px;
        }
        
        .submenu-toggle:hover {
          background: rgba(203, 166, 247, 0.2);
          color: #cba6f7;
        }
        
        .submenu {
          position: absolute;
          top: 100%;
          right: 0;
          background: #313244;
          border: 1px solid #45475a;
          border-radius: 6px;
          min-width: 160px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          overflow: hidden;
          transition: all 0.3s ease;
          transform-origin: top right;
        }
        
        .submenu.collapsed {
          opacity: 0;
          transform: scale(0.95) translateY(-10px);
          pointer-events: none;
        }
        
        .submenu-item {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          color: #cdd6f4;
          text-decoration: none;
          transition: background 0.2s ease;
          gap: 8px;
          font-size: 13px;
        }
        
        .submenu-item:hover {
          background: rgba(203, 166, 247, 0.15);
          color: #cba6f7;
        }
        
        .submenu-icon {
          font-size: 12px;
          width: 16px;
          text-align: center;
        }
        
        /* Prevent submenu from being cut off */
        .sidebar-menu li:last-child .submenu {
          top: auto;
          bottom: 100%;
        }
      `;
      
      document.head.appendChild(style);
    }

    // Cleanup method
    destroy() {
      // Remove event listeners and clear states
      this.submenuStates.clear();
      
      // Remove submenu elements
      document.querySelectorAll('.submenu-container').forEach(el => el.remove());
      document.querySelectorAll('.has-submenu').forEach(el => {
        el.classList.remove('has-submenu');
      });
      
      // Remove styles
      const styles = document.getElementById('submenu-styles');
      if (styles) styles.remove();
    }
  }

  // Initialize function
  window.initSubmenuManager = function(config = {}) {
    const submenuManager = new SubmenuManager();
    submenuManager.init();
    return submenuManager;
  };
})();