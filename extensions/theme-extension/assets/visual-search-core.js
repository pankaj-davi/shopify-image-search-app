/**
 * Visual Search Core Module - Smart Orchestrator
 * Lightweight entry point that loads other modules on-demand
 */
(function() {
  'use strict';
  
  // Performance tracking
  const startTime = performance.now();
  
  console.log('[Visual Search Core] ⚡ Smart core module loading at', new Date().toLocaleString());
  
  // Environment check
  if (typeof window === 'undefined') {
    console.log('[Visual Search Core] Not in browser environment, exiting');
    return;
  }
  
  // ====================================================================
  // MODULE LOADING SYSTEM
  // ====================================================================
  
  const moduleCache = {
    config: null,
    utils: null,
    api: null,
    ui: null,
    styles: null
  };
  
  const loadingPromises = {};
  const loadedAssets = new Set();
  
  async function loadScript(src) {
    if (loadedAssets.has(src)) {
      console.log('[Visual Search Core] ✅ Script already loaded:', src);
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        loadedAssets.add(src);
        console.log('[Visual Search Core] ✅ Script loaded:', src);
        resolve();
      };
      script.onerror = (error) => {
        console.error('[Visual Search Core] ❌ Failed to load script:', src, error);
        reject(new Error(`Failed to load ${src}`));
      };
      document.head.appendChild(script);
    });
  }
  
  async function loadStylesheet(href) {
    if (loadedAssets.has(href)) {
      console.log('[Visual Search Core] ✅ Stylesheet already loaded:', href);
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => {
        loadedAssets.add(href);
        console.log('[Visual Search Core] ✅ Stylesheet loaded:', href);
        resolve();
      };
      link.onerror = (error) => {
        console.error('[Visual Search Core] ❌ Failed to load stylesheet:', href, error);
        reject(new Error(`Failed to load ${href}`));
      };
      document.head.appendChild(link);
    });
  }
  
  // Generate asset URLs using Shopify's asset_url filter pattern
  function getAssetUrl(filename) {
    // Try to detect Shopify CDN URL from current script
    const currentScript = document.querySelector('script[src*="visual-search-core.js"]');
    if (currentScript && currentScript.src) {
      const scriptSrc = currentScript.src;
      console.log('[Visual Search Core] 🔗 Detected script URL:', scriptSrc);
      
      // Extract the base URL by removing the filename and optional version parameter
      const baseUrl = scriptSrc.replace(/visual-search-core\.js(\?.*)?$/, '');
      const fullUrl = baseUrl + filename;
      
      console.log('[Visual Search Core] 🎯 Generated asset URL:', fullUrl);
      return fullUrl;
    }
    
    // Fallback: construct from window location
    console.warn('[Visual Search Core] Could not detect script URL, using fallback');
    const fallbackUrl = `${window.location.origin}/assets/${filename}`;
    console.log('[Visual Search Core] 🔄 Fallback asset URL:', fallbackUrl);
    return fallbackUrl;
  }
  
  async function loadModule(moduleName) {
    const moduleStartTime = performance.now();
    console.log(`[Visual Search Core] 📦 Loading module: ${moduleName}`);
    
    // Return cached module if already loaded
    if (moduleCache[moduleName]) {
      console.log(`[Visual Search Core] ✅ Module ${moduleName} already cached`);
      return moduleCache[moduleName];
    }
    
    // Return existing loading promise if in progress
    if (loadingPromises[moduleName]) {
      console.log(`[Visual Search Core] ⏳ Module ${moduleName} loading in progress`);
      return loadingPromises[moduleName];
    }
    
    // Create loading promise
    loadingPromises[moduleName] = (async () => {
      try {
        // Load module files
        switch (moduleName) {
          case 'config':
            await loadScript(getAssetUrl('visual-search-config.js'));
            moduleCache[moduleName] = window.VisualSearchConfig;
            break;
            
          case 'utils':
            await loadModule('config'); // Utils depends on config
            await loadScript(getAssetUrl('visual-search-utils.js'));
            moduleCache[moduleName] = window.VisualSearchUtils;
            break;
            
          case 'styles':
            await loadStylesheet(getAssetUrl('visual-search-styles.css'));
            moduleCache[moduleName] = { loaded: true };
            break;
            
          case 'api':
            await loadModule('config'); // API depends on config
            await loadModule('utils');  // API depends on utils
            await loadScript(getAssetUrl('visual-search-api.js'));
            moduleCache[moduleName] = window.VisualSearchAPI;
            break;
            
          case 'ui':
            await loadModule('config'); // UI depends on config
            await loadModule('utils');  // UI depends on utils
            await loadModule('styles'); // UI depends on styles
            await loadScript(getAssetUrl('visual-search-ui.js'));
            moduleCache[moduleName] = window.VisualSearchUI;
            break;
            
          default:
            throw new Error(`Unknown module: ${moduleName}`);
        }
        
        const loadTime = performance.now() - moduleStartTime;
        console.log(`[Visual Search Core] ✅ Module ${moduleName} loaded in ${Math.round(loadTime * 100) / 100}ms`);
        
        // Clean up loading promise
        delete loadingPromises[moduleName];
        
        return moduleCache[moduleName];
        
      } catch (error) {
        console.error(`[Visual Search Core] ❌ Failed to load module ${moduleName}:`, error);
        delete loadingPromises[moduleName];
        throw error;
      }
    })();
    
    return loadingPromises[moduleName];
  }
  
  // ====================================================================
  // APP BLOCK DETECTION & INITIALIZATION
  // ====================================================================
  
  // Minimal app block selectors for initial detection
  const APP_BLOCK_SELECTORS = [
    '[data-visual-search-block="header-block"]',
    '[data-visual-search-block="floating-block"]', 
    '.vs-enhanced-search-container[data-visual-search-block="input-embed"]'
  ];
  
  function detectAppBlocks() {
    console.log('[Visual Search Core] 🔍 Detecting app blocks...');
    
    const foundBlocks = [];
    APP_BLOCK_SELECTORS.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log('[Visual Search Core] 📦 Found app block:', selector, elements.length);
        foundBlocks.push({ selector, elements });
      }
    });
    
    return foundBlocks;
  }
  
  function createFallbackSearchInput() {
    console.log('[Visual Search Core] 🔧 Creating fallback search input...');
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
  // GLOBAL API - LIGHTWEIGHT INTERFACE
  // ====================================================================
  
  async function openDrawer(searchInput) {
    console.log('[Visual Search Core] 🚀 Opening drawer with smart loading...');
    
    try {
      // Load required modules on-demand
      console.log('[Visual Search Core] 📦 Loading UI dependencies...');
      
      const [, utilsModule, uiModule] = await Promise.all([
        loadModule('config'),
        loadModule('utils'), 
        loadModule('ui')
      ]);
      
      console.log('[Visual Search Core] ✅ All UI dependencies loaded');
      
      // If no searchInput provided, create a fallback
      if (!searchInput) {
        searchInput = utilsModule?.createFallbackSearchInput?.() || createFallbackSearchInput();
        console.log('[Visual Search Core] 🔧 Using fallback searchInput');
      }
      
      // Open drawer using UI module
      return await uiModule.openVisualSearchDrawer(searchInput);
      
    } catch (error) {
      console.error('[Visual Search Core] ❌ Failed to open drawer:', error);
      
      // Advanced fallback: Try to load the original monolithic file
      console.log('[Visual Search Core] 🔄 Attempting fallback to monolithic file...');
      
      try {
        await loadScript(getAssetUrl('visual-search-unified-backup-without-search-selector.js'));
        
        // Wait a bit for the script to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try to use the monolithic version
        if (window.visualSearchUnified && window.visualSearchUnified.openDrawer) {
          console.log('[Visual Search Core] ✅ Fallback successful, using monolithic version');
          return await window.visualSearchUnified.openDrawer(searchInput);
        }
      } catch (fallbackError) {
        console.error('[Visual Search Core] ❌ Fallback also failed:', fallbackError);
      }
      
      // Final fallback: Show error message
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      toast.textContent = 'Visual search is temporarily unavailable. Please try again later.';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 5000);
      
      return null;
    }
  }
  
  // ====================================================================
  // INITIALIZATION & CLEANUP
  // ====================================================================
  
  function performGlobalCleanup() {
    console.log('[Visual Search Core] 🧹 Performing global cleanup...');
    
    // Remove any existing drawers
    const existingDrawers = document.querySelectorAll('.visual-search-drawer');
    existingDrawers.forEach(drawer => drawer.remove());
    
    // Remove notifications
    const notifications = document.querySelectorAll('.visual-search-notification');
    notifications.forEach(notification => notification.remove());
    
    // Clear global state
    if (window.visualSearchCurrentInput) {
      delete window.visualSearchCurrentInput;
    }
    if (window.visualSearchCurrentSearchInput) {
      delete window.visualSearchCurrentSearchInput;
    }
    
    console.log('[Visual Search Core] ✅ Global cleanup complete');
  }
  
  function initialize() {
    console.log('[Visual Search Core] 🚀 Initializing core module...');
    
    // Detect app blocks
    const appBlocks = detectAppBlocks();
    
    if (appBlocks.length === 0) {
      console.log('[Visual Search Core] ⚠️ No app blocks detected - visual search not available');
      return;
    }
    
    console.log('[Visual Search Core] 📦 Found', appBlocks.length, 'app block types');
    
    // Pre-load config module for theme detection
    loadModule('config').catch(error => {
      console.warn('[Visual Search Core] ⚠️ Failed to pre-load config:', error);
    });
    
    // Clean up any existing instances
    if (window.visualSearchUnified) {
      console.log('[Visual Search Core] 🔧 Cleaning up existing instance');
      performGlobalCleanup();
    }
    
    // Expose global API
    window.visualSearchUnified = {
      openDrawer: openDrawer,
      config: () => moduleCache.config?.CONFIG || {},
      createFallbackSearchInput: createFallbackSearchInput,
      checkAppBlocks: () => {
        return APP_BLOCK_SELECTORS.some(selector => 
          document.querySelectorAll(selector).length > 0
        );
      },
      forceCleanup: performGlobalCleanup,
      getModuleStatus: () => ({
        loaded: Object.keys(moduleCache).filter(key => moduleCache[key]),
        loading: Object.keys(loadingPromises),
        available: ['config', 'utils', 'styles', 'api', 'ui']
      }),
      loadModule: loadModule // Expose for debugging
    };
    
    // Performance metrics
    const initTime = performance.now() - startTime;
    console.log('[Visual Search Core] ⚡ Core initialization complete in', Math.round(initTime * 100) / 100, 'ms');
    console.log('[Visual Search Core] 📦 Available modules: config, utils, styles, api, ui');
    console.log('[Visual Search Core] 🚀 Ready for on-demand loading');
    
    // Monitor theme changes
    const observer = new MutationObserver(() => {
      // Re-check app blocks if DOM changes significantly
      const stillHasBlocks = APP_BLOCK_SELECTORS.some(selector => 
        document.querySelectorAll(selector).length > 0
      );
      if (!stillHasBlocks) {
        console.log('[Visual Search Core] 🔍 App blocks removed - may have been theme change');
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      observer.disconnect();
      performGlobalCleanup();
    });
  }
  
  // ====================================================================
  // STARTUP
  // ====================================================================
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // DOM already loaded
    setTimeout(initialize, 0);
  }
  
})();