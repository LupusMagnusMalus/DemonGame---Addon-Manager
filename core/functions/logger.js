/**
 * DemonGame Addon Manager - Logger System
 * Centralized logging with levels, formatting, and storage
 */

class Logger {
  constructor() {
    this.level = 'info'; // 'debug', 'info', 'warn', 'error'
    this.maxLogs = 1000;
    this.logs = [];
    this.enabled = true;
    this.prefix = '🎯 DemonGame';
    this.storage = null;

    // Log levels with priorities (lower number = higher priority)
    this.levels = {
      debug: 0,
      info: 1, 
      warn: 2,
      error: 3
    };

    // Colors for console output
    this.colors = {
      debug: '#94a3b8', // slate-400
      info: '#3b82f6',  // blue-500
      warn: '#f59e0b',  // amber-500  
      error: '#ef4444'  // red-500
    };

    this.initializeStorage();
  }

  /**
   * Initialize storage for persistent logs
   */
  async initializeStorage() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        this.storage = chrome.storage.local;
        await this.loadStoredLogs();
      }
    } catch (error) {
      console.warn('Logger: Failed to initialize storage:', error);
    }
  }

  /**
   * Load logs from storage
   */
  async loadStoredLogs() {
    try {
      if (!this.storage) return;
      
      const { logs = [] } = await this.storage.get('logs');
      this.logs = logs.slice(-this.maxLogs); // Keep only recent logs
    } catch (error) {
      console.warn('Logger: Failed to load stored logs:', error);
    }
  }

  /**
   * Save logs to storage
   */
  async saveLogsToStorage() {
    try {
      if (!this.storage) return;
      
      const logsToSave = this.logs.slice(-this.maxLogs);
      await this.storage.set({ logs: logsToSave });
    } catch (error) {
      console.warn('Logger: Failed to save logs:', error);
    }
  }

  /**
   * Set logging level
   */
  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.level = level;
      this.info(`Log level set to: ${level}`);
    } else {
      this.warn(`Invalid log level: ${level}`);
    }
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      this.info('Logger enabled');
    }
  }

  /**
   * Check if level should be logged
   */
  shouldLog(level) {
    return this.enabled && this.levels[level] >= this.levels[this.level];
  }

  /**
   * Format log message
   */
  formatMessage(level, message, context = null) {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);
    
    let formatted = `[${timestamp}] ${levelUpper} ${this.prefix}: ${message}`;
    
    if (context) {
      if (typeof context === 'object') {
        formatted += ` | Context: ${JSON.stringify(context, null, 2)}`;
      } else {
        formatted += ` | Context: ${context}`;
      }
    }
    
    return formatted;
  }

  /**
   * Add log entry
   */
  addLogEntry(level, message, context = null) {
    const entry = {
      timestamp: Date.now(),
      level,
      message,
      context,
      formatted: this.formatMessage(level, message, context)
    };

    this.logs.push(entry);

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Save to storage periodically
    if (this.logs.length % 10 === 0) {
      this.saveLogsToStorage();
    }

    return entry;
  }

  /**
   * Output to console with styling
   */
  outputToConsole(level, message, context = null) {
    const color = this.colors[level];
    const emoji = this.getEmoji(level);
    
    const style = `color: ${color}; font-weight: bold;`;
    const resetStyle = 'color: inherit; font-weight: normal;';
    
    const formattedMessage = `%c${emoji} ${this.prefix}:%c ${message}`;
    
    if (context) {
      console[level === 'debug' ? 'debug' : level](formattedMessage, style, resetStyle, context);
    } else {
      console[level === 'debug' ? 'debug' : level](formattedMessage, style, resetStyle);
    }
  }

  /**
   * Get emoji for log level
   */
  getEmoji(level) {
    const emojis = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    };
    return emojis[level] || '📝';
  }

  /**
   * Debug level logging
   */
  debug(message, context = null) {
    if (!this.shouldLog('debug')) return;
    
    this.addLogEntry('debug', message, context);
    this.outputToConsole('debug', message, context);
  }

  /**
   * Info level logging
   */
  info(message, context = null) {
    if (!this.shouldLog('info')) return;
    
    this.addLogEntry('info', message, context);
    this.outputToConsole('info', message, context);
  }

  /**
   * Warning level logging
   */
  warn(message, context = null) {
    if (!this.shouldLog('warn')) return;
    
    this.addLogEntry('warn', message, context);
    this.outputToConsole('warn', message, context);
  }

  /**
   * Error level logging
   */
  error(message, context = null) {
    if (!this.shouldLog('error')) return;
    
    this.addLogEntry('error', message, context);
    this.outputToConsole('error', message, context);
  }

  /**
   * Log module events
   */
  moduleEvent(moduleId, event, details = null) {
    this.info(`Module ${moduleId}: ${event}`, details);
  }

  /**
   * Log performance timing
   */
  time(label) {
    console.time(`${this.prefix} ${label}`);
  }

  timeEnd(label) {
    console.timeEnd(`${this.prefix} ${label}`);
  }

  /**
   * Group related log messages
   */
  group(label) {
    console.group(`${this.prefix} ${label}`);
  }

  groupEnd() {
    console.groupEnd();
  }

  /**
   * Get logs filtered by criteria
   */
  getLogs(options = {}) {
    let filtered = [...this.logs];
    
    if (options.level) {
      filtered = filtered.filter(log => log.level === options.level);
    }
    
    if (options.since) {
      filtered = filtered.filter(log => log.timestamp >= options.since);
    }
    
    if (options.search) {
      const search = options.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(search) ||
        JSON.stringify(log.context).toLowerCase().includes(search)
      );
    }
    
    if (options.limit) {
      filtered = filtered.slice(-options.limit);
    }
    
    return filtered;
  }

  /**
   * Export logs for debugging
   */
  export(options = {}) {
    const logs = this.getLogs(options);
    const exportData = {
      timestamp: new Date().toISOString(),
      level: this.level,
      totalLogs: this.logs.length,
      exportedLogs: logs.length,
      logs: logs.map(log => ({
        timestamp: new Date(log.timestamp).toISOString(),
        level: log.level,
        message: log.message,
        context: log.context
      }))
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Clear all logs
   */
  async clear() {
    this.logs = [];
    
    if (this.storage) {
      try {
        await this.storage.remove('logs');
      } catch (error) {
        this.warn('Failed to clear stored logs:', error);
      }
    }
    
    this.info('Logs cleared');
  }

  /**
   * Get logger statistics
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {},
      oldestLog: null,
      newestLog: null
    };
    
    // Count by level
    Object.keys(this.levels).forEach(level => {
      stats.byLevel[level] = this.logs.filter(log => log.level === level).length;
    });
    
    // Get oldest and newest
    if (this.logs.length > 0) {
      stats.oldestLog = new Date(this.logs[0].timestamp).toISOString();
      stats.newestLog = new Date(this.logs[this.logs.length - 1].timestamp).toISOString();
    }
    
    return stats;
  }
}

// Create global logger instance
const logger = new Logger();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.Logger = Logger;
  window.logger = logger;
}

// Also support module exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Logger, logger };
}

console.log('📝 Logger system loaded');
