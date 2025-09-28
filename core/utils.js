// Gemeinsame Utility-Funktionen
(function() {
  'use strict';

  class Utils {
    // DOM Utilities
    static createElement(tag, options = {}) {
      const element = document.createElement(tag);
      
      if (options.className) element.className = options.className;
      if (options.id) element.id = options.id;
      if (options.innerHTML) element.innerHTML = options.innerHTML;
      if (options.textContent) element.textContent = options.textContent;
      if (options.style) Object.assign(element.style, options.style);
      if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });
      }
      if (options.dataset) {
        Object.entries(options.dataset).forEach(([key, value]) => {
          element.dataset[key] = value;
        });
      }
      
      return element;
    }

    static waitForElement(selector, timeout = 5000) {
      return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
          return;
        }

        const observer = new MutationObserver((mutations) => {
          const element = document.querySelector(selector);
          if (element) {
            observer.disconnect();
            resolve(element);
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        setTimeout(() => {
          observer.disconnect();
          reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
      });
    }

    static debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    static throttle(func, limit) {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    }

    // Game-specific utilities
    static getCurrentPage() {
      const path = window.location.pathname;
      if (path.includes('active_wave.php')) return 'wave';
      if (path.includes('battle.php')) return 'battle';
      if (path.includes('inventory.php')) return 'inventory';
      if (path.includes('pvp.php')) return 'pvp';
      if (path.includes('stats.php')) return 'stats';
      if (path.includes('pets.php')) return 'pets';
      if (path.includes('merchant.php')) return 'merchant';
      if (path.includes('blacksmith.php')) return 'blacksmith';
      if (path.includes('orc_cull_event.php')) return 'event';
      return 'dashboard';
    }

    static getPlayerStats() {
      // Extrahiere Spieler-Stats aus der Topbar
      const topbar = document.querySelector('.game-topbar');
      if (!topbar) return null;

      return {
        attack: this.extractStatValue(topbar, 'attack'),
        defense: this.extractStatValue(topbar, 'defense'),
        stamina: this.extractStatValue(topbar, 'stamina'),
        points: this.extractStatValue(topbar, 'points'),
        level: this.extractStatValue(topbar, 'level')
      };
    }

    static extractStatValue(container, statType) {
      // Implementiere Stat-Extraktion basierend auf Game-HTML
      const patterns = {
        attack: /⚔️\s*(\d+)/,
        defense: /🛡️\s*(\d+)/,
        stamina: /⚡\s*(\d+)/,
        points: /🔵\s*(\d+)/,
        level: /Level\s*(\d+)/i
      };

      const pattern = patterns[statType];
      if (!pattern) return 0;

      const match = container.textContent.match(pattern);
      return match ? parseInt(match[1]) : 0;
    }

    // Cookie utilities
    static setCookie(name, value, days = 30) {
      const expires = new Date();
      expires.setDate(expires.getDate() + days);
      document.cookie = `${name}=${value}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
    }

    static getCookie(name) {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) {
          return cookieValue;
        }
      }
      return null;
    }

    // Format utilities
    static formatNumber(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    static formatTime(date, format24h = false) {
      const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: !format24h
      };
      return date.toLocaleTimeString('en-US', options);
    }

    // Animation utilities
    static fadeIn(element, duration = 300) {
      element.style.opacity = '0';
      element.style.display = 'block';
      
      const fadeEffect = setInterval(() => {
        if (!element.style.opacity) {
          element.style.opacity = '0';
        }
        if (parseFloat(element.style.opacity) < 1) {
          element.style.opacity = (parseFloat(element.style.opacity) + 0.1).toString();
        } else {
          clearInterval(fadeEffect);
        }
      }, duration / 10);
    }

    static fadeOut(element, duration = 300, callback = null) {
      const fadeEffect = setInterval(() => {
        if (!element.style.opacity) {
          element.style.opacity = '1';
        }
        if (parseFloat(element.style.opacity) > 0) {
          element.style.opacity = (parseFloat(element.style.opacity) - 0.1).toString();
        } else {
          clearInterval(fadeEffect);
          element.style.display = 'none';
          if (callback) callback();
        }
      }, duration / 10);
    }
  }

  // Global verfügbar machen
  window.GameEnhancement = window.GameEnhancement || {};
  window.GameEnhancement.Utils = Utils;
})();