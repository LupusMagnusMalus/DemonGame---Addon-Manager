// 24h Time Format System (from Lupus Fork)
(function() {
  'use strict';

  class TimeFormatManager {
    constructor() {
      this.is24Hour = false;
      this.timeElements = new Set();
      this.observer = null;
    }

    init(use24Hour = false) {
      this.is24Hour = use24Hour;
      this.findTimeElements();
      this.setupObserver();
      this.updateAllTimes();
      
      // Listen for configuration changes
      window.addEventListener('message', (event) => {
        if (event.data.type === 'SET_TIME_FORMAT') {
          this.setFormat(event.data.format === '24h');
        }
      });

      console.log(`🕐 Time format initialized: ${use24Hour ? '24h' : '12h'}`);
    }

    setFormat(use24Hour) {
      this.is24Hour = use24Hour;
      this.updateAllTimes();
    }

    findTimeElements() {
      // Find all time elements in the DOM
      const selectors = [
        '.server-time',
        '.game-time',
        '.topbar-time',
        '[data-time]',
        '.time-display'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => this.timeElements.add(el));
      });

      // Find text patterns
      this.findTimeInText();
    }

    findTimeInText() {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Check for time patterns like "3:45 PM" or "15:45"
            const timePattern = /\b\d{1,2}:\d{2}\s*(AM|PM)?\b/i;
            return timePattern.test(node.textContent) ? 
              NodeFilter.FILTER_ACCEPT : 
              NodeFilter.FILTER_REJECT;
          }
        }
      );

      let node;
      while (node = walker.nextNode()) {
        this.timeElements.add(node.parentElement);
      }
    }

    setupObserver() {
      this.observer = new MutationObserver((mutations) => {
        let needsUpdate = false;
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const timeEls = node.querySelectorAll('.server-time, .game-time, .topbar-time');
                timeEls.forEach(el => {
                  this.timeElements.add(el);
                  needsUpdate = true;
                });
              }
            });
          }
        });

        if (needsUpdate) {
          this.updateAllTimes();
        }
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    updateAllTimes() {
      this.timeElements.forEach(element => {
        this.updateTimeElement(element);
      });
    }

    updateTimeElement(element) {
      const timePattern = /\b(\d{1,2}):(\d{2})\s*(AM|PM)?\b/gi;
      
      if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement;
      }

      const originalText = element.textContent;
      const updatedText = originalText.replace(timePattern, (match, hours, minutes, ampm) => {
        return this.convertTime(parseInt(hours), parseInt(minutes), ampm);
      });

      if (updatedText !== originalText) {
        element.textContent = updatedText;
      }
    }

    convertTime(hours, minutes, ampm) {
      if (this.is24Hour) {
        // Convert to 24h format
        if (ampm) {
          if (ampm.toUpperCase() === 'PM' && hours !== 12) {
            hours += 12;
          } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
          }
        }
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } else {
        // Convert to 12h format
        if (!ampm) {
          // Assume input is 24h, convert to 12h
          const period = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
          return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        }
        return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      }
    }

    destroy() {
      if (this.observer) {
        this.observer.disconnect();
      }
      this.timeElements.clear();
    }
  }

  // Make globally available
  window.timeFormatManager = new TimeFormatManager();

  // Auto-init with 12h format as default
  window.timeFormatManager.init(false);
})();