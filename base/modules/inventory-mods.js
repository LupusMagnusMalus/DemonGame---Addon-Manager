// Inventory Page Enhancements aus GonBruck
(function() {
  'use strict';

  class InventoryMods {
    constructor() {
      this.currentView = 'list'; // 'list' oder 'grid'
      this.totalDamage = 0;
    }

    init() {
      if (!window.location.pathname.includes('inventory.php')) return;
      
      console.log('🎒 Initializing Inventory Mods');
      
      this.initViewToggle();
      this.calculateTotalDamage();
      this.addDamageDisplay();
      this.initItemEnhancements();
    }

    initViewToggle() {
      const inventoryContainer = document.querySelector('.inventory-container, .item-grid, .items');
      if (!inventoryContainer) return;

      // Create view toggle button
      const toggleContainer = document.createElement('div');
      toggleContainer.className = 'view-toggle-container';
      toggleContainer.style.cssText = `
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        background: #1e1e2e;
        border-radius: 6px;
        border: 1px solid #45475a;
      `;

      toggleContainer.innerHTML = `
        <div class="inventory-stats">
          <span class="item-count">Items: <span id="item-count">0</span></span>
          <span class="total-damage">Total Damage: <span id="total-item-damage">0</span></span>
        </div>
        <div class="view-controls">
          <button id="list-view-btn" class="view-btn active">📋 List</button>
          <button id="grid-view-btn" class="view-btn">⚏ Grid</button>
        </div>
      `;

      inventoryContainer.parentNode.insertBefore(toggleContainer, inventoryContainer);

      // Setup event listeners
      document.getElementById('list-view-btn').addEventListener('click', () => {
        this.switchView('list');
      });

      document.getElementById('grid-view-btn').addEventListener('click', () => {
        this.switchView('grid');
      });

      // Add CSS for view buttons
      this.addViewToggleCSS();
    }

    switchView(viewType) {
      this.currentView = viewType;
      
      const inventoryContainer = document.querySelector('.inventory-container, .item-grid, .items');
      const listBtn = document.getElementById('list-view-btn');
      const gridBtn = document.getElementById('grid-view-btn');

      // Update button states
      listBtn.classList.toggle('active', viewType === 'list');
      gridBtn.classList.toggle('active', viewType === 'grid');

      // Apply view styles
      if (viewType === 'grid') {
        inventoryContainer.classList.add('grid-view');
        inventoryContainer.classList.remove('list-view');
      } else {
        inventoryContainer.classList.add('list-view');
        inventoryContainer.classList.remove('grid-view');
      }

      // Save preference
      localStorage.setItem('inventory-view-preference', viewType);

      console.log(`Switched to ${viewType} view`);
    }

    calculateTotalDamage() {
      const items = document.querySelectorAll('.inventory-item, .item-card');
      let totalDamage = 0;
      let itemCount = 0;

      items.forEach(item => {
        itemCount++;
        
        // Extract damage from item
        const damageText = item.querySelector('.item-damage, .damage, .attack')?.textContent || '';
        const damageMatch = damageText.match(/(\d+)/);
        
        if (damageMatch) {
          totalDamage += parseInt(damageMatch[1]);
        }

        // Also check item description for damage
        const description = item.querySelector('.item-description, .tooltip')?.textContent || '';
        const descDamageMatch = description.match(/attack[:\s]*(\d+)|damage[:\s]*(\d+)/i);
        
        if (descDamageMatch) {
          const damage = parseInt(descDamageMatch[1] || descDamageMatch[2]);
          totalDamage += damage;
        }
      });

      this.totalDamage = totalDamage;
      
      // Update display
      const itemCountEl = document.getElementById('item-count');
      const totalDamageEl = document.getElementById('total-item-damage');
      
      if (itemCountEl) itemCountEl.textContent = itemCount;
      if (totalDamageEl) totalDamageEl.textContent = totalDamage.toLocaleString();
    }

    addDamageDisplay() {
      // Add damage indicators to individual items
      const items = document.querySelectorAll('.inventory-item, .item-card');
      
      items.forEach(item => {
        const damageInfo = this.extractItemDamage(item);
        if (damageInfo.damage > 0) {
          this.addDamageIndicator(item, damageInfo);
        }
      });
    }

    extractItemDamage(item) {
      const damageText = item.querySelector('.item-damage, .damage, .attack')?.textContent || '';
      const description = item.querySelector('.item-description, .tooltip')?.textContent || '';
      
      // Try to extract damage from various sources
      let damage = 0;
      let type = 'physical';

      // Direct damage text
      const directMatch = damageText.match(/(\d+)/);
      if (directMatch) {
        damage = parseInt(directMatch[1]);
      }

      // Description damage
      const descMatch = description.match(/(?:attack|damage)[:\s]*(\d+)/i);
      if (descMatch && !damage) {
        damage = parseInt(descMatch[1]);
      }

      // Determine damage type
      if (description.toLowerCase().includes('magic')) {
        type = 'magic';
      } else if (description.toLowerCase().includes('fire')) {
        type = 'fire';
      } else if (description.toLowerCase().includes('ice')) {
        type = 'ice';
      }

      return { damage, type };
    }

    addDamageIndicator(item, damageInfo) {
      // Don't add if already exists
      if (item.querySelector('.damage-indicator')) return;

      const indicator = document.createElement('div');
      indicator.className = 'damage-indicator';
      indicator.innerHTML = `
        <span class="damage-value">${damageInfo.damage}</span>
        <span class="damage-type">${damageInfo.type}</span>
      `;

      indicator.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: rgba(168, 85, 247, 0.9);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        z-index: 10;
      `;

      // Make item container relative if not already
      if (getComputedStyle(item).position === 'static') {
        item.style.position = 'relative';
      }

      item.appendChild(indicator);
    }

    initItemEnhancements() {
      // Add enhanced tooltips
      this.addEnhancedTooltips();
      
      // Add quick use buttons for consumables
      this.addQuickUseButtons();
      
      // Load saved view preference
      const savedView = localStorage.getItem('inventory-view-preference');
      if (savedView && savedView !== this.currentView) {
        this.switchView(savedView);
      }
    }

    addEnhancedTooltips() {
      const items = document.querySelectorAll('.inventory-item, .item-card');
      
      items.forEach(item => {
        item.addEventListener('mouseenter', (e) => {
          this.showEnhancedTooltip(e.target);
        });
        
        item.addEventListener('mouseleave', () => {
          this.hideEnhancedTooltip();
        });
      });
    }

    showEnhancedTooltip(item) {
      // Remove existing tooltip
      this.hideEnhancedTooltip();

      const tooltip = document.createElement('div');
      tooltip.className = 'enhanced-tooltip';
      
      const itemName = item.querySelector('.item-name, h3, h4')?.textContent || 'Unknown Item';
      const itemType = item.querySelector('.item-type, .type')?.textContent || '';
      const itemDescription = item.querySelector('.item-description, .description')?.textContent || '';
      const damageInfo = this.extractItemDamage(item);

      tooltip.innerHTML = `
        <div class="tooltip-header">
          <h4>${itemName}</h4>
          ${itemType ? `<span class="item-type">${itemType}</span>` : ''}
        </div>
        <div class="tooltip-content">
          ${damageInfo.damage > 0 ? `<div class="tooltip-damage">⚔️ Damage: ${damageInfo.damage} (${damageInfo.type})</div>` : ''}
          ${itemDescription ? `<div class="tooltip-description">${itemDescription}</div>` : ''}
        </div>
      `;

      tooltip.style.cssText = `
        position: fixed;
        background: #1e1e2e;
        border: 1px solid #45475a;
        border-radius: 6px;
        padding: 12px;
        color: #cdd6f4;
        font-size: 13px;
        z-index: 10000;
        max-width: 250px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        pointer-events: none;
      `;

      document.body.appendChild(tooltip);

      // Position tooltip
      const rect = item.getBoundingClientRect();
      tooltip.style.left = (rect.right + 10) + 'px';
      tooltip.style.top = rect.top + 'px';

      // Adjust if tooltip goes off screen
      const tooltipRect = tooltip.getBoundingClientRect();
      if (tooltipRect.right > window.innerWidth) {
        tooltip.style.left = (rect.left - tooltipRect.width - 10) + 'px';
      }
      if (tooltipRect.bottom > window.innerHeight) {
        tooltip.style.top = (rect.bottom - tooltipRect.height) + 'px';
      }
    }

    hideEnhancedTooltip() {
      const existingTooltip = document.querySelector('.enhanced-tooltip');
      if (existingTooltip) {
        existingTooltip.remove();
      }
    }

    addQuickUseButtons() {
      const consumables = document.querySelectorAll('.inventory-item, .item-card');
      
      consumables.forEach(item => {
        const itemType = item.querySelector('.item-type, .type')?.textContent.toLowerCase() || '';
        const itemName = item.querySelector('.item-name, h3, h4')?.textContent.toLowerCase() || '';
        
        // Check if item is consumable
        if (this.isConsumable(itemType, itemName)) {
          this.addQuickUseButton(item);
        }
      });
    }

    isConsumable(type, name) {
      const consumableTypes = ['potion', 'food', 'consumable', 'scroll'];
      const consumableKeywords = ['potion', 'food', 'bread', 'meal', 'drink', 'elixir'];
      
      return consumableTypes.some(t => type.includes(t)) ||
             consumableKeywords.some(k => name.includes(k));
    }

    addQuickUseButton(item) {
      // Don't add if already exists
      if (item.querySelector('.quick-use-btn')) return;

      const useBtn = document.createElement('button');
      useBtn.className = 'quick-use-btn';
      useBtn.innerHTML = '⚡';
      useBtn.title = 'Quick Use';
      
      useBtn.style.cssText = `
        position: absolute;
        bottom: 5px;
        right: 5px;
        width: 24px;
        height: 24px;
        background: #22c55e;
        border: none;
        border-radius: 4px;
        color: white;
        font-size: 12px;
        cursor: pointer;
        z-index: 10;
        transition: all 0.2s ease;
      `;

      useBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.useItem(item);
      });

      useBtn.addEventListener('mouseenter', () => {
        useBtn.style.background = '#16a34a';
        useBtn.style.transform = 'scale(1.1)';
      });

      useBtn.addEventListener('mouseleave', () => {
        useBtn.style.background = '#22c55e';
        useBtn.style.transform = 'scale(1)';
      });

      // Make item container relative if not already
      if (getComputedStyle(item).position === 'static') {
        item.style.position = 'relative';
      }

      item.appendChild(useBtn);
    }

    async useItem(item) {
      const itemName = item.querySelector('.item-name, h3, h4')?.textContent || 'Unknown Item';
      
      try {
        // Show using notification
        window.GameEnhancement?.NotificationSystem?.info(`Using ${itemName}...`);
        
        // This would normally make an API call to use the item
        // For now, simulate the usage
        setTimeout(() => {
          window.GameEnhancement?.NotificationSystem?.success(`${itemName} used successfully!`);
          
          // Optionally update the item display (reduce quantity, etc.)
          this.updateItemAfterUse(item);
        }, 1000);
        
      } catch (error) {
        console.error('Failed to use item:', error);
        window.GameEnhancement?.NotificationSystem?.error(`Failed to use ${itemName}`);
      }
    }

    updateItemAfterUse(item) {
      // Update quantity if displayed
      const quantityEl = item.querySelector('.item-quantity, .quantity');
      if (quantityEl) {
        const currentQuantity = parseInt(quantityEl.textContent) || 1;
        if (currentQuantity > 1) {
          quantityEl.textContent = currentQuantity - 1;
        } else {
          // Item used up, grey it out or remove
          item.style.opacity = '0.5';
          item.style.pointerEvents = 'none';
        }
      }
    }

    addViewToggleCSS() {
      const style = document.createElement('style');
      style.textContent = `
        .view-toggle-container {
          color: #cdd6f4;
          font-size: 13px;
        }
        
        .inventory-stats {
          display: flex;
          gap: 20px;
        }
        
        .view-controls {
          display: flex;
          gap: 5px;
        }
        
        .view-btn {
          padding: 6px 12px;
          background: #45475a;
          border: 1px solid #6c7086;
          border-radius: 4px;
          color: #cdd6f4;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .view-btn:hover {
          background: #585b70;
          border-color: #cba6f7;
        }
        
        .view-btn.active {
          background: #cba6f7;
          color: #1e1e2e;
          border-color: #cba6f7;
        }
        
        /* Grid View Styles */
        .inventory-container.grid-view {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
        }
        
        .inventory-container.grid-view .inventory-item {
          display: flex;
          flex-direction: column;
          padding: 15px;
          background: #313244;
          border: 1px solid #45475a;
          border-radius: 8px;
          text-align: center;
        }
        
        .inventory-container.grid-view .item-image {
          width: 64px;
          height: 64px;
          object-fit: contain;
          margin: 0 auto 10px auto;
        }
        
        /* List View Styles */
        .inventory-container.list-view {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .inventory-container.list-view .inventory-item {
          display: flex;
          align-items: center;
          padding: 12px;
          background: #313244;
          border: 1px solid #45475a;
          border-radius: 6px;
          gap: 15px;
        }
        
        .inventory-container.list-view .item-image {
          width: 48px;
          height: 48px;
          object-fit: contain;
          flex-shrink: 0;
        }
        
        /* Enhanced Tooltip Styles */
        .enhanced-tooltip .tooltip-header {
          border-bottom: 1px solid #45475a;
          margin-bottom: 8px;
          padding-bottom: 6px;
        }
        
        .enhanced-tooltip h4 {
          margin: 0;
          color: #f9e2af;
          font-size: 14px;
        }
        
        .enhanced-tooltip .item-type {
          font-size: 11px;
          color: #a6adc8;
          font-style: italic;
        }
        
        .enhanced-tooltip .tooltip-damage {
          color: #f38ba8;
          font-weight: 500;
          margin-bottom: 6px;
        }
        
        .enhanced-tooltip .tooltip-description {
          color: #cdd6f4;
          line-height: 1.4;
        }
      `;
      
      document.head.appendChild(style);
    }
  }

  // Initialize function
  window.initInventoryMods = function(config = {}) {
    const inventoryMods = new InventoryMods();
    inventoryMods.init();
    return inventoryMods;
  };
})();