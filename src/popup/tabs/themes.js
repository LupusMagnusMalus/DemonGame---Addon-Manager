// Theme Tab Controller - Complete Color Picker Implementation
(function() {
  'use strict';

  let colorPalette = null;
  let currentColor = { h: 0, s: 100, v: 100 };
  let selectedColorKey = null;
  let isDraggingArea = false;
  let isDraggingHue = false;

  async function init_theme(popupController) {
    console.log('🎨 Initializing Theme tab');
    
    if (!window.colorPalette) {
      colorPalette = new ColorPalette();
      await colorPalette.init();
      window.colorPalette = colorPalette;
    } else {
      colorPalette = window.colorPalette;
    }
    
    initColorPicker();
    initThemePreview();
    setupThemeSelector(popupController);
    setupSaveButton(popupController);
    setupImportExport(popupController);
    
    updateThemePreview();
  }

  // ========== COLOR PICKER INITIALIZATION ==========

  function initColorPicker() {
    const colorArea = document.getElementById('colorArea');
    const hueSlider = document.getElementById('hueSlider');
    const hexInput = document.getElementById('hexInput');
    const colorModelSelect = document.getElementById('colorModelSelect');
    
    // Color Area Events
    colorArea.addEventListener('mousedown', startDraggingArea);
    document.addEventListener('mousemove', dragArea);
    document.addEventListener('mouseup', stopDragging);
    
    // Hue Slider Events
    hueSlider.addEventListener('mousedown', startDraggingHue);
    
    // Hex Input
    hexInput.addEventListener('input', handleHexInput);
    
    // Color Model Select
    colorModelSelect.addEventListener('change', handleColorModelChange);
    
    // Component Inputs
    ['component1', 'component2', 'component3', 'component4'].forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', handleComponentInput);
        input.addEventListener('keydown', handleComponentKeydown);
      }
    });
  }

  function startDraggingArea(e) {
    isDraggingArea = true;
    updateColorFromArea(e);
  }

  function dragArea(e) {
    if (!isDraggingArea) return;
    updateColorFromArea(e);
  }

  function updateColorFromArea(e) {
    const colorArea = document.getElementById('colorArea');
    const rect = colorArea.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    
    const s = (x / rect.width) * 100;
    const v = 100 - (y / rect.height) * 100;
    
    currentColor.s = s;
    currentColor.v = v;
    
    updateColorDisplay();
    updateColorCursor(x, y);
  }

  function startDraggingHue(e) {
    isDraggingHue = true;
    updateHueFromSlider(e);
  }

  function updateHueFromSlider(e) {
    const hueSlider = document.getElementById('hueSlider');
    const rect = hueSlider.getBoundingClientRect();
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    
    const h = (y / rect.height) * 360;
    currentColor.h = h;
    
    updateColorDisplay();
    updateHueCursor(y);
    updateColorAreaBackground();
  }

  function stopDragging() {
    if (isDraggingArea || isDraggingHue) {
      isDraggingArea = false;
      isDraggingHue = false;
      
      // Apply color if a theme color is selected
      if (selectedColorKey) {
        const hex = hsvToHex(currentColor.h, currentColor.s, currentColor.v);
        applyColorToTheme(selectedColorKey, hex);
      }
    }
  }

  document.addEventListener('mousemove', (e) => {
    if (isDraggingHue) {
      updateHueFromSlider(e);
    }
  });

  function updateColorCursor(x, y) {
    const cursor = document.getElementById('colorCursor');
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
  }

  function updateHueCursor(y) {
    const cursor = document.getElementById('hueCursor');
    cursor.style.top = `${y}px`;
  }

  function updateColorAreaBackground() {
    const colorArea = document.getElementById('colorArea');
    const hueColor = `hsl(${currentColor.h}, 100%, 50%)`;
    colorArea.style.background = `
      linear-gradient(to top, #000, transparent),
      linear-gradient(to right, #fff, ${hueColor})
    `;
  }

  function updateColorDisplay() {
    const hex = hsvToHex(currentColor.h, currentColor.s, currentColor.v);
    const rgb = hexToRgb(hex);
    
    // Update hex input
    document.getElementById('hexInput').value = hex;
    
    // Update color preview
    document.getElementById('colorPreview').style.background = hex;
    
    // Update components based on current model
    updateColorComponents(hex);
  }

  function updateColorComponents(hex) {
    const model = document.getElementById('colorModelSelect').value;
    const rgb = hexToRgb(hex);
    
    switch(model) {
      case 'rgb':
        document.getElementById('component1').value = rgb.r;
        document.getElementById('component2').value = rgb.g;
        document.getElementById('component3').value = rgb.b;
        break;
      case 'hsl':
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        document.getElementById('component1').value = Math.round(hsl.h);
        document.getElementById('component2').value = Math.round(hsl.s);
        document.getElementById('component3').value = Math.round(hsl.l);
        break;
      case 'hsv':
        document.getElementById('component1').value = Math.round(currentColor.h);
        document.getElementById('component2').value = Math.round(currentColor.s);
        document.getElementById('component3').value = Math.round(currentColor.v);
        break;
      case 'cmyk':
        const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
        document.getElementById('component1').value = Math.round(cmyk.c);
        document.getElementById('component2').value = Math.round(cmyk.m);
        document.getElementById('component3').value = Math.round(cmyk.y);
        document.getElementById('component4').value = Math.round(cmyk.k);
        break;
    }
  }

  function handleHexInput(e) {
    let hex = e.target.value;
    if (!hex.startsWith('#')) hex = '#' + hex;
    
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      const hsv = hexToHsv(hex);
      currentColor = hsv;
      
      updateColorAreaBackground();
      updateColorDisplay();
      
      // Update cursors
      const colorArea = document.getElementById('colorArea');
      const rect = colorArea.getBoundingClientRect();
      updateColorCursor((hsv.s / 100) * rect.width, (1 - hsv.v / 100) * rect.height);
      
      const hueSlider = document.getElementById('hueSlider');
      const hueRect = hueSlider.getBoundingClientRect();
      updateHueCursor((hsv.h / 360) * hueRect.height);
      
      if (selectedColorKey) {
        applyColorToTheme(selectedColorKey, hex);
      }
    }
  }

  function handleColorModelChange(e) {
    const model = e.target.value;
    const labels = {
      rgb: ['R', 'G', 'B'],
      hsl: ['H', 'S', 'L'],
      hsv: ['H', 'S', 'V'],
      cmyk: ['C', 'M', 'Y', 'K']
    };
    
    const limits = {
      rgb: [255, 255, 255],
      hsl: [360, 100, 100],
      hsv: [360, 100, 100],
      cmyk: [100, 100, 100, 100]
    };
    
    // Update labels
    document.getElementById('component1Label').textContent = labels[model][0];
    document.getElementById('component2Label').textContent = labels[model][1];
    document.getElementById('component3Label').textContent = labels[model][2];
    
    // Update max values
    document.getElementById('component1').max = limits[model][0];
    document.getElementById('component2').max = limits[model][1];
    document.getElementById('component3').max = limits[model][2];
    
    // Show/hide 4th component for CMYK
    const component4Container = document.getElementById('component4Container');
    if (model === 'cmyk') {
      component4Container.style.display = 'flex';
      document.getElementById('component4Label').textContent = labels[model][3];
      document.getElementById('component4').max = limits[model][3];
    } else {
      component4Container.style.display = 'none';
    }
    
    updateColorComponents(document.getElementById('hexInput').value);
  }

  function handleComponentInput(e) {
    const model = document.getElementById('colorModelSelect').value;
    const c1 = parseInt(document.getElementById('component1').value) || 0;
    const c2 = parseInt(document.getElementById('component2').value) || 0;
    const c3 = parseInt(document.getElementById('component3').value) || 0;
    const c4 = parseInt(document.getElementById('component4').value) || 0;
    
    let hex;
    switch(model) {
      case 'rgb':
        hex = rgbToHex(c1, c2, c3);
        break;
      case 'hsl':
        hex = hslToHex(c1, c2, c3);
        break;
      case 'hsv':
        hex = hsvToHex(c1, c2, c3);
        currentColor = { h: c1, s: c2, v: c3 };
        break;
      case 'cmyk':
        hex = cmykToHex(c1, c2, c3, c4);
        break;
    }
    
    document.getElementById('hexInput').value = hex;
    document.getElementById('colorPreview').style.background = hex;
    
    if (model === 'hsv') {
      updateColorAreaBackground();
    }
    
    if (selectedColorKey) {
      applyColorToTheme(selectedColorKey, hex);
    }
  }

  function handleComponentKeydown(e) {
    const input = e.target;
    const step = e.shiftKey ? 10 : 1;
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      input.value = Math.min(parseInt(input.max), parseInt(input.value) + step);
      input.dispatchEvent(new Event('input'));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      input.value = Math.max(0, parseInt(input.value) - step);
      input.dispatchEvent(new Event('input'));
    }
  }

  // ========== THEME PREVIEW ==========

  function initThemePreview() {
    document.querySelectorAll('.theme-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const colorKey = btn.getAttribute('data-color');
        selectColorForEditing(colorKey, btn);
      });
    });
  }

  function selectColorForEditing(colorKey, btn) {
    // Deselect previous
    document.querySelectorAll('.theme-color-btn').forEach(b => b.classList.remove('active'));
    
    // Select new
    btn.classList.add('active');
    selectedColorKey = colorKey;
    
    // Load color into picker
    const hex = colorPalette.getColorValue(colorKey);
    const hsv = hexToHsv(hex);
    currentColor = hsv;
    
    document.getElementById('hexInput').value = hex;
    document.getElementById('colorPreview').style.background = hex;
    
    updateColorAreaBackground();
    updateColorComponents(hex);
    
    // Update cursors
    const colorArea = document.getElementById('colorArea');
    const rect = colorArea.getBoundingClientRect();
    updateColorCursor((hsv.s / 100) * rect.width, (1 - hsv.v / 100) * rect.height);
    
    const hueSlider = document.getElementById('hueSlider');
    const hueRect = hueSlider.getBoundingClientRect();
    updateHueCursor((hsv.h / 360) * hueRect.height);
  }

  function applyColorToTheme(colorKey, hex) {
    colorPalette.setCustomColor(colorKey, hex);
    
    // Update swatch
    const swatch = document.getElementById(`swatch-${colorKey}`);
    if (swatch) {
      swatch.style.background = hex;
    }
    
    // If panel-1 changed, update derived panels
    if (colorKey === 'panel-1') {
      updateDerivedPanels(hex);
    }
    
    // Switch to custom theme
    document.getElementById('themeSelector').value = 'custom';
  }

  function updateDerivedPanels(panel1Hex) {
    const panel2 = colorPalette.lightenColor(panel1Hex, 10);
    const panel3 = colorPalette.lightenColor(panel1Hex, 20);
    
    const swatch2 = document.getElementById('swatch-panel-2');
    const swatch3 = document.getElementById('swatch-panel-3');
    
    if (swatch2) swatch2.style.background = panel2;
    if (swatch3) swatch3.style.background = panel3;
  }

  function updateThemePreview() {
    const colors = colorPalette.getCurrentColors();
    
    Object.keys(colors).forEach(key => {
      const swatch = document.getElementById(`swatch-${key}`);
      if (swatch) {
        swatch.style.background = colors[key];
      }
    });
    
    // Update derived panels
    if (colors['panel-1']) {
      updateDerivedPanels(colors['panel-1']);
    }
  }

  // ========== THEME SELECTOR ==========

  function setupThemeSelector(popupController) {
    const selector = document.getElementById('themeSelector');
    
    selector.addEventListener('change', async (e) => {
      const themeId = e.target.value;
      
      if (themeId === 'custom') {
        popupController.showToast('Custom theme selected', 'info');
        return;
      }
      
      await colorPalette.setTheme(themeId);
      updateThemePreview();
      
      // Clear selection
      document.querySelectorAll('.theme-color-btn').forEach(b => b.classList.remove('active'));
      selectedColorKey = null;
      
      popupController.showToast(`Theme: ${themeId}`, 'success');
    });
  }

  // ========== SAVE BUTTON ==========

  function setupSaveButton(popupController) {
    const saveBtn = document.getElementById('saveThemeBtn');
    
    saveBtn.addEventListener('click', async () => {
      await colorPalette.applyCustomColors();
      popupController.showToast('Theme saved and applied!', 'success');
    });
  }

  // ========== IMPORT/EXPORT ==========

  function setupImportExport(popupController) {
    document.getElementById('exportTheme')?.addEventListener('click', () => {
      const theme = colorPalette.exportTheme();
      const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `lupus-theme-${Date.now()}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      popupController.showToast('Theme exported', 'success');
    });
    
    document.getElementById('importTheme')?.addEventListener('click', () => {
      document.getElementById('themeFile').click();
    });
    
    document.getElementById('themeFile')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const themeData = JSON.parse(text);
        
        await colorPalette.importTheme(themeData);
        updateThemePreview();
        document.getElementById('themeSelector').value = 'custom';
        
        popupController.showToast('Theme imported', 'success');
      } catch (error) {
        console.error('Import failed:', error);
        popupController.showToast('Failed to import theme', 'error');
      }
    });
  }

  // ========== COLOR CONVERSION UTILITIES ==========

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  function hexToHsv(hex) {
    const rgb = hexToRgb(hex);
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
  }

  function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    if (diff !== 0) {
      if (max === r) {
        h = 60 * (((g - b) / diff) % 6);
      } else if (max === g) {
        h = 60 * (((b - r) / diff) + 2);
      } else {
        h = 60 * (((r - g) / diff) + 4);
      }
    }
    if (h < 0) h += 360;
    
    const s = max === 0 ? 0 : (diff / max) * 100;
    const v = max * 100;
    
    return { h, s, v };
  }

  function hsvToHex(h, s, v) {
    s /= 100;
    v /= 100;
    
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    return rgbToHex(
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255)
    );
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    if (diff !== 0) {
      if (max === r) h = 60 * (((g - b) / diff) % 6);
      else if (max === g) h = 60 * (((b - r) / diff) + 2);
      else h = 60 * (((r - g) / diff) + 4);
    }
    if (h < 0) h += 360;
    
    const l = (max + min) / 2;
    const s = diff === 0 ? 0 : diff / (1 - Math.abs(2 * l - 1));
    
    return { h, s: s * 100, l: l * 100 };
  }

  function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    return rgbToHex(
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255)
    );
  }

  function rgbToCmyk(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const k = 1 - Math.max(r, g, b);
    const c = k === 1 ? 0 : (1 - r - k) / (1 - k);
    const m = k === 1 ? 0 : (1 - g - k) / (1 - k);
    const y = k === 1 ? 0 : (1 - b - k) / (1 - k);
    
    return { c: c * 100, m: m * 100, y: y * 100, k: k * 100 };
  }

  function cmykToHex(c, m, y, k) {
    c /= 100;
    m /= 100;
    y /= 100;
    k /= 100;
    
    const r = 255 * (1 - c) * (1 - k);
    const g = 255 * (1 - m) * (1 - k);
    const b = 255 * (1 - y) * (1 - k);
    
    return rgbToHex(Math.round(r), Math.round(g), Math.round(b));
  }

  // ========== CLEANUP ==========

  function cleanup_theme() {
    console.log('🎨 Cleaning up Theme tab');
    document.removeEventListener('mousemove', dragArea);
    document.removeEventListener('mouseup', stopDragging);
  }

  // Export
  window.init_theme = init_theme;
  window.cleanup_theme = cleanup_theme;
})();