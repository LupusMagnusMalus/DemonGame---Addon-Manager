// Notifications Tab Controller
(function() {
  'use strict';

  let settings = {
    battleAlarmEnabled: true,
    battleAlarmSound: 'alarm',
    battleAlarmVolume: 70,
    battleAlarmFrequency: 30000,
    alertLowHP: true,
    alertEmptyBattle: true,
    alertEventBattle: true
  };

  async function init_notifications(popupController) {
    console.log('🔔 Initializing Notifications tab');
    
    await loadSettings(popupController);
    setupVolumeSlider();
    setupTestSound(popupController);
    setupNotificationPermission(popupController);
    setupAlertTypeToggles(popupController);
    setupHistoryClear(popupController);
    loadNotificationHistory();
  }

  async function loadSettings(popupController) {
    const stored = await popupController.loadConfig();
    if (stored.notifications) {
      settings = { ...settings, ...stored.notifications };
    }
    
    // Apply loaded settings to UI
    Object.keys(settings).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = settings[key];
        } else if (element.type === 'range' || element.type === 'number') {
          element.value = settings[key];
        } else if (element.tagName === 'SELECT') {
          element.value = settings[key];
        }
      }
    });
    
    // Update volume display
    const volumeValue = document.getElementById('volumeValue');
    if (volumeValue) {
      volumeValue.textContent = `${settings.battleAlarmVolume}%`;
    }
    
    // Setup auto-save listeners
    setupAutoSave(popupController);
  }

  function setupAutoSave(popupController) {
    Object.keys(settings).forEach(key => {
      const element = document.getElementById(key);
      if (!element) return;
      
      const eventType = element.type === 'range' ? 'change' : 'change';
      
      element.addEventListener(eventType, async () => {
        if (element.type === 'checkbox') {
          settings[key] = element.checked;
        } else if (element.type === 'range' || element.type === 'number') {
          settings[key] = parseInt(element.value);
        } else {
          settings[key] = element.value;
        }
        
        const config = await popupController.loadConfig();
        config.notifications = settings;
        await popupController.saveConfig('config', config);
        
        popupController.showToast(
          `${popupController.formatFeatureName(key)} updated`,
          'success'
        );
      });
    });
  }

  function setupVolumeSlider() {
    const volumeSlider = document.getElementById('battleAlarmVolume');
    const volumeValue = document.getElementById('volumeValue');
    
    if (volumeSlider && volumeValue) {
      volumeSlider.addEventListener('input', () => {
        volumeValue.textContent = `${volumeSlider.value}%`;
      });
    }
  }

  function setupTestSound(popupController) {
    const testButton = document.getElementById('testAlarmSound');
    
    if (testButton) {
      testButton.addEventListener('click', async () => {
        const soundFile = settings.battleAlarmSound || 'alarm';
        const volume = (settings.battleAlarmVolume || 70) / 100;
        
        try {
          const audio = new Audio(chrome.runtime.getURL(`src/sounds/alarm/${soundFile}.mp3`));
          audio.volume = volume;
          await audio.play();
          popupController.showToast('Playing test sound...', 'info');
        } catch (error) {
          popupController.showToast('Could not play sound', 'error');
          console.error('Sound playback error:', error);
        }
      });
    }
  }

  function setupNotificationPermission(popupController) {
    const permissionButton = document.getElementById('requestNotificationPermission');
    
    if (permissionButton && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        permissionButton.innerHTML = '<span>✅</span> Notifications Enabled';
        permissionButton.disabled = true;
        permissionButton.classList.add('secondary');
      }
      
      permissionButton.addEventListener('click', async () => {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          popupController.showToast('Browser notifications enabled', 'success');
          permissionButton.innerHTML = '<span>✅</span> Notifications Enabled';
          permissionButton.disabled = true;
          permissionButton.classList.add('secondary');
        } else {
          popupController.showToast('Notification permission denied', 'error');
        }
      });
    }
  }

  function setupAlertTypeToggles(popupController) {
    // Use popupController utility for automatic toggle setup
    const alertTypes = {
      alertLowHP: settings.alertLowHP,
      alertEmptyBattle: settings.alertEmptyBattle,
      alertEventBattle: settings.alertEventBattle
    };
    
    popupController.setupFeatureToggles(alertTypes, 'notifications', (featureId, enabled) => {
      settings[featureId] = enabled;
    });
  }

  function setupHistoryClear(popupController) {
    const clearButton = document.getElementById('clearNotificationHistory');
    
    if (clearButton) {
      clearButton.addEventListener('click', async () => {
        await chrome.storage.local.remove('notificationHistory');
        
        const historyContainer = document.getElementById('notificationHistory');
        if (historyContainer) {
          historyContainer.innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">🔕</div>
              <div class="empty-state-text">No recent alerts</div>
            </div>
          `;
        }
        
        popupController.showToast('Notification history cleared', 'success');
      });
    }
  }

  async function loadNotificationHistory() {
    const historyContainer = document.getElementById('notificationHistory');
    if (!historyContainer) return;
    
    try {
      const stored = await chrome.storage.local.get(['notificationHistory']);
      const history = stored.notificationHistory || [];
      
      if (history.length === 0) return;
      
      historyContainer.innerHTML = history
        .slice(-10) // Show last 10 notifications
        .reverse()
        .map(item => `
          <div class="notification-history-item">
            <div class="notification-history-icon">${item.icon || '🔔'}</div>
            <div class="notification-history-content">
              <div class="notification-history-title">${item.title}</div>
              <div class="notification-history-message">${item.message}</div>
              <div class="notification-history-time">${formatTime(item.timestamp)}</div>
            </div>
          </div>
        `)
        .join('');
    } catch (error) {
      console.error('Failed to load notification history:', error);
    }
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  }

  function cleanup_notifications() {
    console.log('🔔 Cleaning up Notifications tab');
  }

  // Export to global scope
  window.init_notifications = init_notifications;
  window.cleanup_notifications = cleanup_notifications;
})();