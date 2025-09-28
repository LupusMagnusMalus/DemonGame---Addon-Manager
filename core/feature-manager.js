// Feature Loading & Management System
(function() {
  'use strict';

  class FeatureManager {
    static loadedFeatures = new Map();
    static featureDefinitions = null;

    static async init() {
      await this.loadFeatureDefinitions();
    }

    static async loadFeatureDefinitions() {
      try {
        const response = await fetch(chrome.runtime.getURL('config/features.json'));
        this.featureDefinitions = await response.json();
      } catch (error) {
        console.error('Failed to load feature definitions:', error);
      }
    }

    static async loadFeature(category, featureName, config = {}) {
      const featureKey = `${category}.${featureName}`;
      
      if (this.loadedFeatures.has(featureKey)) {
        console.log(`Feature ${featureKey} already loaded`);
        return true;
      }

      try {
        // Check dependencies
        if (this.featureDefinitions) {
          const hasConflicts = this.checkConflicts(category, featureName);
          if (hasConflicts) {
            console.warn(`Feature ${featureKey} has conflicts:`, hasConflicts);
            return false;
          }

          const missingDeps = this.checkDependencies(category, featureName);
          if (missingDeps.length > 0) {
            console.warn(`Feature ${featureKey} missing dependencies:`, missingDeps);
            return false;
          }
        }

        // Load feature files
        const paths = this.getFeaturePaths(category, featureName);
        const loadPromises = [];

        for (const path of paths.css) {
          loadPromises.push(this.loadCSS(path));
        }

        for (const path of paths.js) {
          loadPromises.push(this.loadScript(path));
        }

        await Promise.all(loadPromises);

        // Initialize feature if it has an init method
        const initMethod = this.getFeatureInitMethod(category, featureName);
        if (initMethod && typeof window[initMethod] === 'function') {
          window[initMethod](config);
        }

        this.loadedFeatures.set(featureKey, {
          category,
          featureName,
          config,
          loadedAt: Date.now()
        });

        console.log(`✅ Feature loaded: ${featureKey}`);
        return true;

      } catch (error) {
        console.error(`❌ Failed to load feature ${featureKey}:`, error);
        return false;
      }
    }

    static getFeaturePaths(category, featureName) {
      const basePaths = {
        base: `base/modules/${featureName}.js`,
        lupus: `addons/lupus-enhancements/modules/${featureName}.js`,
        asura: `addons/asura-advanced/modules/${featureName}.js`
      };

      const cssBasePaths = {
        base: `base/styles/${featureName}.css`,
        lupus: `addons/lupus-enhancements/styles/${featureName}.css`,
        asura: `addons/asura-advanced/styles/${featureName}.css`
      };

      return {
        js: [basePaths[category]].filter(Boolean),
        css: [cssBasePaths[category]].filter(Boolean)
      };
    }

    static getFeatureInitMethod(category, featureName) {
      const methodMappings = {
        'base.sidebar': 'initBaseSidebar',
        'base.wave-mods': 'initWaveMods',
        'base.battle-mods': 'initBattleMods',
        'lupus.submenu-manager': 'initSubmenuManager',
        'lupus.enhanced-sidebar': 'initEnhancedSidebar',
        'asura.advanced-sidebar': 'initAdvancedSidebar',
        'asura.settings-manager': 'initSettingsManager'
      };

      return methodMappings[`${category}.${featureName}`];
    }

    static checkConflicts(category, featureName) {
      if (!this.featureDefinitions?.compatibilityMatrix?.conflicts) return null;

      const currentFeature = `${category}.${featureName}`;
      const conflicts = this.featureDefinitions.compatibilityMatrix.conflicts;

      for (const conflictPair of conflicts) {
        if (conflictPair.includes(currentFeature)) {
          const conflictWith = conflictPair.find(f => f !== currentFeature);
          if (this.isFeatureLoaded(conflictWith)) {
            return conflictWith;
          }
        }
      }

      return null;
    }

    static checkDependencies(category, featureName) {
      if (!this.featureDefinitions?.compatibilityMatrix?.dependencies) return [];

      const currentFeature = `${category}.${featureName}`;
      const dependencies = this.featureDefinitions.compatibilityMatrix.dependencies;
      const missing = [];

      for (const [feature, deps] of dependencies) {
        if (feature === currentFeature) {
          for (const dep of deps) {
            if (!this.isFeatureLoaded(dep)) {
              missing.push(dep);
            }
          }
        }
      }

      return missing;
    }

    static isFeatureLoaded(featureKey) {
      return this.loadedFeatures.has(featureKey);
    }

    static async loadScript(path) {
      return new Promise((resolve, reject) => {
        fetch(chrome.runtime.getURL(path))
          .then(response => response.text())
          .then(scriptText => {
            const script = document.createElement('script');
            script.textContent = scriptText;
            script.dataset.featureManager = path;
            document.head.appendChild(script);
            resolve();
          })
          .catch(reject);
      });
    }

    static async loadCSS(path) {
      return new Promise((resolve, reject) => {
        fetch(chrome.runtime.getURL(path))
          .then(response => response.text())
          .then(cssText => {
            const style = document.createElement('style');
            style.textContent = cssText;
            style.dataset.featureManager = path;
            document.head.appendChild(style);
            resolve();
          })
          .catch(reject);
      });
    }

    static unloadFeature(category, featureName) {
      const featureKey = `${category}.${featureName}`;
      
      if (this.loadedFeatures.has(featureKey)) {
        // Remove loaded elements
        const elements = document.querySelectorAll(`[data-feature-manager*="${category}"][data-feature-manager*="${featureName}"]`);
        elements.forEach(el => el.remove());

        this.loadedFeatures.delete(featureKey);
        console.log(`🗑️ Feature unloaded: ${featureKey}`);
        return true;
      }

      return false;
    }

    static getLoadedFeatures() {
      return Array.from(this.loadedFeatures.keys());
    }

    static getFeatureInfo(category, featureName) {
      const featureKey = `${category}.${featureName}`;
      return this.loadedFeatures.get(featureKey);
    }
  }

  // Global verfügbar machen
  window.GameEnhancement = window.GameEnhancement || {};
  window.GameEnhancement.FeatureManager = FeatureManager;
})();