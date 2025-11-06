/**
 * Battle Pass Auto-Scroll Module
 * Automatically scrolls to current battle pass progress
 */

let moduleConfig = {};
let scrollTimeout = null;
let isScrolling = false;

/**
 * Module initialization
 */
export async function init(config = {}) {
  try {
    moduleConfig = config;
    console.log('🎯 Battle Pass Auto-Scroll module initializing...', config);
    
    // Check if we're on the battle pass page
    if (!isBattlePassPage()) {
      console.log('⏭️ Not on battle pass page, skipping initialization');
      return;
    }
    
    // Wait for page to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initializeScrolling());
    } else {
      initializeScrolling();
    }
    
    console.log('✅ Battle Pass Auto-Scroll module initialized');
  } catch (error) {
    console.error('❌ Battle Pass module initialization failed:', error);
    throw error;
  }
}

/**
 * Module cleanup
 */
export function cleanup() {
  try {
    console.log('🧹 Battle Pass Auto-Scroll cleaning up...');
    
    // Clear any pending timeouts
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
      scrollTimeout = null;
    }
    
    // Reset state
    isScrolling = false;
    
    console.log('✅ Battle Pass Auto-Scroll cleanup complete');
  } catch (error) {
    console.error('❌ Battle Pass cleanup failed:', error);
  }
}

/**
 * Handle settings changes
 */
export function onSettingsChange(newSettings) {
  try {
    console.log('⚙️ Battle Pass settings changed:', newSettings);
    
    const oldConfig = { ...moduleConfig };
    moduleConfig = { ...moduleConfig, ...newSettings };
    
    // If auto-scroll was disabled, stop any current scrolling
    if (oldConfig.autoScroll && !newSettings.autoScroll) {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
        scrollTimeout = null;
      }
    }
    
    // If auto-scroll was enabled and we're on the page, start scrolling
    if (!oldConfig.autoScroll && newSettings.autoScroll && isBattlePassPage()) {
      initializeScrolling();
    }
    
  } catch (error) {
    console.error('❌ Battle Pass settings change failed:', error);
  }
}

/**
 * Check if we're on the battle pass page
 */
function isBattlePassPage() {
  const path = window.location.pathname;
  return path.includes('battle_pass.php') || path.includes('battle_pass');
}

/**
 * Initialize scrolling functionality
 */
function initializeScrolling() {
  try {
    // Check if auto-scroll is enabled
    if (!moduleConfig.autoScroll) {
      console.log('⏭️ Auto-scroll disabled, skipping');
      return;
    }
    
    console.log('🎯 Initializing battle pass scrolling...');
    
    // Wait for the configured delay
    const delay = moduleConfig.scrollDelay || 2000;
    
    scrollTimeout = setTimeout(() => {
      performScroll();
    }, delay);
    
  } catch (error) {
    console.error('❌ Failed to initialize scrolling:', error);
  }
}

/**
 * Perform the actual scroll operation
 */
function performScroll() {
  try {
    if (isScrolling) return;
    
    isScrolling = true;
    console.log('📜 Performing battle pass scroll...');
    
    const scrollTarget = moduleConfig.scrollTarget || 'current';
    let targetElement = null;
    
    // Find the target element based on configuration
    switch (scrollTarget) {
      case 'current':
        targetElement = findCurrentProgress();
        break;
      case 'next':
        targetElement = findNextUnlockable();
        break;
      case 'start':
        targetElement = findStartElement();
        break;
      default:
        targetElement = findCurrentProgress();
    }
    
    if (targetElement) {
      scrollToElement(targetElement);
    } else {
      console.warn('⚠️ No scroll target found');
      // Fallback to start of battle pass content
      const fallbackElement = findBattlePassContainer();
      if (fallbackElement) {
        scrollToElement(fallbackElement);
      }
    }
    
  } catch (error) {
    console.error('❌ Scroll operation failed:', error);
  } finally {
    isScrolling = false;
  }
}

/**
 * Find current progress element
 */
function findCurrentProgress() {
  // Look for various patterns that indicate current progress
  const selectors = [
    '.battle-pass-current',
    '.bp-current',
    '.current-tier',
    '.progress-current',
    '[data-current="true"]',
    '.tier.current',
    '.highlighted',
    '.active-tier'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`🎯 Found current progress: ${selector}`);
      return element;
    }
  }
  
  // Fallback: look for progress bars or indicators
  const progressBars = document.querySelectorAll('.progress, .progress-bar, .tier-progress');
  for (const bar of progressBars) {
    if (bar.style.width && parseFloat(bar.style.width) > 0) {
      console.log('🎯 Found progress via progress bar');
      return bar.closest('.tier, .battle-pass-item') || bar;
    }
  }
  
  return null;
}

/**
 * Find next unlockable element
 */
function findNextUnlockable() {
  const selectors = [
    '.battle-pass-next',
    '.bp-next',
    '.next-tier',
    '.tier.locked:first-of-type',
    '.unlockable-next'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`🎯 Found next unlockable: ${selector}`);
      return element;
    }
  }
  
  // Fallback: find first locked tier after current
  const current = findCurrentProgress();
  if (current) {
    const nextSibling = current.nextElementSibling;
    if (nextSibling) {
      console.log('🎯 Found next unlockable via sibling');
      return nextSibling;
    }
  }
  
  return null;
}

/**
 * Find start element (beginning of battle pass)
 */
function findStartElement() {
  const selectors = [
    '.battle-pass-start',
    '.bp-tier-1',
    '.tier:first-child',
    '.battle-pass-item:first-child',
    '.tier-0'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`🎯 Found start element: ${selector}`);
      return element;
    }
  }
  
  return findBattlePassContainer();
}

/**
 * Find battle pass container
 */
function findBattlePassContainer() {
  const selectors = [
    '.battle-pass',
    '.bp-container',
    '.battlepass',
    '.tier-container',
    '.pass-tiers'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`🎯 Found battle pass container: ${selector}`);
      return element;
    }
  }
  
  return null;
}

/**
 * Scroll to element with smooth animation
 */
function scrollToElement(element) {
  try {
    const showAnimation = moduleConfig.showAnimation !== false;
    
    console.log(`📜 Scrolling to element with animation: ${showAnimation}`);
    
    // Calculate scroll position
    const rect = element.getBoundingClientRect();
    const offsetTop = window.pageYOffset + rect.top;
    const offset = window.innerHeight * 0.3; // 30% from top
    const scrollTop = Math.max(0, offsetTop - offset);
    
    if (showAnimation) {
      // Smooth scroll
      window.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
      
      // Add visual highlight
      highlightElement(element);
    } else {
      // Instant scroll
      window.scrollTo(0, scrollTop);
    }
    
    console.log('✅ Scroll completed');
    
    // Emit event for other modules
    if (window.GameEnhancement?.events?.emit) {
      window.GameEnhancement.events.emit('battlePassScrolled', {
        target: element,
        scrollTop,
        animated: showAnimation
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to scroll to element:', error);
  }
}

/**
 * Highlight target element briefly
 */
function highlightElement(element) {
  try {
    const originalStyle = element.style.cssText;
    
    // Add highlight
    element.style.cssText += `
      box-shadow: 0 0 10px rgba(99, 102, 241, 0.6) !important;
      transform: scale(1.02) !important;
      transition: all 0.3s ease !important;
    `;
    
    // Remove highlight after delay
    setTimeout(() => {
      element.style.cssText = originalStyle;
    }, 1500);
    
  } catch (error) {
    console.warn('⚠️ Failed to highlight element:', error);
  }
}

/**
 * Handle install event
 */
export function handleInstall() {
  console.log('📦 Battle Pass module installed');
  
  // Show welcome notification
  if (window.GameEnhancement?.ui?.showNotification) {
    window.GameEnhancement.ui.showNotification(
      'Battle Pass Auto-Scroll installed! Visit the battle pass page to see it in action.',
      'success'
    );
  }
}

/**
 * Handle update event
 */
export function handleUpdate(oldVersion, newVersion) {
  console.log(`🔄 Battle Pass module updated: ${oldVersion} → ${newVersion}`);
  
  // Show update notification with changelog
  if (window.GameEnhancement?.ui?.showNotification) {
    const message = `Battle Pass Auto-Scroll updated to ${newVersion}! Check settings for new features.`;
    window.GameEnhancement.ui.showNotification(message, 'info');
  }
}

/**
 * Get module info for debugging
 */
export function getModuleInfo() {
  return {
    name: 'Battle Pass Auto-Scroll',
    version: '1.2.0',
    status: isScrolling ? 'scrolling' : 'ready',
    config: moduleConfig,
    page: isBattlePassPage() ? 'battle_pass' : 'other'
  };
}

console.log('🎯 Battle Pass Auto-Scroll module loaded');
