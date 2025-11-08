/**
 * DemonGame Addon Manager - Dependency Resolver
 * Handles module dependency resolution and loading order
 */

class DependencyResolver {
  constructor() {
    this.dependencies = new Map(); // moduleId -> Set of dependencies
    this.reverseDependencies = new Map(); // moduleId -> Set of dependents
    this.resolvedOrder = [];
    this.visited = new Set();
    this.visiting = new Set();
  }

  /**
   * Add dependency relationship
   * @param {string} moduleId - Module that depends on something
   * @param {string} dependencyId - Module that is depended upon
   * @param {string} version - Required version (semver)
   */
  addDependency(moduleId, dependencyId, version = '*') {
    if (!this.dependencies.has(moduleId)) {
      this.dependencies.set(moduleId, new Map());
    }
    
    if (!this.reverseDependencies.has(dependencyId)) {
      this.reverseDependencies.set(dependencyId, new Set());
    }

    this.dependencies.get(moduleId).set(dependencyId, version);
    this.reverseDependencies.get(dependencyId).add(moduleId);
  }

  /**
   * Remove module and all its dependencies
   */
  removeModule(moduleId) {
    // Remove dependencies
    if (this.dependencies.has(moduleId)) {
      for (const [depId] of this.dependencies.get(moduleId)) {
        this.reverseDependencies.get(depId)?.delete(moduleId);
      }
      this.dependencies.delete(moduleId);
    }

    // Remove reverse dependencies
    if (this.reverseDependencies.has(moduleId)) {
      for (const dependentId of this.reverseDependencies.get(moduleId)) {
        this.dependencies.get(dependentId)?.delete(moduleId);
      }
      this.reverseDependencies.delete(moduleId);
    }
  }

  /**
   * Check for circular dependencies
   */
  hasCircularDependencies() {
    this.visited.clear();
    this.visiting.clear();

    for (const moduleId of this.dependencies.keys()) {
      if (!this.visited.has(moduleId)) {
        if (this.detectCycle(moduleId)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Detect circular dependency using DFS
   */
  detectCycle(moduleId) {
    if (this.visiting.has(moduleId)) {
      return true; // Circular dependency found
    }
    
    if (this.visited.has(moduleId)) {
      return false;
    }

    this.visiting.add(moduleId);

    if (this.dependencies.has(moduleId)) {
      for (const [depId] of this.dependencies.get(moduleId)) {
        if (this.detectCycle(depId)) {
          return true;
        }
      }
    }

    this.visiting.delete(moduleId);
    this.visited.add(moduleId);
    return false;
  }

  /**
   * Resolve dependency order using topological sort
   * @param {Set<string>} moduleIds - Modules to resolve
   * @returns {Array<string>} - Modules in load order
   */
  resolveDependencyOrder(moduleIds) {
    this.resolvedOrder = [];
    this.visited.clear();

    // First check for circular dependencies
    if (this.hasCircularDependencies()) {
      throw new Error('Circular dependencies detected');
    }

    // Topological sort
    for (const moduleId of moduleIds) {
      if (!this.visited.has(moduleId)) {
        this.topologicalSort(moduleId);
      }
    }

    // Return only modules that were requested
    return this.resolvedOrder.filter(id => moduleIds.has(id));
  }

  /**
   * Topological sort using DFS
   */
  topologicalSort(moduleId) {
    this.visited.add(moduleId);

    if (this.dependencies.has(moduleId)) {
      for (const [depId] of this.dependencies.get(moduleId)) {
        if (!this.visited.has(depId)) {
          this.topologicalSort(depId);
        }
      }
    }

    this.resolvedOrder.unshift(moduleId); // Add to beginning for correct order
  }

  /**
   * Check if version requirement is satisfied
   * @param {string} requiredVersion - Required version (semver pattern)
   * @param {string} availableVersion - Available version
   * @returns {boolean}
   */
  isVersionSatisfied(requiredVersion, availableVersion) {
    if (requiredVersion === '*') return true;
    
    try {
      return this.satisfiesVersion(availableVersion, requiredVersion);
    } catch (error) {
      console.warn(`Version check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Simple semver satisfaction check
   */
  satisfiesVersion(available, required) {
    // Remove pre-release identifiers for comparison
    const cleanAvailable = available.split('-')[0];
    const cleanRequired = required.replace(/[^0-9.]/g, '');

    const availableParts = cleanAvailable.split('.').map(Number);
    const requiredParts = cleanRequired.split('.').map(Number);

    // Handle different version patterns
    if (required.startsWith('^')) {
      // Compatible within major version
      return availableParts[0] === requiredParts[0] && 
             this.compareVersions(availableParts, requiredParts) >= 0;
    } else if (required.startsWith('~')) {
      // Compatible within minor version
      return availableParts[0] === requiredParts[0] && 
             availableParts[1] === requiredParts[1] &&
             this.compareVersions(availableParts, requiredParts) >= 0;
    } else if (required.startsWith('>=')) {
      return this.compareVersions(availableParts, requiredParts) >= 0;
    } else if (required.startsWith('>')) {
      return this.compareVersions(availableParts, requiredParts) > 0;
    } else {
      // Exact match
      return available === required;
    }
  }

  /**
   * Compare two version arrays
   * Returns: -1 if a < b, 0 if a === b, 1 if a > b
   */
  compareVersions(a, b) {
    const maxLength = Math.max(a.length, b.length);
    
    for (let i = 0; i < maxLength; i++) {
      const aVal = a[i] || 0;
      const bVal = b[i] || 0;
      
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }
    
    return 0;
  }

  /**
   * Validate all dependencies for a set of modules
   * @param {Map<string, Object>} moduleRegistry - Available modules
   * @param {Set<string>} targetModules - Modules to validate
   * @returns {Object} - Validation result
   */
  validateDependencies(moduleRegistry, targetModules) {
    const errors = [];
    const warnings = [];
    const missing = new Set();

    for (const moduleId of targetModules) {
      const module = moduleRegistry.get(moduleId);
      if (!module) {
        errors.push(`Module ${moduleId} not found in registry`);
        continue;
      }

      if (this.dependencies.has(moduleId)) {
        for (const [depId, requiredVersion] of this.dependencies.get(moduleId)) {
          const dependency = moduleRegistry.get(depId);
          
          if (!dependency) {
            missing.add(depId);
            errors.push(`Module ${moduleId} requires missing dependency: ${depId}`);
          } else if (!this.isVersionSatisfied(requiredVersion, dependency.version)) {
            errors.push(
              `Module ${moduleId} requires ${depId} ${requiredVersion}, but ${dependency.version} is available`
            );
          } else if (dependency.enabled === false) {
            warnings.push(`Dependency ${depId} for ${moduleId} is disabled`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      missingDependencies: Array.from(missing)
    };
  }

  /**
   * Get all dependencies for a module (recursive)
   */
  getAllDependencies(moduleId, visited = new Set()) {
    if (visited.has(moduleId)) return new Set();
    
    visited.add(moduleId);
    const allDeps = new Set();

    if (this.dependencies.has(moduleId)) {
      for (const [depId] of this.dependencies.get(moduleId)) {
        allDeps.add(depId);
        
        // Add recursive dependencies
        const subDeps = this.getAllDependencies(depId, visited);
        subDeps.forEach(dep => allDeps.add(dep));
      }
    }

    return allDeps;
  }

  /**
   * Get all modules that depend on a given module
   */
  getDependents(moduleId) {
    return this.reverseDependencies.get(moduleId) || new Set();
  }

  /**
   * Clear all dependency data
   */
  clear() {
    this.dependencies.clear();
    this.reverseDependencies.clear();
    this.resolvedOrder = [];
    this.visited.clear();
    this.visiting.clear();
  }

  /**
   * Export dependency graph for debugging
   */
  exportGraph() {
    const graph = {};
    
    for (const [moduleId, deps] of this.dependencies) {
      graph[moduleId] = {};
      for (const [depId, version] of deps) {
        graph[moduleId][depId] = version;
      }
    }
    
    return graph;
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.DependencyResolver = DependencyResolver;
}

// Also support module exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DependencyResolver;
}

console.log('🔗 Dependency Resolver loaded');
