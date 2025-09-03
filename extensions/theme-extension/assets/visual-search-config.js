/**
 * Visual Search Configuration Module
 * Contains all configuration, constants, and settings
 */
(function() {
  'use strict';

  // ====================================================================
  // CONFIGURATION 
  // ====================================================================

  // Global API URL - Change only here to update everywhere
  const GLOBAL_API_BASE_URL = 'https://treaty-herein-theories-thinking.trycloudflare.com';

  const CONFIG = {
    // App configuration - Dynamic values from Liquid template
    APP_URL: window.VISUAL_SEARCH_CONFIG?.appUrl || 'https://cash-customise-longitude-scope.trycloudflare.com',
    EXTERNAL_API_URL: `${GLOBAL_API_BASE_URL}/api/product-handle`,
    SHOP_DOMAIN: window.VISUAL_SEARCH_CONFIG?.shopDomain || 'pixel-dress-store.myshopify.com',
    
    // Analytics configuration - DISABLED
    ANALYTICS_ENABLED: false,
    
    // App Block Selectors - CENTRALIZED CONFIGURATION
    // ⚠️ IMPORTANT: All app block selectors are defined here for easy maintenance
    // When adding/changing app block selectors, update ONLY this section
    APP_BLOCK_SELECTORS: {
      // Primary selectors (mutually exclusive - no duplicates)
      HEADER_BLOCK: '[data-visual-search-block="header-block"]',
      FLOATING_BLOCK: '[data-visual-search-block="floating-block"]', 
      INPUT_EMBED_CONTAINER: '.vs-enhanced-search-container[data-visual-search-block="input-embed"]',
      INPUT_EMBED_ANY: '[data-visual-search-block="input-embed"]',
      
      // Get all selectors as array for iteration
      ALL: [
        '[data-visual-search-block="header-block"]',     // Header block element
        '[data-visual-search-block="floating-block"]',   // Floating FAB element  
        '.vs-enhanced-search-container[data-visual-search-block="input-embed"]'  // Input embed container only (not individual icons)
      ],
      
      // Individual data attributes for matching
      ATTRIBUTES: {
        HEADER: 'data-visual-search-block="header-block"',
        FLOATING: 'data-visual-search-block="floating-block"',
        INPUT_EMBED: 'data-visual-search-block="input-embed"'
      },
      
      // Mapping selectors to block type names for analytics
      TYPE_MAPPING: {
        '[data-visual-search-block="header-block"]': 'header',
        '[data-visual-search-block="floating-block"]': 'floating',
        '.vs-enhanced-search-container[data-visual-search-block="input-embed"]': 'input-embed'
      }
    },
    
    // Theme customization - Static theme values
    THEME: {
      // Icon colors - Static theme colors
      ICON_COLOR: '#5f6368',
      ICON_COLOR_HOVER: '#202124',
      ICON_BACKGROUND_HOVER: 'rgba(95, 99, 104, 0.08)',
      
      // Brand colors - Static brand colors
      PRIMARY_COLOR: '#008060',
      PRIMARY_COLOR_DARK: '#004C3F',
      
      // Icon settings
      ICON_SIZE_MULTIPLIER: 1.0,
      ICON_OFFSET: 8
    },
    
    // UI Settings - Static fallback values
    PINTEREST_RED: '#008060',
    PINTEREST_RED_DARK: '#004C3F',
    
    ICON_SIZE_DEFAULT: 24,
    ICON_SIZE_MIN: 20,
    ICON_SIZE_MAX: 28,
    
    // Animation settings - Static values
    ANIMATION_DURATION: 400,
    ANIMATION_EASING: 'cubic-bezier(0.16, 1, 0.3, 1)',
    
    // File upload settings - Static limits
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  };

  console.log('[Visual Search Config] Configuration loaded: PankajTest', {
    appUrl: CONFIG.APP_URL,
    shopDomain: CONFIG.SHOP_DOMAIN,
    primaryColor: CONFIG.THEME.PRIMARY_COLOR,
    iconStyle: CONFIG.THEME.ICON_STYLE
  });

  // ====================================================================
  // IMAGE STATE MANAGEMENT
  // ====================================================================

  // Centralized image dimensions storage for uploaded-image element
  const imageState = {
    naturalWidth: 0,
    naturalHeight: 0,
    displayedWidth: 0,
    displayedHeight: 0,
    element: null, // Reference to the uploaded-image element
    scaleX: 1,
    scaleY: 1
  };

  // Function to update image state when image loads
  function updateImageState(imageElement) {
    if (!imageElement) return;
    
    imageState.element = imageElement;
    imageState.naturalWidth = imageElement.naturalWidth;
    imageState.naturalHeight = imageElement.naturalHeight;
    
    const rect = imageElement.getBoundingClientRect();
    imageState.displayedWidth = rect.width;
    imageState.displayedHeight = rect.height;
    
    imageState.scaleX = imageState.displayedWidth / imageState.naturalWidth;
    imageState.scaleY = imageState.displayedHeight / imageState.naturalHeight;
    
    console.log('[Visual Search Config] 📐 Image state updated:', imageState);
  }

  // ====================================================================
  // GLOBAL EXPORTS
  // ====================================================================

  // Expose configuration globally for other modules
  window.VisualSearchConfig = {
    CONFIG,
    imageState,
    updateImageState,
    GLOBAL_API_BASE_URL
  };

  console.log('[Visual Search Config] ✅ Configuration module loaded');

})();