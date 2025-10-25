// Collapsible Gate Info aus GonBruck
(function() {
  'use strict';

  class GateCollapse {
    constructor() {
      this.collapsedSections = new Set();
      this.loadCollapsedState();
    }

    init() {
      if (!window.location.pathname.includes('active_wave.php')) return;
      
      console.log('🚪 Initializing Gate Collapse');
      
      this.addCollapseButtons();
      this.addGlobalToggle();
      this.enhanceGateDisplay();
    }

    addCollapseButtons() {
      // Find gate information sections
      const gateSections = this.findGateSections();
      
      gateSections.forEach(section => {
        this.makeCollapsible(section);
      });
    }

    findGateSections() {
      const sections = [];
      
      // Look for various gate section patterns
      const selectors = [
        '.gate-info',
        '.gate-section',
        '.wave-info',
        '.battle-info',
        '.monster-info-section',
        '.gate-details'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => sections.push(el));
      });

      // Also look for sections containing gate-related headings
      const headings = document.querySelectorAll('h2, h3, h4');
      headings.forEach(heading => {
        const text = heading.textContent.toLowerCase();
        if (text.includes('gate') || text.includes('wave') || text.includes('monster')) {
          const section = heading.closest('div, section') || heading.parentElement;
          if (section && !sections.includes(section)) {
            sections.push(section);
          }
        }
      });

      return sections.filter(section => section && section.children.length > 1);
    }

    makeCollapsible(section) {
      // Don't process if already collapsible
      if (section.querySelector('.collapse-toggle')) return;

      const sectionId = this.generateSectionId(section);
      const isCollapsed = this.collapsedSections.has(sectionId);
      
      // Find or create header
      let header = section.querySelector('h2, h3, h4, .section-header');
      if (!header) {
        header = this.createDefaultHeader(section);
        section.insertBefore(header, section.firstChild);
      }

      // Add collapse button to header
      const collapseButton = this.createCollapseButton(sectionId, isCollapsed);
      header.appendChild(collapseButton);

      // Wrap content (everything except header)
      const content = this.wrapContent(section, header);
      
      // Apply initial collapsed state
      if (isCollapsed) {
        content.style.display = 'none';
        collapseButton.classList.add('collapsed');
      }

      // Add styling
      this.styleCollapsibleSection(section, header);
    }

    generateSectionId(section) {
      // Generate a unique ID for the section
      const header = section.querySelector('h2, h3, h4, .section-header');
      const headerText = header ? header.textContent.trim() : 'section';
      
      return 'gate-section-' + headerText.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 20);
    }

    createDefaultHeader(section) {
      const header = document.createElement('h3');
      header.className = 'section-header';
      
      // Try to infer header text from content
      const firstText = section.textContent.trim().split('\n')[0];
      header.textContent = firstText.substring(0, 30) + (firstText.length > 30 ? '...' : '');
      
      return header;
    }

    createCollapseButton(sectionId, isCollapsed) {
      const button = document.createElement('button');
      button.className = 'collapse-toggle';
      button.innerHTML = isCollapsed ? '▶' : '▼';
      button.title = isCollapsed ? 'Expand section' : 'Collapse section';
      
      button.style.cssText = `
        float: right;
        background: none;
        border: none;
        color: #74c0fc;
        font-size: 14px;
        cursor: pointer;
        padding: 4px;
        border-radius: 3px;
        transition: all 0.2s ease;
        margin-left: 10px;
      `;

      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleSection(sectionId, button);
      });

      button.addEventListener('mouseenter', () => {
        button.style.background = 'rgba(116, 192, 252, 0.2)';
        button.style.transform = 'scale(1.1)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.background = 'none';
        button.style.transform = 'scale(1)';
      });

      return button;
    }

    wrapContent(section, header) {
      const content = document.createElement('div');
      content.className = 'collapsible-content';
      
      // Move all children except header to content wrapper
      const children = Array.from(section.children);
      children.forEach(child => {
        if (child !== header) {
          content.appendChild(child);
        }
      });

      section.appendChild(content);
      return content;
    }

    styleCollapsibleSection(section, header) {
      section.style.cssText += `
        border: 1px solid #45475a;
        border-radius: 6px;
        margin-bottom: 15px;
        overflow: hidden;
        background: #1e1e2e;
      `;

      header.style.cssText += `
        background: linear-gradient(90deg, rgba(116, 192, 252, 0.1), rgba(203, 166, 247, 0.1));
        border-bottom: 1px solid #45475a;
        padding: 12px 15px;
        margin: 0;
        color: #f9e2af;
        font-weight: 600;
        cursor: pointer;
      `;

      const content = section.querySelector('.collapsible-content');
      if (content) {
        content.style.cssText = `
          padding: 15px;
          transition: all 0.3s ease;
        `;
      }

      // Make header clickable for toggle
      header.addEventListener('click', (e) => {
        if (e.target !== header.querySelector('.collapse-toggle')) {
          const button = header.querySelector('.collapse-toggle');
          if (button) {
            button.click();
          }
        }
      });
    }

    toggleSection(sectionId, button) {
      const section = button.closest('div, section');
      const content = section.querySelector('.collapsible-content');
      
      if (!content) return;

      const isCollapsed = content.style.display === 'none';
      
      if (isCollapsed) {
        // Expand
        content.style.display = 'block';
        button.innerHTML = '▼';
        button.title = 'Collapse section';
        button.classList.remove('collapsed');
        this.collapsedSections.delete(sectionId);
      } else {
        // Collapse
        content.style.display = 'none';
        button.innerHTML = '▶';
        button.title = 'Expand section';
        button.classList.add('collapsed');
        this.collapsedSections.add(sectionId);
      }

      this.saveCollapsedState();
    }

    addGlobalToggle() {
      const gateContainer = document.querySelector('.gate-container, .wave-container, .monster-container');
      if (!gateContainer) return;

      const globalToggle = document.createElement('div');
      globalToggle.className = 'global-collapse-toggle';
      globalToggle.innerHTML = `
        <div class="global-toggle-content">
          <h4>🚪 Gate Sections</h4>
          <div class="toggle-actions">
            <button id="expand-all-sections" class="toggle-btn">▼ Expand All</button>
            <button id="collapse-all-sections" class="toggle-btn">▶ Collapse All</button>
          </div>
        </div>
      `;

      globalToggle.style.cssText = `
        background: #313244;
        border: 1px solid #45475a;
        border-radius: 6px;
        padding: 15px;
        margin-bottom: 20px;
      `;

      gateContainer.parentNode.insertBefore(globalToggle, gateContainer);

      this.setupGlobalToggleActions();
      this.addGlobalToggleCSS();
    }

    setupGlobalToggleActions() {
      document.getElementById('expand-all-sections')?.addEventListener('click', () => {
        this.expandAllSections();
      });

      document.getElementById('collapse-all-sections')?.addEventListener('click', () => {
        this.collapseAllSections();
      });
    }

    expandAllSections() {
      const collapseButtons = document.querySelectorAll('.collapse-toggle.collapsed');
      
      collapseButtons.forEach(button => {
        button.click();
      });

      window.GameEnhancement?.NotificationSystem?.success('All sections expanded');
    }

    collapseAllSections() {
      const collapseButtons = document.querySelectorAll('.collapse-toggle:not(.collapsed)');
      
      collapseButtons.forEach(button => {
        button.click();
      });

      window.GameEnhancement?.NotificationSystem?.success('All sections collapsed');
    }

    enhanceGateDisplay() {
      // Add section counting
      this.addSectionCounter();
      
      // Add keyboard shortcuts
      this.addKeyboardShortcuts();
      
      // Add smooth animations
      this.addSmoothAnimations();
    }

    addSectionCounter() {
      const totalSections = document.querySelectorAll('.collapse-toggle').length;
      const collapsedCount = document.querySelectorAll('.collapse-toggle.collapsed').length;
      
      const counter = document.createElement('div');
      counter.className = 'section-counter';
      counter.innerHTML = `
        <span class="counter-text">
          ${totalSections - collapsedCount} of ${totalSections} sections expanded
        </span>
      `;

      counter.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(30, 30, 46, 0.9);
        border: 1px solid #45475a;
        border-radius: 4px;
        padding: 8px 12px;
        font-size: 12px;
        color: #a6adc8;
        z-index: 1000;
      `;

      document.body.appendChild(counter);

      // Update counter when sections are toggled
      const observer = new MutationObserver(() => {
        const newCollapsedCount = document.querySelectorAll('.collapse-toggle.collapsed').length;
        counter.querySelector('.counter-text').textContent = 
          `${totalSections - newCollapsedCount} of ${totalSections} sections expanded`;
      });

      document.querySelectorAll('.collapse-toggle').forEach(button => {
        observer.observe(button, { attributes: true, attributeFilter: ['class'] });
      });
    }

    addKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        // Ctrl + E: Expand all
        if (e.ctrlKey && e.key === 'e') {
          e.preventDefault();
          this.expandAllSections();
        }
        
        // Ctrl + C: Collapse all
        if (e.ctrlKey && e.key === 'c') {
          e.preventDefault();
          this.collapseAllSections();
        }
      });

      // Add keyboard shortcut info
      const shortcutInfo = document.createElement('div');
      shortcutInfo.className = 'keyboard-shortcuts-info';
      shortcutInfo.innerHTML = `
        <div class="shortcuts-content">
          <h5>⌨️ Keyboard Shortcuts</h5>
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>E</kbd> - Expand all sections
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>C</kbd> - Collapse all sections
          </div>
        </div>
      `;

      shortcutInfo.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(30, 30, 46, 0.9);
        border: 1px solid #45475a;
        border-radius: 6px;
        padding: 12px;
        font-size: 11px;
        color: #a6adc8;
        z-index: 1000;
        max-width: 200px;
        opacity: 0.7;
        transition: opacity 0.2s ease;
      `;

      shortcutInfo.addEventListener('mouseenter', () => {
        shortcutInfo.style.opacity = '1';
      });

      shortcutInfo.addEventListener('mouseleave', () => {
        shortcutInfo.style.opacity = '0.7';
      });

      document.body.appendChild(shortcutInfo);
    }

    addSmoothAnimations() {
      const style = document.createElement('style');
      style.textContent = `
        .collapsible-content {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        
        .collapse-toggle {
          transition: transform 0.2s ease, background-color 0.2s ease;
        }
        
        .collapse-toggle.collapsed {
          transform: rotate(-90deg);
        }
        
        /* Smooth height animation */
        .collapsible-content.animating {
          transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `;
      
      document.head.appendChild(style);

      // Enhance toggle animation
      document.querySelectorAll('.collapse-toggle').forEach(button => {
        const originalClick = button.onclick;
        button.onclick = (e) => {
          const content = button.closest('div, section').querySelector('.collapsible-content');
          if (content) {
            content.classList.add('animating');
            setTimeout(() => {
              content.classList.remove('animating');
            }, 300);
          }
          if (originalClick) originalClick.call(button, e);
        };
      });
    }

    saveCollapsedState() {
      try {
        const stateArray = Array.from(this.collapsedSections);
        localStorage.setItem('gate-collapsed-sections', JSON.stringify(stateArray));
      } catch (error) {
        console.warn('Could not save collapsed state:', error);
      }
    }

    loadCollapsedState() {
      try {
        const saved = localStorage.getItem('gate-collapsed-sections');
        if (saved) {
          const stateArray = JSON.parse(saved);
          this.collapsedSections = new Set(stateArray);
        }
      } catch (error) {
        console.warn('Could not load collapsed state:', error);
        this.collapsedSections = new Set();
      }
    }

    addGlobalToggleCSS() {
      const style = document.createElement('style');
      style.textContent = `
        .global-collapse-toggle {
          transition: all 0.2s ease;
        }
        
        .global-toggle-content h4 {
          color: #f9e2af;
          margin: 0 0 12px 0;
          font-size: 16px;
        }
        
        .toggle-actions {
          display: flex;
          gap: 10px;
        }
        
        .toggle-btn {
          padding: 6px 12px;
          background: #45475a;
          border: 1px solid #6c7086;
          border-radius: 4px;
          color: #cdd6f4;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .toggle-btn:hover {
          background: #585b70;
          border-color: #74c0fc;
          color: #74c0fc;
          transform: translateY(-1px);
        }
        
        .section-counter {
          backdrop-filter: blur(5px);
        }
        
        .keyboard-shortcuts-info h5 {
          color: #f9e2af;
          margin: 0 0 8px 0;
          font-size: 12px;
        }
        
        .shortcut-item {
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .shortcut-item kbd {
          background: #45475a;
          color: #cdd6f4;
          padding: 2px 4px;
          border-radius: 2px;
          font-size: 10px;
          font-family: monospace;
          border: 1px solid #6c7086;
        }
        
        /* Section hover effects */
        .collapsible-content:hover {
          background: rgba(203, 166, 247, 0.02);
        }
        
        /* Header hover effects */
        h2:has(.collapse-toggle):hover,
        h3:has(.collapse-toggle):hover,
        h4:has(.collapse-toggle):hover,
        .section-header:hover {
          background: rgba(116, 192, 252, 0.15) !important;
        }
      `;
      
      document.head.appendChild(style);
    }
  }

  // Initialize function
  window.initGateCollapse = function(config = {}) {
    const gateCollapse = new GateCollapse();
    gateCollapse.init();
    return gateCollapse;
  };
})();