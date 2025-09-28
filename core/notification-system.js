// Unified Notification System
(function() {
  'use strict';

  class NotificationSystem {
    static notifications = new Map();
    static container = null;

    static init() {
      if (!this.container) {
        this.createContainer();
      }
    }

    static createContainer() {
      this.container = document.createElement('div');
      this.container.id = 'enhancement-notifications';
      this.container.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        z-index: 10000;
        max-width: 350px;
        pointer-events: none;
      `;
      document.body.appendChild(this.container);
    }

    static show(message, type = 'info', duration = 4000, options = {}) {
      this.init();
      
      const id = Date.now().toString();
      const notification = this.createNotification(message, type, options);
      
      this.container.appendChild(notification);
      this.notifications.set(id, notification);
      
      // Slide in animation
      requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
      });
      
      // Auto remove
      if (duration > 0) {
        setTimeout(() => {
          this.remove(id);
        }, duration);
      }
      
      return id;
    }

    static createNotification(message, type, options) {
      const notification = document.createElement('div');
      notification.style.cssText = `
        background: ${this.getBackgroundColor(type)};
        border: 1px solid ${this.getBorderColor(type)};
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 8px;
        color: #fff;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
        pointer-events: auto;
        cursor: pointer;
        position: relative;
        display: flex;
        align-items: center;
        gap: 10px;
      `;

      // Icon
      const icon = document.createElement('span');
      icon.innerHTML = this.getIcon(type);
      icon.style.fontSize = '16px';
      notification.appendChild(icon);

      // Message
      const messageEl = document.createElement('span');
      messageEl.textContent = message;
      messageEl.style.flex = '1';
      notification.appendChild(messageEl);

      // Close button
      if (options.closeable !== false) {
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
          background: none;
          border: none;
          color: #fff;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          margin-left: 8px;
          opacity: 0.7;
        `;
        closeBtn.onclick = (e) => {
          e.stopPropagation();
          this.removeElement(notification);
        };
        notification.appendChild(closeBtn);
      }

      // Click to dismiss
      notification.onclick = () => {
        this.removeElement(notification);
      };

      return notification;
    }

    static getBackgroundColor(type) {
      const colors = {
        success: '#4ade80',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
      };
      return colors[type] || colors.info;
    }

    static getBorderColor(type) {
      const colors = {
        success: '#22c55e',
        error: '#dc2626',
        warning: '#d97706',
        info: '#2563eb'
      };
      return colors[type] || colors.info;
    }

    static getIcon(type) {
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };
      return icons[type] || icons.info;
    }

    static remove(id) {
      const notification = this.notifications.get(id);
      if (notification) {
        this.removeElement(notification);
        this.notifications.delete(id);
      }
    }

    static removeElement(notification) {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }

    static clear() {
      this.notifications.forEach((notification, id) => {
        this.remove(id);
      });
    }

    // Convenience methods
    static success(message, duration = 4000) {
      return this.show(message, 'success', duration);
    }

    static error(message, duration = 6000) {
      return this.show(message, 'error', duration);
    }

    static warning(message, duration = 5000) {
      return this.show(message, 'warning', duration);
    }

    static info(message, duration = 4000) {
      return this.show(message, 'info', duration);
    }
  }

  // Global verfügbar machen
  window.GameEnhancement = window.GameEnhancement || {};
  window.GameEnhancement.NotificationSystem = NotificationSystem;
  
  // Legacy-Support für GonBruck's showNotification
  window.showNotification = (message, type = 'info') => {
    NotificationSystem.show(message, type);
  };
})();