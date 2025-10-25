// Battle Alarm System
(function() {
  'use strict';

  class BattleAlarm {
    constructor() {
      this.enabled = true;
      this.volume = 0.7;
      this.currentSound = 'alarm';
      this.sounds = {};
      this.activeAlarms = new Set();
      this.checkInterval = null;
      this.lastCheck = 0;
      this.checkFrequency = 30000; // Check every 30 seconds
    }

    async init() {
      // Only run on battle/wave pages
      if (!this.isRelevantPage()) {
        console.log('⏰ Battle Alarm: Not on relevant page, skipping initialization');
        return;
      }

      console.log('⏰ Initializing Battle Alarm System');
      
      await this.loadSettings();
      await this.loadSounds();
      
      if (this.enabled) {
        this.startMonitoring();
      }

      this.setupEventListeners();
    }

    isRelevantPage() {
      const url = window.location.href;
      return url.includes('active_wave.php') || 
             url.includes('battle.php') || 
             url.includes('arena.php');
    }

    async loadSettings() {
      try {
        const settings = await chrome.storage.local.get([
          'battleAlarmEnabled',
          'battleAlarmSound',
          'battleAlarmVolume',
          'battleAlarmFrequency'
        ]);
        
        this.enabled = settings.battleAlarmEnabled !== false;
        this.currentSound = settings.battleAlarmSound || 'alarm';
        this.volume = (settings.battleAlarmVolume || 70) / 100;
        this.checkFrequency = settings.battleAlarmFrequency || 30000;
        
        console.log('⏰ Battle Alarm settings loaded:', {
          enabled: this.enabled,
          sound: this.currentSound,
          volume: this.volume,
          frequency: this.checkFrequency
        });
      } catch (error) {
        console.error('⏰ Failed to load battle alarm settings:', error);
      }
    }

    async loadSounds() {
      try {
        // Get sound URLs from extension
        this.sounds = {
          alarm: chrome.runtime.getURL('src/sounds/alarm/alarm.mp3'),
          guitar: chrome.runtime.getURL('src/sounds/alarm/guitar.mp3')
        };
        
        console.log('⏰ Battle alarm sounds loaded:', this.sounds);
      } catch (error) {
        console.error('⏰ Failed to load battle alarm sounds:', error);
        // Fallback to default browser notification if sounds fail
        this.sounds = {};
      }
    }

    startMonitoring() {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
      }

      console.log('⏰ Starting battle monitoring...');
      
      // Initial check
      this.checkBattleStatus();
      
      // Set up recurring checks
      this.checkInterval = setInterval(() => {
        this.checkBattleStatus();
      }, this.checkFrequency);
    }

    stopMonitoring() {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
        console.log('⏰ Battle monitoring stopped');
      }
    }

    checkBattleStatus() {
      const now = Date.now();
      
      // Throttle checks
      if (now - this.lastCheck < this.checkFrequency - 1000) {
        return;
      }
      
      this.lastCheck = now;
      
      // Check for low HP monsters
      this.checkLowHPMonsters();
      
      // Check for battle opportunities
      this.checkBattleOpportunities();
      
      // Check for event battles
      this.checkEventBattles();
    }

    checkLowHPMonsters() {
      // Find monsters with low HP (< 30%)
      const monsters = document.querySelectorAll('.monster-item, .enemy, .boss');
      
      monsters.forEach(monster => {
        const hpText = monster.querySelector('.hp, .health, .hp-text')?.textContent || '';
        const hpMatch = hpText.match(/(\d+)%/);
        
        if (hpMatch) {
          const hpPercent = parseInt(hpMatch[1]);
          const monsterId = this.getMonsterIdentifier(monster);
          
          // Trigger alarm if HP is low and we haven't alerted for this monster recently
          if (hpPercent > 0 && hpPercent <= 30 && !this.activeAlarms.has(monsterId)) {
            this.triggerAlarm('lowHP', {
              monsterId,
              monsterName: this.getMonsterName(monster),
              hpPercent
            });
            
            this.activeAlarms.add(monsterId);
            
            // Remove from active alarms after 5 minutes
            setTimeout(() => {
              this.activeAlarms.delete(monsterId);
            }, 300000);
          }
        }
      });
    }

    checkBattleOpportunities() {
      // Check for empty battle slots (no players fighting)
      const battleSlots = document.querySelectorAll('.battle-slot, .battle-instance');
      
      battleSlots.forEach(slot => {
        const playerCount = this.getPlayerCount(slot);
        const battleId = this.getBattleIdentifier(slot);
        
        if (playerCount === 0 && !this.activeAlarms.has(battleId)) {
          this.triggerAlarm('emptyBattle', {
            battleId,
            battleName: this.getBattleName(slot)
          });
          
          this.activeAlarms.add(battleId);
          
          // Remove after 2 minutes
          setTimeout(() => {
            this.activeAlarms.delete(battleId);
          }, 120000);
        }
      });
    }

    checkEventBattles() {
      // Check for special event battles
      const eventBattles = document.querySelectorAll('.event-battle, .special-battle');
      
      eventBattles.forEach(battle => {
        const battleId = 'event-' + this.getBattleIdentifier(battle);
        
        if (!this.activeAlarms.has(battleId)) {
          this.triggerAlarm('eventBattle', {
            battleId,
            battleName: this.getBattleName(battle)
          });
          
          this.activeAlarms.add(battleId);
          
          // Remove after 10 minutes
          setTimeout(() => {
            this.activeAlarms.delete(battleId);
          }, 600000);
        }
      });
    }

    triggerAlarm(type, data) {
      console.log('⏰ Battle alarm triggered:', type, data);
      
      // Play sound
      this.playAlarmSound();
      
      // Show notification
      this.showNotification(type, data);
      
      // Visual alert on page
      this.showVisualAlert(type, data);
    }

    playAlarmSound() {
      if (!this.enabled || !this.sounds[this.currentSound]) {
        return;
      }
      
      try {
        const audio = new Audio(this.sounds[this.currentSound]);
        audio.volume = this.volume;
        audio.play().catch(error => {
          console.warn('⏰ Could not play alarm sound:', error);
        });
      } catch (error) {
        console.error('⏰ Error playing alarm sound:', error);
      }
    }

    showNotification(type, data) {
      let title = 'Battle Alert!';
      let message = '';
      
      switch (type) {
        case 'lowHP':
          title = '🎯 Low HP Monster!';
          message = `${data.monsterName} is at ${data.hpPercent}% HP - Strike now!`;
          break;
        case 'emptyBattle':
          title = '⚔️ Battle Opportunity!';
          message = `${data.battleName} has no players - Join the fight!`;
          break;
        case 'eventBattle':
          title = '🌟 Event Battle!';
          message = `Special battle available: ${data.battleName}`;
          break;
      }
      
      // Use GameEnhancement notification system if available
      if (window.GameEnhancement?.NotificationSystem) {
        window.GameEnhancement.NotificationSystem.warning(message, {
          duration: 8000
        });
      }
      
      // Also try browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: chrome.runtime.getURL('src/favicon.png')
        });
      }
    }

    showVisualAlert(type, data) {
      // Create visual alert overlay
      const alert = document.createElement('div');
      alert.className = 'battle-alarm-alert';
      
      let icon = '⚠️';
      let color = '#f9e2af';
      
      switch (type) {
        case 'lowHP':
          icon = '🎯';
          color = '#f38ba8';
          break;
        case 'emptyBattle':
          icon = '⚔️';
          color = '#74c0fc';
          break;
        case 'eventBattle':
          icon = '🌟';
          color = '#cba6f7';
          break;
      }
      
      alert.innerHTML = `
        <div class="alert-content">
          <div class="alert-icon">${icon}</div>
          <div class="alert-message">
            ${this.getAlertMessage(type, data)}
          </div>
          <button class="alert-close">×</button>
        </div>
      `;
      
      alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(30, 30, 46, 0.95);
        border: 2px solid ${color};
        border-radius: 8px;
        padding: 16px;
        z-index: 10000;
        min-width: 300px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        animation: slideInRight 0.3s ease;
      `;
      
      // Add animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .battle-alarm-alert .alert-content {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #cdd6f4;
        }
        
        .battle-alarm-alert .alert-icon {
          font-size: 32px;
        }
        
        .battle-alarm-alert .alert-message {
          flex: 1;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .battle-alarm-alert .alert-close {
          background: none;
          border: none;
          color: #cdd6f4;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        
        .battle-alarm-alert .alert-close:hover {
          background: rgba(69, 71, 90, 0.5);
        }
      `;
      
      if (!document.querySelector('#battle-alarm-styles')) {
        style.id = 'battle-alarm-styles';
        document.head.appendChild(style);
      }
      
      document.body.appendChild(alert);
      
      // Close button
      alert.querySelector('.alert-close').addEventListener('click', () => {
        alert.remove();
      });
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (alert.parentNode) {
          alert.remove();
        }
      }, 10000);
    }

    getAlertMessage(type, data) {
      switch (type) {
        case 'lowHP':
          return `<strong>${data.monsterName}</strong> is at <strong style="color: #f38ba8">${data.hpPercent}%</strong> HP!<br>Perfect time to strike!`;
        case 'emptyBattle':
          return `<strong>${data.battleName}</strong> has no players!<br>Great opportunity to join!`;
        case 'eventBattle':
          return `<strong>Event Battle Available!</strong><br>${data.battleName}`;
        default:
          return 'Battle alert triggered!';
      }
    }

    // Helper methods to extract information from DOM elements
    getMonsterIdentifier(element) {
      // Try to get a unique identifier for the monster
      return element.id || 
             element.getAttribute('data-monster-id') || 
             element.querySelector('.monster-name, .enemy-name')?.textContent || 
             'monster-' + Math.random().toString(36).substr(2, 9);
    }

    getMonsterName(element) {
      return element.querySelector('.monster-name, .enemy-name, h3, h4')?.textContent?.trim() || 'Unknown Monster';
    }

    getBattleIdentifier(element) {
      return element.id || 
             element.getAttribute('data-battle-id') || 
             'battle-' + Math.random().toString(36).substr(2, 9);
    }

    getBattleName(element) {
      return element.querySelector('.battle-name, .battle-title, h3, h4')?.textContent?.trim() || 'Battle';
    }

    getPlayerCount(element) {
      const countText = element.querySelector('.player-count, .participants')?.textContent || '0';
      const match = countText.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }

    setupEventListeners() {
      // Listen for settings changes
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
          if (changes.battleAlarmEnabled) {
            this.enabled = changes.battleAlarmEnabled.newValue;
            if (this.enabled) {
              this.startMonitoring();
            } else {
              this.stopMonitoring();
            }
          }
          
          if (changes.battleAlarmSound) {
            this.currentSound = changes.battleAlarmSound.newValue;
          }
          
          if (changes.battleAlarmVolume) {
            this.volume = changes.battleAlarmVolume.newValue / 100;
          }
          
          if (changes.battleAlarmFrequency) {
            this.checkFrequency = changes.battleAlarmFrequency.newValue;
            if (this.enabled) {
              this.startMonitoring(); // Restart with new frequency
            }
          }
        }
      });
    }

    destroy() {
      this.stopMonitoring();
      this.activeAlarms.clear();
      console.log('⏰ Battle Alarm System destroyed');
    }
  }

  // Initialize function
  window.initBattleAlarm = function(config = {}) {
    const battleAlarm = new BattleAlarm();
    battleAlarm.init();
    return battleAlarm;
  };
})();