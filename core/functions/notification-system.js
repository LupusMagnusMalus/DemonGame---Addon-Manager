/**
 * DemonGame Addon Manager - Notification System
 * Manages user notifications, toasts, and feedback messages
 */

class NotificationSystem {
  constructor() {
    this.notifications = new Map();
    this.queue = [];
    this.maxNotifications = 5;
    this.defaultDuration = 3000;
    this.container = null;
    this.soundEnabled = true;
    this.initialized = false;

    // Notification types with their properties
    this.types = {
      info: {
        icon: 'ℹ️',
        color: '#3b82f6',
        sound: 'notification'
      },
      success: {
        icon: '✅',
        color: '#10b981',
        sound: 'success'
      },
      warning: {
        icon: '⚠️',
        color: '#f59e0b',
        sound: 'warning'
      },
      error: {
        icon: '❌',
        color: '#ef4444',
        sound: 'error'
      },
      module: {
        icon: '📦',
        color: '#6366f1',
        sound: 'notification'
      }
    };

    this.init();
  }

  /**
   * Initialize notification system
   */
  async init() {
    if (this.initialized) return;

    this.createContainer();
    this.loadSettings();
    this.initialized = true;
    
    console.log('🔔 Notification system initialized');
  }

  /**
   * Create notification container
   */
  createContainer() {
    // Check if container already exists
    this.container = document.getElementById('notification-container');
    
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notification-container';
      this.container.className = 'notification-container';
      
      // Style the container
      Object.assign(this.container.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '10000',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      });
      
      document.body.appendChild(this.container);
    }
  }

  /**
   * Load notification settings
   */
  async loadSettings() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const { globalSettings = {} } = await chrome.storage.local.get('globalSettings');
        this.soundEnabled = globalSettings.showNotifications !== false;
      }
    } catch (error) {
      console.warn('Failed to load notification settings:', error);
    }
  }

  /**
   * Show notification
   */
  show(message, type = 'info', options = {}) {
    const notification = this.createNotification(message, type, options);
    
    if (this.notifications.size >= this.maxNotifications) {
      this.removeOldestNotification();
    }

    this.displayNotification(notification);
    this.playSound(type);

    // Auto-remove after duration
    if (notification.duration > 0) {
      setTimeout(() => {
        this.remove(notification.id);
      }, notification.duration);
    }

    return notification.id;
  }

  /**
   * Create notification object
   */
  createNotification(message, type, options) {
    const id = Date.now() + Math.random();
    const typeConfig = this.types[type] || this.types.info;
    
    const notification = {
      id,
      message,
      type,
      timestamp: Date.now(),
      duration: options.duration !== undefined ? options.duration : this.defaultDuration,
      persistent: options.persistent || false,
      actionable: options.actionable || false,
      actions: options.actions || [],
      icon: options.icon || typeConfig.icon,
      color: options.color || typeConfig.color,
      className: options.className || '',
      data: options.data || {}
    };

    this.notifications.set(id, notification);
    return notification;
  }

  /**
   * Display notification in DOM
   */
  displayNotification(notification) {
    const element = this.createElement(notification);
    this.container.appendChild(element);

    // Animate in
    requestAnimationFrame(() => {
      element.style.transform = 'translateX(0)';
      element.style.opacity = '1';
    });

    // Store element reference
    notification.element = element;
  }

  /**
   * Create notification DOM element
   */
  createElement(notification) {
    const element = document.createElement('div');
    element.className = `notification notification-${notification.type} ${notification.className}`;
    element.dataset.notificationId = notification.id;
    
    // Base styles
    Object.assign(element.style, {
      background: '#1e1e2e',
      border: `1px solid ${notification.color}`,
      borderLeft: `4px solid ${notification.color}`,
      borderRadius: '6px',
      padding: '12px 16px',
      minWidth: '300px',
      maxWidth: '400px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      color: '#cdd6f4',
      fontSize: '14px',
      transform: 'translateX(100%)',
      opacity: '0',
      transition: 'all 0.3s ease',
      pointerEvents: 'auto',
      cursor: 'default'
    });

    // Build content
    element.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 10px;">
        <span style="font-size: 16px; flex-shrink: 0;">${notification.icon}</span>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 500; margin-bottom: 2px;">${this.escapeHtml(notification.message)}</div>
          <div style="font-size: 12px; color: #6c7086;">${this.formatTimestamp(notification.timestamp)}</div>
          ${notification.actions.length > 0 ? this.createActions(notification.actions) : ''}
        </div>
        ${!notification.persistent ? '<button class="notification-close" style="background: none; border: none; color: #6c7086; font-size: 16px; cursor: pointer; padding: 0; margin-left: 8px;">×</button>' : ''}
      </div>
    `;

    // Add event listeners
    this.addEventListeners(element, notification);

    return element;
  }

  /**
   * Add event listeners to notification element
   */
  addEventListeners(element, notification) {
    // Close button
    const closeBtn = element.querySelector('.notification-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.remove(notification.id);
      });
    }

    // Action buttons
    const actionBtns = element.querySelectorAll('[data-action]');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const actionConfig = notification.actions.find(a => a.id === action);
        if (actionConfig && actionConfig.callback) {
          actionConfig.callback(notification);
        }
        
        if (!actionConfig.keepOpen) {
          this.remove(notification.id);
        }
      });
    });

    // Click to dismiss (if not actionable)
    if (!notification.actionable) {
      element.addEventListener('click', () => {
        this.remove(notification.id);
      });
    }
  }

  /**
   * Create action buttons HTML
   */
  createActions(actions) {
    const actionHtml = actions.map(action => {
      const buttonStyle = action.style === 'primary' 
        ? 'background: #6366f1; color: white;'
        : 'background: #45475a; color: #cdd6f4;';
      
      return `
        <button data-action="${action.id}" style="
          ${buttonStyle}
          border: none;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          margin-right: 6px;
          margin-top: 6px;
        ">${this.escapeHtml(action.label)}</button>
      `;
    }).join('');

    return `<div style="margin-top: 8px;">${actionHtml}</div>`;
  }

  /**
   * Remove notification
   */
  remove(id) {
    const notification = this.notifications.get(id);
    if (!notification || !notification.element) return;

    // Animate out
    notification.element.style.transform = 'translateX(100%)';
    notification.element.style.opacity = '0';

    setTimeout(() => {
      if (notification.element && notification.element.parentNode) {
        notification.element.parentNode.removeChild(notification.element);
      }
      this.notifications.delete(id);
    }, 300);
  }

  /**
   * Remove oldest notification
   */
  removeOldestNotification() {
    const oldestId = Array.from(this.notifications.keys())[0];
    if (oldestId) {
      this.remove(oldestId);
    }
  }

  /**
   * Clear all notifications
   */
  clear() {
    const ids = Array.from(this.notifications.keys());
    ids.forEach(id => this.remove(id));
  }

  /**
   * Play notification sound
   */
  playSound(type) {
    if (!this.soundEnabled) return;

    try {
      const soundFile = this.types[type]?.sound || 'notification';
      const audio = new Audio(chrome.runtime.getURL(`core/sounds/${soundFile}.mp3`));
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play failures (user interaction required)
      });
    } catch (error) {
      // Ignore sound errors
    }
  }

  /**
   * Convenience methods for different types
   */
  info(message, options = {}) {
    return this.show(message, 'info', options);
  }

  success(message, options = {}) {
    return this.show(message, 'success', options);
  }

  warning(message, options = {}) {
    return this.show(message, 'warning', options);
  }

  error(message, options = {}) {
    return this.show(message, 'error', options);
  }

  module(message, options = {}) {
    return this.show(message, 'module', options);
  }

  /**
   * Show notification with action buttons
   */
  confirm(message, options = {}) {
    return this.show(message, options.type || 'info', {
      ...options,
      actionable: true,
      persistent: true,
      actions: [
        {
          id: 'cancel',
          label: 'Cancel',
          style: 'secondary',
          callback: options.onCancel
        },
        {
          id: 'confirm', 
          label: options.confirmText || 'Confirm',
          style: 'primary',
          callback: options.onConfirm
        }
      ]
    });
  }

  /**
   * Helper methods
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatTimestamp(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  }

  /**
   * Settings management
   */
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
  }

  setMaxNotifications(max) {
    this.maxNotifications = max;
  }

  setDefaultDuration(duration) {
    this.defaultDuration = duration;
  }

  /**
   * Get notification statistics
   */
  getStats() {
    return {
      active: this.notifications.size,
      total: this.notifications.size,
      byType: Array.from(this.notifications.values()).reduce((acc, notif) => {
        acc[notif.type] = (acc[notif.type] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

// Create global instance
const notifications = new NotificationSystem();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.NotificationSystem = NotificationSystem;
  window.notifications = notifications;
}

// Also support module exports  
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NotificationSystem, notifications };
}

console.log('🔔 Notification system loaded');
