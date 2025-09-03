/**
 * Visual Search Utilities Module
 * Contains all utility functions, helpers, and common functionality
 */
(function() {
  'use strict';

  // ====================================================================
  // DEVICE & ENVIRONMENT UTILITIES
  // ====================================================================

  function isMobileDevice() {
    return window.innerWidth <= 768;
  }

  // ====================================================================
  // FUNCTION UTILITIES
  // ====================================================================

  function debounce(func, wait) {
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

  // ====================================================================
  // NOTIFICATION SYSTEM
  // ====================================================================

  // Notification styles (from STYLES object)
  const NOTIFICATION_STYLES = {
    info: `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2c3e50;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `,
    success: `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #27ae60;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `,
    error: `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #e74c3c;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `
  };

  function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.visual-search-notification');
    existing.forEach(el => el.remove());
    
    const toast = document.createElement('div');
    toast.className = 'visual-search-notification';
    toast.style.cssText = NOTIFICATION_STYLES[type] || NOTIFICATION_STYLES.info;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  function showError(message) {
    showNotification(message, 'error');
  }

  function showSuccess(message) {
    showNotification(message, 'success');
  }

  // ====================================================================
  // THEME CONFIGURATION UTILITIES
  // ====================================================================

  function getThemeConfigFromAppBlocks() {
    console.log('[Visual Search Utils] 🎨 Reading theme configuration from app blocks...');
    
    // Get CONFIG from global scope or fallback
    const CONFIG = window.VisualSearchConfig?.CONFIG || {
      APP_BLOCK_SELECTORS: {
        ALL: [
          '[data-visual-search-block="header-block"]',
          '[data-visual-search-block="floating-block"]',
          '.vs-enhanced-search-container[data-visual-search-block="input-embed"]'
        ]
      }
    };
    
    const appBlockSelectors = CONFIG.APP_BLOCK_SELECTORS.ALL;
    const themeConfig = {};
    let configSource = 'app-block';
    
    // Read from app block styles directly
    for (const selector of appBlockSelectors) {
      const appBlock = document.querySelector(selector);
      if (appBlock) {
        console.log('[Visual Search Utils] 📦 Found app block:', appBlock);
        
        // Try to read computed styles from the app block
        const computedStyle = window.getComputedStyle(appBlock);
        const color = computedStyle.color;
        
        if (color && color !== 'rgb(0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)') {
          themeConfig.iconColor = color;
        }
        
        // Try to read CSS custom properties (CSS variables)
        const iconColorProperty = computedStyle.getPropertyValue('--vs-icon-color').trim();
        const hoverColorProperty = computedStyle.getPropertyValue('--vs-hover-color').trim();
        const primaryColorProperty = computedStyle.getPropertyValue('--vs-primary-color').trim();
        
        if (iconColorProperty) {
          themeConfig.iconColor = iconColorProperty;
          console.log('[Visual Search Utils] 🎯 Found CSS variable --vs-icon-color:', iconColorProperty);
        }
        
        if (hoverColorProperty) {
          themeConfig.iconColorHover = hoverColorProperty;
          console.log('[Visual Search Utils] 🎯 Found CSS variable --vs-hover-color:', hoverColorProperty);
        }
        
        if (primaryColorProperty) {
          themeConfig.primaryColor = primaryColorProperty;
          console.log('[Visual Search Utils] 🎯 Found CSS variable --vs-primary-color:', primaryColorProperty);
        }
        
        // If we found some configuration, no need to check other blocks
        if (Object.keys(themeConfig).length > 0) {
          console.log('[Visual Search Utils] ✅ Theme config found from app block');
          break;
        }
      }
    }
    
    console.log('[Visual Search Utils] 🎨 Final theme config:', themeConfig, 'from:', configSource);
    return { config: themeConfig, source: configSource };
  }

  function updateThemeConfig(newConfig, source = 'unknown') {
    console.log('[Visual Search Utils] 🔄 Updating theme config from', source, ':', newConfig);
    
    // Get current CONFIG or create fallback
    const CONFIG = window.VisualSearchConfig?.CONFIG || {};
    
    // Update CONFIG.THEME with new values
    if (CONFIG.THEME) {
      Object.assign(CONFIG.THEME, newConfig);
      console.log('[Visual Search Utils] ✅ Theme config updated:', CONFIG.THEME);
    }
    
    // Update global config if available
    if (window.VisualSearchConfig) {
      window.VisualSearchConfig.CONFIG = CONFIG;
    }
    
    return CONFIG.THEME;
  }

  function addGlobalStyles() {
    console.log('[Visual Search Utils] 🎨 Adding global styles...');
    
    // Check if styles already added
    if (document.querySelector('#visual-search-global-styles')) {
      console.log('[Visual Search Utils] ⚠️ Global styles already added, skipping...');
      return;
    }
    
    // Create style element
    const style = document.createElement('style');
    style.id = 'visual-search-global-styles';
    
    // Add spinner keyframes and basic styles
    style.textContent = `
      @keyframes visual-search-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .vs-loading {
        animation: visual-search-spin 1s linear infinite !important;
      }
      
      * {
        -webkit-tap-highlight-color: transparent;
      }
    `;
    
    document.head.appendChild(style);
    console.log('[Visual Search Utils] ✅ Global styles added');
  }

  // ====================================================================
  // INPUT UTILITIES
  // ====================================================================

  // Helper function to create a fallback search input
  function createFallbackSearchInput() {
    console.log('[Visual Search Utils] 🔧 Creating fallback search input...');
    return {
      value: '',
      type: 'search',
      name: 'q',
      placeholder: 'Search products...',
      addEventListener: function() {}, // Mock function
      dispatchEvent: function() {}, // Mock function
      focus: function() {} // Mock function
    };
  }

  // ====================================================================
  // FILE & IMAGE UTILITIES
  // ====================================================================

  function validateImageFile(file) {
    const CONFIG = window.VisualSearchConfig?.CONFIG || {
      MAX_FILE_SIZE: 5 * 1024 * 1024,
      ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    };
    
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }
    
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      return { valid: false, error: 'File too large. Maximum size is 5MB.' };
    }
    
    if (!CONFIG.ACCEPTED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Please use JPEG, PNG, WebP, or GIF.' };
    }
    
    return { valid: true };
  }

  function createImageURL(file) {
    try {
      return URL.createObjectURL(file);
    } catch (error) {
      console.error('[Visual Search Utils] Error creating image URL:', error);
      return null;
    }
  }

  // ====================================================================
  // DOM UTILITIES
  // ====================================================================

  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver(() => {
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

  function removeElement(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  }

  // ====================================================================
  // PERFORMANCE UTILITIES
  // ====================================================================

  function measurePerformance(name, fn) {
    return async (...args) => {
      const start = performance.now();
      const result = await fn(...args);
      const end = performance.now();
      console.log(`[Visual Search Utils] ⏱️ ${name}: ${Math.round((end - start) * 100) / 100}ms`);
      return result;
    };
  }

  // ====================================================================
  // GLOBAL EXPORTS
  // ====================================================================

  // Expose utilities globally for other modules
  window.VisualSearchUtils = {
    // Device utilities
    isMobileDevice,
    
    // Function utilities
    debounce,
    
    // Notification system
    showNotification,
    showError,
    showSuccess,
    
    // Theme utilities
    getThemeConfigFromAppBlocks,
    updateThemeConfig,
    addGlobalStyles,
    
    // Input utilities
    createFallbackSearchInput,
    
    // File utilities
    validateImageFile,
    createImageURL,
    
    // DOM utilities
    waitForElement,
    removeElement,
    
    // Performance utilities
    measurePerformance
  };

  console.log('[Visual Search Utils] ✅ Utilities module loaded');

})();