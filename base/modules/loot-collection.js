// Instant Loot Collection aus GonBruck
(function() {
  'use strict';

  class LootCollection {
    constructor() {
      this.collectedLoot = [];
      this.totalValue = 0;
      this.isCollecting = false;
    }

    init() {
      if (!window.location.pathname.includes('active_wave.php')) return;
      
      console.log('💰 Initializing Loot Collection');
      
      this.addLootButtons();
      this.setupLootMonitoring();
      this.addLootSummary();
    }

    addLootButtons() {
      // Add instant loot collection buttons to loot items
      const lootItems = document.querySelectorAll('.loot-item, .loot-drop, .item-drop');
      
      lootItems.forEach(item => {
        this.addLootButton(item);
      });

      // Add collect all button if multiple loot items exist
      if (lootItems.length > 1) {
        this.addCollectAllButton();
      }
    }

    addLootButton(lootItem) {
      // Don't add if already exists
      if (lootItem.querySelector('.instant-loot-btn')) return;

      const lootData = this.extractLootData(lootItem);
      
      const lootButton = document.createElement('button');
      lootButton.className = 'instant-loot-btn';
      lootButton.innerHTML = '⚡ Collect';
      lootButton.title = `Instantly collect ${lootData.name}`;
      
      lootButton.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        padding: 4px 8px;
        background: linear-gradient(135deg, #f9e2af, #fab387);
        border: none;
        border-radius: 4px;
        color: #1e1e2e;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        z-index: 10;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(249, 226, 175, 0.3);
      `;

      lootButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.collectLoot(lootItem, lootData);
      });

      lootButton.addEventListener('mouseenter', () => {
        lootButton.style.transform = 'scale(1.05)';
        lootButton.style.boxShadow = '0 4px 8px rgba(249, 226, 175, 0.4)';
      });

      lootButton.addEventListener('mouseleave', () => {
        lootButton.style.transform = 'scale(1)';
        lootButton.style.boxShadow = '0 2px 4px rgba(249, 226, 175, 0.3)';
      });

      // Make loot item container relative if not already
      if (getComputedStyle(lootItem).position === 'static') {
        lootItem.style.position = 'relative';
      }

      lootItem.appendChild(lootButton);
    }

    extractLootData(lootItem) {
      const name = lootItem.querySelector('.loot-name, .item-name, h3, h4')?.textContent.trim() || 'Unknown Item';
      
      // Extract value/price
      const valueText = lootItem.querySelector('.loot-value, .item-value, .price')?.textContent || '';
      const valueMatch = valueText.match(/(\d+)/);
      const value = valueMatch ? parseInt(valueMatch[1]) : 0;
      
      // Extract quantity
      const quantityText = lootItem.querySelector('.loot-quantity, .quantity')?.textContent || '';
      const quantityMatch = quantityText.match(/(\d+)/);
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
      
      // Extract type/rarity
      const type = lootItem.querySelector('.loot-type, .item-type')?.textContent.trim() || 'common';
      
      return {
        element: lootItem,
        name,
        value,
        quantity,
        type
      };
    }

    addCollectAllButton() {
      const lootContainer = document.querySelector('.loot-container, .loot-drops, .drops');
      if (!lootContainer) return;

      const collectAllButton = document.createElement('button');
      collectAllButton.className = 'collect-all-btn';
      collectAllButton.innerHTML = '💰 Collect All Loot';
      
      collectAllButton.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: linear-gradient(135deg, #a6e3a1, #94e2d5);
        border: none;
        border-radius: 8px;
        color: #1e1e2e;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        z-index: 1000;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(166, 227, 161, 0.3);
      `;

      collectAllButton.addEventListener('click', () => {
        this.collectAllLoot();
      });

      collectAllButton.addEventListener('mouseenter', () => {
        collectAllButton.style.transform = 'translateY(-2px)';
        collectAllButton.style.boxShadow = '0 6px 20px rgba(166, 227, 161, 0.4)';
      });

      collectAllButton.addEventListener('mouseleave', () => {
        collectAllButton.style.transform = 'translateY(0)';
        collectAllButton.style.boxShadow = '0 4px 12px rgba(166, 227, 161, 0.3)';
      });

      document.body.appendChild(collectAllButton);
    }

    async collectLoot(lootItem, lootData) {
      if (this.isCollecting) return;
      
      this.isCollecting = true;
      
      try {
        // Visual feedback - start collection
        this.showCollectionAnimation(lootItem);
        
        // Simulate loot collection API call
        await this.simulateLootCollection(lootData);
        
        // Add to collected loot
        this.addToCollectedLoot(lootData);
        
        // Remove loot item from page or mark as collected
        this.markAsCollected(lootItem);
        
        // Show success notification
        window.GameEnhancement?.NotificationSystem?.success(
          `Collected ${lootData.quantity}x ${lootData.name}!`
        );
        
      } catch (error) {
        console.error('Failed to collect loot:', error);
        window.GameEnhancement?.NotificationSystem?.error('Failed to collect loot');
      } finally {
        this.isCollecting = false;
      }
    }

    async collectAllLoot() {
      const uncollectedLoot = document.querySelectorAll('.loot-item:not(.collected), .loot-drop:not(.collected), .item-drop:not(.collected)');
      
      if (uncollectedLoot.length === 0) {
        window.GameEnhancement?.NotificationSystem?.info('No loot to collect');
        return;
      }

      if (this.isCollecting) return;
      this.isCollecting = true;

      try {
        window.GameEnhancement?.NotificationSystem?.info(`Collecting ${uncollectedLoot.length} items...`);
        
        let collectedCount = 0;
        let totalValue = 0;

        for (const lootItem of uncollectedLoot) {
          const lootData = this.extractLootData(lootItem);
          
          // Add small delay between collections for visual effect
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Collect the loot
          this.showCollectionAnimation(lootItem);
          await this.simulateLootCollection(lootData);
          
          this.addToCollectedLoot(lootData);
          this.markAsCollected(lootItem);
          
          collectedCount++;
          totalValue += lootData.value * lootData.quantity;
        }

        // Show collection summary
        this.showCollectionSummary(collectedCount, totalValue);
        
      } catch (error) {
        console.error('Failed to collect all loot:', error);
        window.GameEnhancement?.NotificationSystem?.error('Failed to collect all loot');
      } finally {
        this.isCollecting = false;
      }
    }

    showCollectionAnimation(lootItem) {
      // Add a sparkle effect to the loot item
      const sparkle = document.createElement('div');
      sparkle.className = 'loot-sparkle';
      sparkle.innerHTML = '✨';
      
      sparkle.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 24px;
        z-index: 100;
        animation: sparkleAnimation 1s ease-out;
        pointer-events: none;
      `;

      lootItem.appendChild(sparkle);

      // Remove sparkle after animation
      setTimeout(() => {
        sparkle.remove();
      }, 1000);

      // Add CSS animation if not already exists
      if (!document.querySelector('#sparkle-animation-css')) {
        const style = document.createElement('style');
        style.id = 'sparkle-animation-css';
        style.textContent = `
          @keyframes sparkleAnimation {
            0% {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.5);
            }
            50% {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1.2);
            }
            100% {
              opacity: 0;
              transform: translate(-50%, -50%) scale(1) translateY(-20px);
            }
          }
        `;
        document.head.appendChild(style);
      }
    }

    async simulateLootCollection(lootData) {
      // Simulate API call delay
      const delay = Math.random() * 500 + 200; // 200-700ms
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Simulate occasional failures
      if (Math.random() < 0.05) { // 5% failure rate
        throw new Error('Collection failed');
      }
    }

    addToCollectedLoot(lootData) {
      this.collectedLoot.push({
        ...lootData,
        collectedAt: Date.now()
      });
      
      this.totalValue += lootData.value * lootData.quantity;
      this.updateLootSummary();
    }

    markAsCollected(lootItem) {
      lootItem.classList.add('collected');
      lootItem.style.opacity = '0.6';
      lootItem.style.filter = 'grayscale(0.5)';
      
      // Update button
      const lootButton = lootItem.querySelector('.instant-loot-btn');
      if (lootButton) {
        lootButton.innerHTML = '✅ Collected';
        lootButton.style.background = '#6c7086';
        lootButton.disabled = true;
        lootButton.style.cursor = 'not-allowed';
      }
    }

    showCollectionSummary(count, value) {
      const modal = this.createSummaryModal(count, value);
      document.body.appendChild(modal);
    }

    createSummaryModal(count, value) {
      const modal = document.createElement('div');
      modal.className = 'loot-summary-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>💰 Loot Collection Complete!</h3>
            <button class="modal-close">×</button>
          </div>
          
          <div class="modal-body">
            <div class="collection-stats">
              <div class="stat-item">
                <div class="stat-icon">📦</div>
                <div class="stat-info">
                  <div class="stat-value">${count}</div>
                  <div class="stat-label">Items Collected</div>
                </div>
              </div>
              
              <div class="stat-item">
                <div class="stat-icon">💰</div>
                <div class="stat-info">
                  <div class="stat-value">${value.toLocaleString()}</div>
                  <div class="stat-label">Total Value</div>
                </div>
              </div>
            </div>
            
            <div class="recent-loot">
              <h4>Recently Collected:</h4>
              <div class="loot-list">
                ${this.getRecentLootHTML()}
              </div>
            </div>
            
            <div class="summary-actions">
              <button class="modal-btn primary" id="view-inventory">View Inventory</button>
              <button class="modal-btn secondary" id="continue-farming">Continue Farming</button>
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
        animation: modalFadeIn 0.3s ease;
      `;

      // Setup event listeners
      modal.querySelector('.modal-close')?.addEventListener('click', () => modal.remove());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });

      modal.querySelector('#view-inventory')?.addEventListener('click', () => {
        window.location.href = 'inventory.php';
      });

      modal.querySelector('#continue-farming')?.addEventListener('click', () => {
        modal.remove();
      });

      return modal;
    }

    getRecentLootHTML() {
      const recentLoot = this.collectedLoot.slice(-5).reverse();
      
      if (recentLoot.length === 0) {
        return '<div class="no-loot">No recent loot</div>';
      }

      return recentLoot.map(loot => `
        <div class="loot-summary-item">
          <span class="loot-quantity">${loot.quantity}x</span>
          <span class="loot-name">${loot.name}</span>
          <span class="loot-value">${(loot.value * loot.quantity).toLocaleString()} gold</span>
        </div>
      `).join('');
    }

    addLootSummary() {
      const summaryPanel = document.createElement('div');
      summaryPanel.className = 'loot-summary-panel';
      summaryPanel.innerHTML = `
        <div class="summary-content">
          <h4>💰 Loot Summary</h4>
          <div class="summary-stats">
            <div class="summary-stat">
              <span class="stat-label">Items Collected:</span>
              <span class="stat-value" id="total-items-collected">0</span>
            </div>
            <div class="summary-stat">
              <span class="stat-label">Total Value:</span>
              <span class="stat-value" id="total-loot-value">0 gold</span>
            </div>
            <div class="summary-stat">
              <span class="stat-label">Session Time:</span>
              <span class="stat-value" id="session-time">0m</span>
            </div>
          </div>
          
          <div class="loot-actions">
            <button id="clear-loot-history" class="loot-action-btn">Clear History</button>
            <button id="export-loot-data" class="loot-action-btn">Export Data</button>
          </div>
        </div>
      `;

      summaryPanel.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: #1e1e2e;
        border: 1px solid #45475a;
        border-radius: 8px;
        padding: 15px;
        min-width: 250px;
        z-index: 999;
        font-size: 13px;
      `;

      document.body.appendChild(summaryPanel);
      
      this.setupSummaryActions();
      this.startSessionTimer();
    }

    setupSummaryActions() {
      document.getElementById('clear-loot-history')?.addEventListener('click', () => {
        this.clearLootHistory();
      });

      document.getElementById('export-loot-data')?.addEventListener('click', () => {
        this.exportLootData();
      });
    }

    updateLootSummary() {
      document.getElementById('total-items-collected').textContent = this.collectedLoot.length;
      document.getElementById('total-loot-value').textContent = this.totalValue.toLocaleString() + ' gold';
    }

    startSessionTimer() {
      const startTime = Date.now();
      
      setInterval(() => {
        const elapsed = Date.now() - startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        document.getElementById('session-time').textContent = 
          minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      }, 1000);
    }

    clearLootHistory() {
      if (confirm('Clear all loot collection history?')) {
        this.collectedLoot = [];
        this.totalValue = 0;
        this.updateLootSummary();
        
        window.GameEnhancement?.NotificationSystem?.info('Loot history cleared');
      }
    }

    exportLootData() {
      const data = {
        collectedLoot: this.collectedLoot,
        totalValue: this.totalValue,
        exportedAt: new Date().toISOString()
      };

      const dataStr = JSON.stringify(data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `loot-data-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      window.GameEnhancement?.NotificationSystem?.success('Loot data exported!');
    }

    setupLootMonitoring() {
      // Monitor for new loot drops
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              // Check if it's a loot item or contains loot items
              if (node.classList?.contains('loot-item') || 
                  node.classList?.contains('loot-drop') ||
                  node.classList?.contains('item-drop')) {
                this.addLootButton(node);
              }
              
              // Check for loot items within the added node
              const lootItems = node.querySelectorAll?.('.loot-item, .loot-drop, .item-drop');
              lootItems?.forEach(item => this.addLootButton(item));
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  // Initialize function
  window.initLootCollection = function(config = {}) {
    const lootCollection = new LootCollection();
    lootCollection.init();
    return lootCollection;
  };
})();