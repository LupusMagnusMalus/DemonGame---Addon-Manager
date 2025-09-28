// Quick Access System for Inventory & Merchant Items by Asura (v2.0)
(function() {
  'use strict';

  class QuickAccessSystem {
    constructor() {
      this.pinnedItems = {
        merchant: [],
        inventory: []
      };
      this.maxPinnedItems = 3;
      this.currentPage = this.detectCurrentPage();
    }

    init() {
      console.log('⚡ Initializing Quick Access System');
      
      this.loadPinnedItems();
      this.setupPinButtons();
      this.setupQuickUseButtons();
      this.observePageChanges();
    }

    detectCurrentPage() {
      const path = window.location.pathname;
      if (path.includes('merchant.php')) return 'merchant';
      if (path.includes('inventory.php')) return 'inventory';
      return 'other';
    }

    async loadPinnedItems() {
      try {
        const result = await chrome.storage.local.get('quick-access-items');
        const saved = result['quick-access-items'];
        
        if (saved) {
          this.pinnedItems = { ...this.pinnedItems, ...saved };
        }
      } catch (error) {
        console.warn('Could not load pinned items:', error);
      }
    }

    async savePinnedItems() {
      try {
        await chrome.storage.local.set({ 'quick-access-items': this.pinnedItems });
      } catch (error) {
        console.error('Failed to save pinned items:', error);
      }
    }

    setupPinButtons() {
      if (this.currentPage === 'merchant') {
        this.addMerchantPinButtons();
      } else if (this.currentPage === 'inventory') {
        this.addInventoryPinButtons();
      }
    }

    addMerchantPinButtons() {
      // Find merchant items
      const merchantItems = document.querySelectorAll('.merchant-item, .shop-item, .item-card');
      
      merchantItems.forEach(itemElement => {
        const itemData = this.extractMerchantItemData(itemElement);
        if (!itemData) return;

        const isPinned = this.isItemPinned('merchant', itemData.id);
        const pinButton = this.createPinButton(itemData, 'merchant', isPinned);
        
        // Add button to item
        const buttonContainer = itemElement.querySelector('.item-actions') || itemElement;
        buttonContainer.appendChild(pinButton);
      });
    }

    addInventoryPinButtons() {
      // Find inventory items
      const inventoryItems = document.querySelectorAll('.inventory-item, .item-slot, .item-card');
      
      inventoryItems.forEach(itemElement => {
        const itemData = this.extractInventoryItemData(itemElement);
        if (!itemData) return;

        // Only allow pinning of consumables and usable items
        if (!this.isItemPinnable(itemData)) return;

        const isPinned = this.isItemPinned('inventory', itemData.id);
        const pinButton = this.createPinButton(itemData, 'inventory', isPinned);
        
        // Add button to item
        const buttonContainer = itemElement.querySelector('.item-actions') || itemElement;
        buttonContainer.appendChild(pinButton);
      });
    }

    extractMerchantItemData(element) {
      try {
        // Extract item data from merchant page
        const nameEl = element.querySelector('.item-name, h3, h4');
        const priceEl = element.querySelector('.item-price, .price');
        const imageEl = element.querySelector('img');
        const idEl = element.querySelector('[data-item-id]') || element;

        if (!nameEl) return null;

        return {
          id: idEl.dataset.itemId || this.generateItemId(nameEl.textContent),
          name: nameEl.textContent.trim(),
          price: priceEl ? priceEl.textContent.trim() : 'N/A',
          image: imageEl ? imageEl.src : '/images/items/default.png',
          type: 'merchant',
          element: element
        };
      } catch (error) {
        console.warn('Failed to extract merchant item data:', error);
        return null;
      }
    }

    extractInventoryItemData(element) {
      try {
        // Extract item data from inventory page
        const nameEl = element.querySelector('.item-name, .tooltip-title, h3, h4');
        const imageEl = element.querySelector('img');
        const idEl = element.querySelector('[data-item-id]') || element;
        const typeEl = element.querySelector('.item-type, .item-category');

        if (!nameEl) return null;

        return {
          id: idEl.dataset.itemId || this.generateItemId(nameEl.textContent),
          name: nameEl.textContent.trim(),
          image: imageEl ? imageEl.src : '/images/items/default.png',
          type: 'inventory',
          category: typeEl ? typeEl.textContent.trim() : 'unknown',
          element: element
        };
      } catch (error) {
        console.warn('Failed to extract inventory item data:', error);
        return null;
      }
    }

    generateItemId(name) {
      // Generate a consistent ID from item name
      return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    }

    isItemPinnable(itemData) {
      // Only allow pinning of consumables and usable items
      const pinnableCategories = ['consumable', 'potion', 'food', 'scroll', 'rune'];
      return pinnableCategories.some(cat => 
        itemData.category.toLowerCase().includes(cat) ||
        itemData.name.toLowerCase().includes(cat)
      );
    }

    isItemPinned(type, itemId) {
      return this.pinnedItems[type].some(item => item.id === itemId);
    }

    createPinButton(itemData, type, isPinned) {
      const button = document.createElement('button');
      button.className = `pin-button ${isPinned ? 'pinned' : 'unpinned'}`;
      button.innerHTML = isPinned ? '📌 Pinned' : '📌 Pin';
      button.title = isPinned ? 'Unpin from quick access' : 'Pin to quick access';
      
      button.style.cssText = `
        padding: 4px 8px;
        font-size: 11px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin: 2px;
        transition: all 0.2s ease;
        ${isPinned ? 
          'background: #a6e3a1; color: #1e1e2e;' : 
          'background: #45475a; color: #cdd6f4;'
        }
      `;

      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isPinned) {
          this.unpinItem(type, itemData.id);
          button.className = 'pin-button unpinned';
          button.innerHTML = '📌 Pin';
          button.style.background = '#45475a';
          button.style.color = '#cdd6f4';
        } else {
          if (this.pinnedItems[type].length >= this.maxPinnedItems) {
            window.GameEnhancement?.NotificationSystem?.warning(`Maximum ${this.maxPinnedItems} items can be pinned`);
            return;
          }
          
          this.pinItem(type, itemData);
          button.className = 'pin-button pinned';
          button.innerHTML = '📌 Pinned';
          button.style.background = '#a6e3a1';
          button.style.color = '#1e1e2e';
        }
      });

      return button;
    }

    async pinItem(type, itemData) {
      // Add to pinned items
      this.pinnedItems[type].push({
        id: itemData.id,
        name: itemData.name,
        image: itemData.image,
        price: itemData.price,
        pinnedAt: Date.now()
      });

      await this.savePinnedItems();
      
      // Update sidebar display
      this.updateSidebarQuickAccess();
      
      window.GameEnhancement?.NotificationSystem?.success(`${itemData.name} pinned to quick access`);
    }

    async unpinItem(type, itemId) {
      // Remove from pinned items
      const itemIndex = this.pinnedItems[type].findIndex(item => item.id === itemId);
      if (itemIndex > -1) {
        const item = this.pinnedItems[type][itemIndex];
        this.pinnedItems[type].splice(itemIndex, 1);
        
        await this.savePinnedItems();
        
        // Update sidebar display
        this.updateSidebarQuickAccess();
        
        window.GameEnhancement?.NotificationSystem?.info(`${item.name} unpinned from quick access`);
      }
    }

    updateSidebarQuickAccess() {
      // Update merchant quick access in sidebar
      const merchantSection = document.getElementById('merchant-quick-access');
      if (merchantSection) {
        merchantSection.innerHTML = this.generateSidebarQuickAccessHTML('merchant');
      }

      // Update inventory quick access in sidebar
      const inventorySection = document.getElementById('inventory-quick-access');
      if (inventorySection) {
        inventorySection.innerHTML = this.generateSidebarQuickAccessHTML('inventory');
      }
    }

    generateSidebarQuickAccessHTML(type) {
      const items = this.pinnedItems[type];
      
      if (items.length === 0) {
        const emptyMessage = type === 'merchant' ? 
          'Visit merchant page to pin items for quick access' :
          'No items pinned. Visit inventory page to pin items.';
        return `<div class="quick-access-empty">${emptyMessage}</div>`;
      }

      return items.map(item => `
        <div class="quick-access-item" data-item-id="${item.id}" data-type="${type}">
          <img src="${item.image}" alt="${item.name}" class="item-icon">
          <div class="item-info">
            <span class="item-name">${item.name}</span>
            ${item.price ? `<span class="item-price">${item.price}</span>` : ''}
          </div>
          <div class="item-actions">
            <button class="quick-use-btn" title="${type === 'merchant' ? 'Buy' : 'Use'}">
              ${type === 'merchant' ? '💰' : '⚡'}
            </button>
            <button class="quick-unpin-btn" title="Unpin">❌</button>
          </div>
        </div>
      `).join('');
    }

    setupQuickUseButtons() {
      // Setup event delegation for quick use buttons
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-use-btn')) {
          e.preventDefault();
          const itemElement = e.target.closest('.quick-access-item');
          this.handleQuickUse(itemElement);
        }
        
        if (e.target.classList.contains('quick-unpin-btn')) {
          e.preventDefault();
          const itemElement = e.target.closest('.quick-access-item');
          this.handleQuickUnpin(itemElement);
        }
      });
    }

    async handleQuickUse(itemElement) {
      const itemId = itemElement.dataset.itemId;
      const type = itemElement.dataset.type;
      
      const item = this.pinnedItems[type].find(i => i.id === itemId);
      if (!item) return;

      try {
        if (type === 'merchant') {
          await this.buyItem(item);
        } else if (type === 'inventory') {
          await this.useItem(item);
        }
      } catch (error) {
        console.error('Quick use failed:', error);
        window.GameEnhancement?.NotificationSystem?.error('Failed to use item');
      }
    }

    async buyItem(item) {
      window.GameEnhancement?.NotificationSystem?.info(`Buying ${item.name}...`);
      
      // This would make an API call to buy the item
      // For now, simulate the purchase
      setTimeout(() => {
        window.GameEnhancement?.NotificationSystem?.success(`${item.name} purchased!`);
      }, 1500);
    }

    async useItem(item) {
      window.GameEnhancement?.NotificationSystem?.info(`Using ${item.name}...`);
      
      // This would make an API call to use the item
      // For now, simulate the usage
      setTimeout(() => {
        window.GameEnhancement?.NotificationSystem?.success(`${item.name} used!`);
      }, 1000);
    }

    async handleQuickUnpin(itemElement) {
      const itemId = itemElement.dataset.itemId;
      const type = itemElement.dataset.type;
      
      await this.unpinItem(type, itemId);
    }

    observePageChanges() {
      // Watch for navigation to merchant/inventory pages
      const observer = new MutationObserver((mutations) => {
        const newPage = this.detectCurrentPage();
        if (newPage !== this.currentPage) {
          this.currentPage = newPage;
          setTimeout(() => {
            this.setupPinButtons();
          }, 500);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    // Public methods for external use
    getPinnedItems(type) {
      return this.pinnedItems[type] || [];
    }

    getMaxPinnedItems() {
      return this.maxPinnedItems;
    }

    setMaxPinnedItems(max) {
      this.maxPinnedItems = Math.max(1, Math.min(10, max));
    }
  }

  // Initialize function
  window.initQuickAccessSystem = function(config = {}) {
    const quickAccess = new QuickAccessSystem();
    if (config.pinnedItemsLimit) {
      quickAccess.setMaxPinnedItems(config.pinnedItemsLimit);
    }
    quickAccess.init();
    return quickAccess;
  };
})();