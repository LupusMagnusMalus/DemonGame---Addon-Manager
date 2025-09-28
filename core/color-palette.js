// Globales Farbpaletten-System
(function() {
  'use strict';

  class ColorPalette {
    static SIDEBAR_COLORS = [
      { id: 'dark-blue', name: 'Dark Blue', value: '#1e1e2e' },
      { id: 'dark-gray', name: 'Dark Gray', value: '#2d2d3d' },
      { id: 'night-blue', name: 'Night Blue', value: '#1a1a2e' },
      { id: 'navy', name: 'Navy', value: '#16213e' },
      { id: 'ocean', name: 'Ocean Blue', value: '#0f3460' },
      { id: 'purple', name: 'Purple', value: '#533483' },
      { id: 'violet', name: 'Violet', value: '#7209b7' },
      { id: 'deep-purple', name: 'Deep Purple', value: '#2d1b69' },
      { id: 'forest', name: 'Forest Green', value: '#0b6623' },
      { id: 'brown', name: 'Brown', value: '#654321' },
      { id: 'dark-red', name: 'Dark Red', value: '#8b0000' },
      { id: 'black', name: 'Black', value: '#000000' }
    ];

    static BACKGROUND_COLORS = [
      { id: 'black', name: 'Black', value: '#000000' },
      { id: 'dark-gray', name: 'Very Dark Gray', value: '#1a1a1a' },
      { id: 'medium-gray', name: 'Dark Gray', value: '#2d2d2d' },
      { id: 'dark-blue', name: 'Dark Blue', value: '#0f0f23' },
      { id: 'dark-purple', name: 'Dark Purple', value: '#1a0033' },
      { id: 'dark-green', name: 'Dark Green', value: '#001a00' },
      { id: 'dark-red', name: 'Dark Red', value: '#1a0000' },
      { id: 'dark-teal', name: 'Dark Teal', value: '#001a1a' }
    ];

    static ACCENT_COLORS = {
      gold: '#FFD369',
      purple: '#cba6f7',
      green: '#a6e3a1',
      blue: '#74c0fc',
      red: '#f38ba8',
      yellow: '#f9e2af'
    };

    static applySidebarColor(colorId) {
      const color = this.SIDEBAR_COLORS.find(c => c.id === colorId);
      if (color) {
        document.documentElement.style.setProperty('--current-sidebar-color', color.value);
        const sidebar = document.getElementById('game-sidebar');
        if (sidebar) {
          sidebar.style.background = color.value;
        }
        return color.value;
      }
    }

    static applyBackgroundColor(colorId) {
      const color = this.BACKGROUND_COLORS.find(c => c.id === colorId);
      if (color) {
        document.documentElement.style.setProperty('--current-background-color', color.value);
        document.body.style.backgroundColor = color.value;
        return color.value;
      }
    }

    static getCurrentTheme() {
      const sidebar = getComputedStyle(document.documentElement)
        .getPropertyValue('--current-sidebar-color').trim();
      const background = getComputedStyle(document.documentElement)
        .getPropertyValue('--current-background-color').trim();

      return {
        sidebar: this.SIDEBAR_COLORS.find(c => c.value === sidebar)?.id || 'dark-blue',
        background: this.BACKGROUND_COLORS.find(c => c.value === background)?.id || 'black'
      };
    }

    static generateColorPaletteHTML(type = 'sidebar') {
      const colors = type === 'sidebar' ? this.SIDEBAR_COLORS : this.BACKGROUND_COLORS;
      return colors.map(color => 
        `<div class="color-option" 
             style="background: ${color.value}" 
             data-color-id="${color.id}" 
             data-color-value="${color.value}"
             title="${color.name}">
         </div>`
      ).join('');
    }
  }

  // Global verfügbar machen
  window.GameEnhancement = window.GameEnhancement || {};
  window.GameEnhancement.ColorPalette = ColorPalette;
})();