(function() {
  'use strict';
  
 
  
  // Debug logging
  console.log('[Visual Search] Unified script loaded at', new Date().toLocaleString());
  
  // Environment check
  if (typeof window === 'undefined') {
    console.log('[Visual Search] Not in browser environment, exiting');
    return;
  }
  
  console.log('[Visual Search] Browser environment detected, initializing...');
  
  // ====================================================================
  // CONFIGURATION 
  // ====================================================================
  
  const CONFIG = {
    // App configuration - Dynamic values from Liquid template
    APP_URL: window.VISUAL_SEARCH_CONFIG?.appUrl || 'https://vocal-palmier-18497f.netlify.app',
    EXTERNAL_API_URL: 'https://vocal-palmier-18497f.netlify.app/api/product-handle',
    // Always use actual hostname from the browser
    SHOP_DOMAIN: window.location.hostname,
    
    // Analytics configuration - ENABLED
    ANALYTICS_ENABLED: true,
    
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
    ACCEPTED_TYPES: [
      'image/jpeg',
      'image/jpg',        // JPEG variant
      'image/pjpeg',      // Progressive JPEG
      'image/png',
      'image/webp',
      'image/gif',
      'image/heic',       // iPhone format
      'image/heif',       // iPhone format variant
      'image/avif',       // Next-gen format
      'image/bmp',        // Bitmap
      'image/tiff',       // High-quality
      'image/svg+xml'     // Vector graphics
    ]
  };
  
  console.log('[Visual Search] Static Configuration loaded: PankajTest', {
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
    
    console.log('[Visual Search] 📐 Image state updated:', imageState);
  }
  
  // ====================================================================
  // STYLES
  // ====================================================================
  
  const STYLES = {
    // Spinner animation keyframes
    spinnerKeyframes: `
      @keyframes visual-search-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes visual-search-skeleton-pulse {
        0% { opacity: 1; }
        50% { opacity: 0.4; }
        100% { opacity: 1; }
      }
    `,
    
    // Enhanced responsive media queries for optimal mobile experience
    responsiveStyles: `
      /* Base mobile styles - optimized for touch */
      .visual-search-modal-content {
        flex-direction: column !important;
        touch-action: manipulation;
        -webkit-overflow-scrolling: touch;
      }
      
      /* Mobile Simple Layout Styles */
      @media (max-width: 768px) {
        /* Default mobile: Full screen layout */
        .visual-search-modal-content {
          flex-direction: column !important;
        }
        
        .visual-search-left-panel {
          flex: none !important;
          border-bottom: 1px solid #e9e9e9 !important;
          border-right: none !important;
          max-height: 100vh !important;
          min-height: auto !important;
          padding: 16px !important;
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch;
        }
        
        .visual-search-right-panel {
          flex: 1 !important;
          min-height: 120px !important;
          max-height: 160px !important;
          overflow-y: auto !important;
          margin-bottom: 0 !important;
        }
        
        /* Ensure results container fills available space */
        .visual-search-results-container {
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
        }
        
        .visual-search-results-grid {
          flex: 1 !important;
          align-content: start !important;
        }
        
        /* Show/hide sections based on state */
        .mobile-results-mode .visual-search-left-panel {
          max-height: 55vh !important;
          min-height: 55vh !important;
          flex: 3 !important;
          flex-shrink: 0 !important;
        }
        
        .mobile-results-mode .visual-search-right-panel {
          flex: 2 !important;
          min-height: 35vh !important;
          max-height: 35vh !important;
          height: auto !important;
        }
        
        /* Fill remaining space with results */
        .mobile-results-mode .visual-search-modal-content {
          height: 90vh !important;
          display: flex !important;
          flex-direction: column !important;
        }
        
        /* Better mobile image container sizing */
        .mobile-results-mode #image-selection-container {
          max-height: 45vh !important;
          min-height: 300px !important;
          width: 100% !important;
          box-sizing: border-box !important;
          overflow: visible !important;
          padding: 10px !important;
        }
        
        .mobile-results-mode #image-selection-container img {
          max-height: 40vh !important;
          width: auto !important;
          max-width: 100% !important;
          object-fit: contain !important;
          display: block !important;
          margin: 0 auto !important;
        }
        
        /* Expanded state - when user clicks expand */
        .mobile-results-expanded .visual-search-left-panel {
          display: none !important;
        }
        
        .mobile-results-expanded .visual-search-right-panel {
          flex: 1 !important;
          max-height: 100vh !important;
          min-height: 70vh !important;
        }
        
        /* Add expand/collapse button styles */
        .mobile-expand-button {
          position: sticky !important;
          top: 0 !important;
          z-index: 10 !important;
          background: white !important;
          border-bottom: 1px solid #e9e9e9 !important;
          padding: 12px 16px !important;
        }
      }
      
      .visual-search-left-panel {
        flex: none !important;
        border-bottom: 1px solid #e9e9e9 !important;
        border-right: none !important;
        max-height: 45vh !important;
        min-height: 280px !important;
        padding: 16px !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch;
      }
      
      .visual-search-right-panel {
        flex: 1 !important;
        min-height: 300px !important;
      }
      
      .visual-search-results-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 8px !important;
      }
      
      /* Compact mobile product cards */
      .visual-search-product-card {
        border-radius: 8px !important;
        padding: 6px !important;
      }
      
      .visual-search-product-card img {
        border-radius: 6px !important;
        height: 80px !important;
        object-fit: cover !important;
      }
      
      .visual-search-product-card .visual-search-product-title {
        font-size: 12px !important;
        line-height: 1.3 !important;
        margin: 4px 0 2px 0 !important;
        max-height: 32px !important;
        overflow: hidden !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 2 !important;
        -webkit-box-orient: vertical !important;
      }
      
      .visual-search-product-card .visual-search-product-price {
        font-size: 12px !important;
        font-weight: 600 !important;
        margin: 2px 0 0 0 !important;
      }
      
      .visual-search-results-header {
        padding: 8px 12px !important;
        position: sticky !important;
        top: 0 !important;
        background: #ffffff !important;
        z-index: 10 !important;
      }
      
      .visual-search-results-container {
        padding: 8px 12px !important;
        -webkit-overflow-scrolling: touch;
      }
      
      /* Touch-optimized button sizes */
      .visual-search-alt-button {
        padding: 14px 12px !important;
        font-size: 14px !important;
        gap: 8px !important;
        border-radius: 10px;
        min-height: 48px;
      }
      
      .visual-search-alt-button svg {
        width: 18px;
        height: 18px;
      }
      
      /* Enhanced upload area for mobile */
      .visual-search-main-upload {
        padding: 24px 16px !important;
        border-radius: 12px !important;
        margin-bottom: 16px !important;
        min-height: 180px !important;
        touch-action: manipulation;
      }
      
      .visual-search-upload-icon {
        width: 56px;
        height: 56px;
        margin-bottom: 16px;
      }
      
      .visual-search-upload-icon svg {
        width: 28px;
        height: 28px;
      }
      
      .visual-search-main-upload h3 {
        font-size: 18px;
        margin-bottom: 10px;
      }
      
      .visual-search-main-upload p {
        font-size: 15px;
        margin-bottom: 20px;
        max-width: 260px;
      }
      
      .visual-search-main-upload button {
        padding: 14px 28px;
        font-size: 15px;
      }
      
      /* Product card optimizations for mobile */
      .visual-search-product-card {
        border-radius: 12px !important;
        overflow: hidden !important;
        background: #ffffff !important;
        border: 1px solid #e9e9e9 !important;
        transition: all 0.2s ease !important;
        touch-action: manipulation !important;
      }
      
      .visual-search-product-card:active {
        transform: scale(0.98) !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
      }
      
      /* Crop tool mobile optimizations */
      #image-selection-container {
        border-radius: 12px !important;
        min-height: 200px !important;
        max-height: 320px !important;
        touch-action: none !important;
        width: 100% !important;
        box-sizing: border-box !important;
        overflow: visible !important;
        padding: 15px !important;
      }
      
      #image-selection-container img {
        min-width: 120px;
        min-height: 120px;
        object-fit: contain;
        display: block;
        margin: 0 auto;
        height:300px;
        width:250px;
      }
      
      /* Close button mobile optimization */
      #close-drawer-x {
        width: 40px;
        height: 40px;
        top: 8px;
        right: 12px;
        font-size: 18px;
        touch-action: manipulation !important;
      }
      
      /* Header mobile adjustments */
      .visual-search-drawer > div > div:first-child {
        padding: 16px 20px 12px;
      }
      
      .visual-search-drawer h2 {
        font-size: 20px;
      }
      
      .visual-search-drawer > div > div:first-child p {
        font-size: 14px;
      }
      
      /* Empty state mobile */
      .visual-search-empty-state {
        padding: 40px 20px;
      }
      
      .visual-search-empty-icon {
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
      }
      
      .visual-search-empty-icon svg {
        width: 28px;
        height: 28px;
      }
      
      .visual-search-empty-state h3 {
        font-size: 16px;
        margin-bottom: 6px;
      }
      
      .visual-search-empty-state p {
        font-size: 13px;
        max-width: 280px;
      }

      /* Tablet landscape optimizations */
      @media (min-width: 768px) and (orientation: landscape) {
        .visual-search-modal-content {
          flex-direction: row !important;
        }
        .visual-search-left-panel {
          flex: 1 !important;
          border-right: 1px solid #e9e9e9 !important;
          border-bottom: none !important;
          max-height: none !important;
          padding: 20px !important;
        }
        .visual-search-right-panel {
          flex: 2 !important;
        }
        .visual-search-results-grid {
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 14px !important;
        }
      }

      /* Desktop optimizations */
      @media (min-width: 768px) {
        .visual-search-modal-content {
          flex-direction: row !important;
        }
        .visual-search-left-panel {
          flex: 1 !important;
          border-right: 1px solid #e9e9e9 !important;
          border-bottom: none !important;
          max-height: none !important;
          padding: 24px !important;
        }
        .visual-search-right-panel {
          flex: 3 !important;
        }
        .visual-search-results-grid {
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 16px !important;
        }
        .visual-search-results-header {
          padding: 20px 24px 16px !important;
        }
        .visual-search-results-container {
          padding: 20px 24px !important;
        }
        .visual-search-upload-icon {
          width: 48px !important;
          height: 48px !important;
          margin-bottom: 20px !important;
        }
        .visual-search-upload-icon svg {
          width: 32px !important;
          height: 32px !important;
        }
        .visual-search-main-upload h3 {
          font-size: 20px !important;
          margin-bottom: 12px !important;
        }
        .visual-search-main-upload p {
          font-size: 16px !important;
          margin-bottom: 24px !important;
          max-width: 280px !important;
        }
        .visual-search-main-upload {
          padding: 20px !important;
          border-radius: 16px !important;
          margin-bottom: 20px !important;
          min-height: 200px !important;
        }
        .visual-search-alt-buttons {
          gap: 12px !important;
          margin-bottom: 24px !important;
        }
        .visual-search-alt-button {
          padding: 16px !important;
          font-size: 14px !important;
          gap: 8px !important;
          border-radius: 12px !important;
        }
        .visual-search-alt-button svg {
          width: 20px !important;
          height: 20px !important;
        }
        .visual-search-empty-state {
          padding: 60px 20px !important;
        }
        .visual-search-empty-icon {
          width: 80px !important;
          height: 80px !important;
          margin-bottom: 20px !important;
        }
        .visual-search-empty-icon svg {
          width: 32px !important;
          height: 32px !important;
        }
        .visual-search-empty-state h3 {
          font-size: 18px !important;
          margin-bottom: 8px !important;
        }
        .visual-search-empty-state p {
          font-size: 14px !important;
          max-width: 300px !important;
        }
        
        #image-selection-container {
          max-height: 400px !important;
          min-height: 250px !important;
          width: 100% !important;
          box-sizing: border-box !important;
          overflow: visible !important;
          padding: 12px !important;
          height: auto !important;
        }
        
        #image-selection-container img {
          width: 100% !important;
          min-width: 100% !important;
          min-height: 220px !important;
          max-height: 320px !important;
          object-fit: contain !important;
          display: block !important;
          margin: 0 auto !important;
        }
        
        /* Ensure action buttons area is visible and properly spaced */
        .visual-search-left-panel .visual-search-actions {
          margin-top: 12px !important;
          padding: 0 !important;
          flex-shrink: 0 !important;
        }
        
        .visual-search-left-panel .visual-search-alt-button {
          margin-bottom: 8px !important;
        }
        
        #close-drawer-x {
          width: 32px !important;
          height: 32px !important;
          top: 12px !important;
          right: 16px !important;
          font-size: 20px !important;
        }
      }
      
      @media (min-width: 1024px) {
        .visual-search-results-grid {
          grid-template-columns: repeat(4, 1fr) !important;
        }
      }
      
      @media (min-width: 1200px) {
        .visual-search-results-grid {
          grid-template-columns: repeat(5, 1fr) !important;
        }
      }
      
      /* High DPI display optimizations */
      @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
        .visual-search-product-card img {
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }
      }
      
      /* Reduced motion accessibility */
      @media (prefers-reduced-motion: reduce) {
        .visual-search-drawer,
        .visual-search-drawer * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
      
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .visual-search-drawer {
          border: 2px solid !important;
        }
        .visual-search-product-card {
          border: 2px solid !important;
        }
        .visual-search-alt-button {
          border: 2px solid !important;
        }
      }
    `,
    
    // Icon styles - Google-inspired design with right positioning
    icon: (size, offset = 8) => `
      position: absolute;
      top: 50%;
      right: ${offset}px;
      transform: translateY(-50%);
      width: ${Math.round(size * CONFIG.THEME.ICON_SIZE_MULTIPLIER)}px;
      height: ${Math.round(size * CONFIG.THEME.ICON_SIZE_MULTIPLIER)}px;
      cursor: pointer;
      z-index: 999997;
      opacity: 0.7;
      transition: all 0.15s ease;
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 3px;
      color: ${CONFIG.THEME.ICON_COLOR};
      background: transparent;
      padding: 2px;
    `,
    
    // Loading spinner
    spinner: `
      width: 16px;
      height: 16px;
      border: 2px solid var(--visual-search-border, #ccc);
      border-top: 2px solid var(--visual-search-text-secondary, #666);
      border-radius: 50%;
      animation: visual-search-spin 1s linear infinite;
    `,
    
    // Skeleton loader for image
    imageSkeleton: `
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: visual-search-skeleton-pulse 1.5s ease-in-out infinite;
      border-radius: 8px;
    `,
    
    // Skeleton loader for product cards
    productSkeleton: `
      background: white;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e9e9e9;
    `,
    
    // Pinterest-style overlay
    drawerOverlay: `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      z-index: 999999 !important;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 300ms cubic-bezier(0.2, 0.8, 0.2, 1);
      isolation: isolate;
    `,
    
    // Pinterest-style modal content - Enhanced mobile-first responsive design
    drawerContent: (isMobile) => `
      background: #ffffff;
      border-radius: ${isMobile ? '0' : '20px'};
      padding: 0;
      max-width: ${isMobile ? '100%' : '1600px'};
      width: ${isMobile ? '100%' : '95%'};
      max-height: ${isMobile ? '90vh' : '90vh'};
      height: ${isMobile ? '90vh' : '90vh'};
      min-height: ${isMobile ? '90vh' : '600px'};
      ${isMobile ? 'position: fixed; bottom: 0; left: 0; right: 0;' : 'position: relative;'}
      overflow: hidden;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1);
      transform: ${isMobile ? 'translateY(100%)' : 'translateY(24px) scale(0.94)'};
      transition: all 300ms cubic-bezier(0.2, 0.8, 0.2, 1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      border: 1px solid rgba(0, 0, 0, 0.06);
      display: flex;
      flex-direction: column;
      z-index: 1000000 !important;
      /* Enhanced mobile support */
      -webkit-overflow-scrolling: touch;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    `,
    
    // Notification toast
    notification: (type) => {
      const colors = {
        success: { bg: 'var(--visual-search-success, #059669)', text: '#fff' },
        error: { bg: 'var(--visual-search-critical, #DC2626)', text: '#fff' },
        info: { bg: 'var(--visual-search-brand-primary, #008060)', text: '#fff' }
      };
      return `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type].bg};
        color: ${colors[type].text};
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 2147483647 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px var(--visual-search-shadow-medium, rgba(0,0,0,0.15));
        max-width: 300px;
        word-wrap: break-word;
        transform: translateX(100%);
        transition: transform 0.3s ease;
      `;
    },

    // Cropper.js integration styles
    cropperContainer: `
      position: relative;
      max-width: 100%;
      max-height: 100%;
    `,

    resizeHandle: (position) => `
      position: absolute;
      cursor: ${position === 'nw' || position === 'se' ? 'nw-resize' : 'ne-resize'};
      touch-action: none;
      transition: all 0.2s ease;
      ${position === 'nw' ? 'top: -6px; left: -6px;' : ''}
      ${position === 'ne' ? 'top: -6px; right: -6px;' : ''}
      ${position === 'sw' ? 'bottom: -6px; left: -6px;' : ''}
      ${position === 'se' ? 'bottom: -6px; right: -6px;' : ''}
    `,

    // Elbow-shaped corner handle with double border
    elbowHandle: (position) => `
      width: 16px;
      height: 16px;
      background: transparent;
      pointer-events: auto;
      
      &::before {
        content: '';
        position: absolute;
        ${position === 'nw' ? 'top: 0; left: 0; border-top: 3px solid #ffffff; border-left: 3px solid #ffffff; width: 12px; height: 12px;' : ''}
        ${position === 'ne' ? 'top: 0; right: 0; border-top: 3px solid #ffffff; border-right: 3px solid #ffffff; width: 12px; height: 12px;' : ''}
        ${position === 'sw' ? 'bottom: 0; left: 0; border-bottom: 3px solid #ffffff; border-left: 3px solid #ffffff; width: 12px; height: 12px;' : ''}
        ${position === 'se' ? 'bottom: 0; right: 0; border-bottom: 3px solid #ffffff; border-right: 3px solid #ffffff; width: 12px; height: 12px;' : ''}
        border-radius: ${position === 'nw' ? '0 0 4px 0' : position === 'ne' ? '0 0 0 4px' : position === 'sw' ? '0 4px 0 0' : '4px 0 0 0'};
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
      }
      
      &::after {
        content: '';
        position: absolute;
        ${position === 'nw' ? 'top: 2px; left: 2px; border-top: 2px solid #f8f8f8; border-left: 2px solid #f8f8f8; width: 8px; height: 8px;' : ''}
        ${position === 'ne' ? 'top: 2px; right: 2px; border-top: 2px solid #f8f8f8; border-right: 2px solid #f8f8f8; width: 8px; height: 8px;' : ''}
        ${position === 'sw' ? 'bottom: 2px; left: 2px; border-bottom: 2px solid #f8f8f8; border-left: 2px solid #f8f8f8; width: 8px; height: 8px;' : ''}
        ${position === 'se' ? 'bottom: 2px; right: 2px; border-bottom: 2px solid #f8f8f8; border-right: 2px solid #f8f8f8; width: 8px; height: 8px;' : ''}
        border-radius: ${position === 'nw' ? '0 0 2px 0' : position === 'ne' ? '0 0 0 2px' : position === 'sw' ? '0 2px 0 0' : '2px 0 0 0'};
      }
    `,

    // Border resize handles (horizontal and vertical)
    borderHandle: (side) => `
      position: absolute;
      background: transparent;
      touch-action: none;
      transition: all 0.2s ease;
      cursor: ${side === 'top' || side === 'bottom' ? 'ns-resize' : 'ew-resize'};
      
      ${side === 'top' ? 'top: -4px; left: 16px; right: 16px; height: 8px;' : ''}
      ${side === 'bottom' ? 'bottom: -4px; left: 16px; right: 16px; height: 8px;' : ''}
      ${side === 'left' ? 'left: -4px; top: 16px; bottom: 16px; width: 8px;' : ''}
      ${side === 'right' ? 'right: -4px; top: 16px; bottom: 16px; width: 8px;' : ''}
      
      &::before {
        content: '';
        position: absolute;
        background: rgba(248, 248, 248, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.9);
        border-radius: 2px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        
        ${side === 'top' || side === 'bottom' ? 'left: 50%; top: 50%; transform: translate(-50%, -50%); width: 20px; height: 4px;' : ''}
        ${side === 'left' || side === 'right' ? 'left: 50%; top: 50%; transform: translate(-50%, -50%); width: 4px; height: 20px;' : ''}
      }
      
      &:hover::before {
        background: rgba(240, 240, 240, 0.9);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      }
    `,

    resizeHandleActive: `
      &::before {
        box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      
      &::after {
        border-color: #e60023;
      }
    `,

    borderHandleActive: `
      &::before {
        background: rgba(230, 0, 35, 0.8) !important;
        border-color: rgba(255, 255, 255, 1);
        box-shadow: 0 2px 8px rgba(230, 0, 35, 0.3);
        transform: translate(-50%, -50%) scale(1.1);
      }
    `,

    cropBoxKeyframes: `
      @keyframes crop-box-appear {
        0% {
          opacity: 0;
          transform: scale(0.9);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      @keyframes crop-box-pulse {
        0%, 100% {
          border-color: #e60023;
        }
        50% {
          border-color: #ff3366;
        }
      }
      
      /* Elbow-shaped corner handles - Thin and small */
      .resize-handle-corner {
        width: 12px;
        height: 12px;
        background: transparent;
        pointer-events: auto;
      }
      
      .resize-handle-corner::before {
        content: '';
        position: absolute;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
      }
      
      .resize-handle-corner::after {
        content: '';
        position: absolute;
      }
      
      .resize-handle-corner[data-position="nw"]::before {
        top: 0;
        left: 0;
        border-top: 2px solid #ffffff;
        border-left: 2px solid #ffffff;
        width: 8px;
        height: 8px;
        border-radius: 0 0 1px 0;
      }
      
      .resize-handle-corner[data-position="nw"]::after {
        top: 1px;
        left: 1px;
        border-top: 1px solid #f8f8f8;
        border-left: 1px solid #f8f8f8;
        width: 5px;
        height: 5px;
        border-radius: 0 0 1px 0;
      }
      
      .resize-handle-corner[data-position="ne"]::before {
        top: 0;
        right: 0;
        border-top: 2px solid #ffffff;
        border-right: 2px solid #ffffff;
        width: 8px;
        height: 8px;
        border-radius: 0 0 0 1px;
      }
      
      .resize-handle-corner[data-position="ne"]::after {
        top: 1px;
        right: 1px;
        border-top: 1px solid #f8f8f8;
        border-right: 1px solid #f8f8f8;
        width: 5px;
        height: 5px;
        border-radius: 0 0 0 1px;
      }
      
      .resize-handle-corner[data-position="sw"]::before {
        bottom: 0;
        left: 0;
        border-bottom: 2px solid #ffffff;
        border-left: 2px solid #ffffff;
        width: 8px;
        height: 8px;
        border-radius: 0 1px 0 0;
      }
      
      .resize-handle-corner[data-position="sw"]::after {
        bottom: 1px;
        left: 1px;
        border-bottom: 1px solid #f8f8f8;
        border-left: 1px solid #f8f8f8;
        width: 5px;
        height: 5px;
        border-radius: 0 1px 0 0;
      }
      
      .resize-handle-corner[data-position="se"]::before {
        bottom: 0;
        right: 0;
        border-bottom: 2px solid #ffffff;
        border-right: 2px solid #ffffff;
        width: 8px;
        height: 8px;
        border-radius: 1px 0 0 0;
      }
      
      .resize-handle-corner[data-position="se"]::after {
        bottom: 1px;
        right: 1px;
        border-bottom: 1px solid #f8f8f8;
        border-right: 1px solid #f8f8f8;
        width: 5px;
        height: 5px;
        border-radius: 1px 0 0 0;
      }
      
      .resize-handle-corner:hover::before {
        box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      
      .resize-handle-corner:hover::after {
        border-color: #e60023;
      }
      
      /* Border resize handles */
      .resize-handle-border {
        background: transparent;
        touch-action: none;
        transition: all 0.2s ease;
      }
      
      .resize-handle-border::before {
        content: '';
        position: absolute;
        background: rgba(248, 248, 248, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.9);
        border-radius: 2px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .resize-handle-border[data-side="top"], 
      .resize-handle-border[data-side="bottom"] {
        height: 8px;
        cursor: ns-resize;
      }
      
      .resize-handle-border[data-side="left"], 
      .resize-handle-border[data-side="right"] {
        width: 8px;
        cursor: ew-resize;
      }
      
      .resize-handle-border[data-side="top"] {
        top: -4px;
        left: 12px;
        right: 12px;
      }
      
      .resize-handle-border[data-side="bottom"] {
        bottom: -4px;
        left: 12px;
        right: 12px;
      }
      
      .resize-handle-border[data-side="left"] {
        left: -4px;
        top: 12px;
        bottom: 12px;
      }
      
      .resize-handle-border[data-side="right"] {
        right: -4px;
        top: 12px;
        bottom: 12px;
      }
      
      .resize-handle-border[data-side="top"]::before,
      .resize-handle-border[data-side="bottom"]::before {
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 16px;
        height: 3px;
      }
      
      .resize-handle-border[data-side="left"]::before,
      .resize-handle-border[data-side="right"]::before {
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 3px;
        height: 16px;
      }
      
      .resize-handle-border:hover::before {
        background: rgba(230, 0, 35, 0.8);
        border-color: rgba(255, 255, 255, 1);
        box-shadow: 0 2px 8px rgba(230, 0, 35, 0.3);
        transform: translate(-50%, -50%) scale(1.1);
      }
    `
  };
  
  // ====================================================================
  // PINTEREST-STYLE MODAL HTML TEMPLATE
  // ====================================================================
  
  const DRAWER_TEMPLATE = `
    <!-- Pinterest-Style Modal Header -->
    <div style="
      position: relative;
      padding: 20px 24px 16px;
      background: #ffffff;
      border-bottom: 1px solid #e9e9e9;
      flex-shrink: 0;
    ">
      <!-- Close Button - Pinterest Style -->
      <button id="close-drawer-x" style="
        position: absolute;
        top: 12px;
        right: 16px;
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #5f5f5f;
        transition: all 0.2s ease;
        font-size: 20px;
        font-weight: 400;
        z-index: 1000001;
      " onmouseover="
        this.style.background='#f0f0f0'; 
        this.style.color='#333';
      " onmouseout="
        this.style.background='transparent'; 
        this.style.color='#5f5f5f';
      ">
        ✕
      </button>

      <!-- Pinterest Logo Style Icon & Title -->
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
      ">
        <div style="
          width: 40px;
          height: 40px;
          background: #e60023;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(230, 0, 35, 0.2);
          flex-shrink: 0;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M9.5 3h4l1.5 1.5h6a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5H3a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 3 4.5h4L9.5 3zm2.5 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm0-2a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/>
          </svg>
        </div>
        
        <div>
          <h2 style="
            margin: 0 0 4px;
            color: #111111;
            font-size: 24px;
            font-weight: 600;
            line-height: 1.2;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          ">Visual Search Studio</h2>
          
          <p style="
            margin: 0;
            color: #5f5f5f;
            font-size: 16px;
            line-height: 1.4;
            font-weight: 400;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          ">Find items that match your style with AI-powered search</p>
        </div>
      </div>
    </div>

    <!-- Main Content Area with Mobile-First Responsive Layout -->
    <div id="modal-content" class="visual-search-modal-content" style="
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
      position: relative;
    ">
      <!-- Mobile: Responsive Layout, Desktop: Side-by-side Layout -->
      
      <!-- Left Side - Image Upload/Selection (Desktop) / Initial Upload (Mobile) -->
      <div id="left-panel" class="visual-search-left-panel" style="
        flex: 1;
        background: #fafafa;
        border-bottom: 1px solid #e9e9e9;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        min-height: 300px;
        max-height: 45vh;
        padding: 16px;
        width: 100%;
        box-sizing: border-box;
      ">
        <!-- Upload Section (Initial View) -->
        <div id="upload-section" style="
          flex: 1;
          display: flex;
          flex-direction: column;
        ">
          <!-- Main Upload Area -->
          <div class="visual-search-main-upload" style="
            border: 2px dashed #dadada;
            border-radius: 12px;
            padding: 24px 16px;
            text-align: center;
            background: #ffffff;
            margin-bottom: 16px;
            transition: all 0.2s ease;
            cursor: pointer;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-height: 160px;
          " id="main-upload-area" onmouseover="
            this.style.borderColor='#e60023';
            this.style.background='#fef7f7';
          " onmouseout="
            this.style.borderColor='#dadada';
            this.style.background='#ffffff';
          ">
            <!-- Upload Icon -->
            <div class="visual-search-upload-icon" style="
              width: 48px;
              height: 48px;
              background: #e60023;
              border-radius: 50%;
              margin: 0 auto 16px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            
            <h3 style="
              margin: 0 0 8px;
              color: #111111;
              font-size: 18px;
              font-weight: 600;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">Upload your image</h3>
            
            <p style="
              margin: 0 0 16px;
              color: #5f5f5f;
              font-size: 14px;
              line-height: 1.4;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 240px;
              margin-left: auto;
              margin-right: auto;
            ">Drag and drop an image here, or tap to browse</p>
            
            <button id="upload-from-device" style="
              background: #e60023;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            "onmouseover="
              this.style.background='#c8001c';
              this.style.transform='translateY(-1px)';
            "onmouseout="
              this.style.background='#e60023';
              this.style.transform='translateY(0)';
            ">Choose file</button>
          </div>

          <!-- Alternative Options -->
          <div class="visual-search-alt-buttons" style="
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
          ">
            <!-- Camera Option -->
            <button id="take-photo" class="visual-search-alt-button" style="
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              padding: 12px 8px;
              border: 1px solid #e9e9e9;
              border-radius: 8px;
              background: white;
              color: #111111;
              font-size: 13px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            " onmouseover="
              this.style.background='#f7f7f7';
              this.style.borderColor='#c8c8c8';
            " onmouseout="
              this.style.background='white';
              this.style.borderColor='#e9e9e9';
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Camera
            </button>
          </div>
        </div>

        <!-- Image Preview Section (Hidden Initially) -->
        <div id="image-preview-section" style="display: none;">
          <!-- Image Container with Crop Tool -->
          <div id="image-selection-container" style="
            position: relative;
            margin-bottom: 16px;
            border-radius: 8px;
            overflow: visible;
            background: #fafafa;
            min-height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
            max-height: 500px;
            border: 1px solid #e9e9e9;
            width: 100%;
            box-sizing: border-box;
            padding: 15px;
            z-index: 1;
          ">
            <!-- Uploaded image and crop box will be inserted here -->
          </div>

          <!-- Control Buttons -->
          <div style="
            display: flex;
            gap: 8px;
            justify-content: center;
            align-items: center;
            margin-top: 12px;
          ">
            <svg id="crop-button" role="button" style="cursor: pointer;" width="24" height="24" viewBox="0 0 24 24" fill="#e60023">
                <path d="M17,15H19V7C19,5.89 18.1,5 17,5H9V7H17V15M7,17V1H5V5H1V7H5V17A2,2 0 0,0 7,19H17V23H19V19H23V17H7Z"/>
            </svg>
            <button id="upload-another" style="
              background: white;
              color: #e60023;
              border: 2px solid #e60023;
              padding: 12px 24px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              width: 100%;
              max-width: 200px;
            " onmouseover="
              this.style.background='#e60023';
              this.style.color='white';
            " onmouseout="
              this.style.background='white';
              this.style.color='#e60023';
            ">Upload Another</button>
          </div>
        </div>
      </div>

      <!-- Right Side - Product Results -->
      <div id="right-panel" class="visual-search-right-panel" style="
        flex: 2;
        background: #ffffff;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
        position: relative;
      ">
        <!-- Desktop Search Results Section -->
        <div id="results-section" style="
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        ">
          <!-- Results Header -->
          <div id="results-header" class="visual-search-results-header" style="
            padding: 12px;
            border-bottom: 1px solid #e9e9e9;
            background: #ffffff;
            flex-shrink: 0;
          ">
            <!-- Side by side layout for title and expand button -->
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 4px;
            ">
              <h3 id="results-title" style="
                margin: 0;
                color: #111111;
                font-size: 16px;
                font-weight: 600;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                flex: 1;
              ">Ready to search</h3>
              
              <div class="mobile-expand-button" style="display: none;">
                <button id="mobile-expand-toggle" style="
                  background: #e60023;
                  border: none;
                  border-radius: 20px;
                  padding: 8px 16px;
                  font-size: 14px;
                  font-weight: 500;
                  cursor: pointer;
                  color: white;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  transition: background 0.2s ease;
                  white-space: nowrap;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                ">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 15l-6-6-6 6"/>
                  </svg>
                  Expand Results
                </button>
              </div>
            </div>
            
            <p id="results-count" style="
              margin: 0;
              color: #5f5f5f;
              font-size: 13px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">Upload an image to start searching</p>
          </div>

          <!-- Results Grid with Mobile-First Responsive Columns -->
          <div id="results-container" class="visual-search-results-container" style="
            flex: 1;
            overflow-y: auto;
            padding: 12px;
          ">
            <div id="results-grid" class="visual-search-results-grid" style="
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
            ">
              <!-- Results will be dynamically inserted here -->
            </div>

            <!-- Loading Indicator -->
            <div id="loading-more" style="
              display: none;
              text-align: center;
              padding: 16px;
              color: #5f5f5f;
              font-size: 13px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
              <div style="
                display: inline-block;
                width: 18px;
                height: 18px;
                border: 2px solid #e9e9e9;
                border-top: 2px solid #e60023;
                border-radius: 50%;
                animation: visual-search-spin 1s linear infinite;
                margin-bottom: 6px;
              "></div>
              <div>Loading more results...</div>
            </div>

            <!-- Empty State -->
            <div id="empty-state" class="visual-search-empty-state" style="
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              padding: 40px 16px;
              color: #5f5f5f;
            ">
              <div class="visual-search-empty-icon" style="
                width: 60px;
                height: 60px;
                background: #f0f0f0;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 16px;
              ">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                  <rect x="7" y="7" width="8" height="6" rx="1"/>
                </svg>
              </div>
              <h3 style="
                margin: 0 0 6px;
                color: #111111;
                font-size: 16px;
                font-weight: 600;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              ">Start your visual search</h3>
              <p style="
                margin: 0;
                font-size: 13px;
                line-height: 1.4;
                max-width: 260px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              ">Upload an image to find similar products using our AI-powered search technology</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // ====================================================================
  // UTILITY FUNCTIONS
  // ====================================================================
  
  // ====================================================================
  // THEME CONFIGURATION READER
  // ====================================================================
  
  function getThemeConfigFromAppBlocks() {
    console.log('[Visual Search] 🎨 Reading theme configuration from app blocks...');
    
    // Use centralized app block selectors
    const appBlockSelectors = CONFIG.APP_BLOCK_SELECTORS.ALL;
    
    const themeConfig = {};
    let configSource = 'app-block';
    
    // Read from app block styles directly
    for (const selector of appBlockSelectors) {
      const appBlock = document.querySelector(selector);
      if (appBlock) {
        console.log('[Visual Search] 📦 Found app block:', appBlock);
        
        // Try to read computed styles from the app block
        const computedStyle = window.getComputedStyle(appBlock);
        const color = computedStyle.color;
        
        if (color && color !== 'rgb(0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)') {
          themeConfig.iconColor = color;
          configSource = 'app-block-computed';
          console.log('[Visual Search] ✅ Read icon color from app block computed style:', color);
        }
        
        // Try to read from CSS custom properties on the app block
        const iconColorProperty = computedStyle.getPropertyValue('--vs-icon-color').trim();
        const hoverColorProperty = computedStyle.getPropertyValue('--vs-hover-color').trim();
        const primaryColorProperty = computedStyle.getPropertyValue('--vs-primary-color').trim();
        
        if (iconColorProperty) {
          themeConfig.iconColor = iconColorProperty;
          configSource = 'app-block-css-vars';
          console.log('[Visual Search] ✅ Read icon color from app block CSS variable:', iconColorProperty);
        }
        
        if (hoverColorProperty) {
          themeConfig.iconColorHover = hoverColorProperty;
          console.log('[Visual Search] ✅ Read hover color from app block CSS variable:', hoverColorProperty);
        }
        
        if (primaryColorProperty) {
          themeConfig.primaryColor = primaryColorProperty;
          console.log('[Visual Search] ✅ Read primary color from app block CSS variable:', primaryColorProperty);
        }
        
        break; // Use first found app block
      }
    }
    
    // App block-only mode - theme config comes from app block settings
    console.log('[Visual Search] ℹ️ App block mode - using block-level configuration only');
    
    // Apply theme config if we found any
    if (Object.keys(themeConfig).length > 0) {
      updateThemeConfig(themeConfig, configSource);
    } else {
      console.log('[Visual Search] ℹ️ Using static theme configuration');
    }
    
    return themeConfig;
  }
  
  function updateThemeConfig(newConfig, source = 'unknown') {
    console.log('[Visual Search] 🎨 Updating theme configuration from source:', source);
    console.log('[Visual Search] 📝 New config:', newConfig);
    
    // Update CONFIG.THEME with new values
    if (newConfig.iconColor) {
      CONFIG.THEME.ICON_COLOR = newConfig.iconColor;
    }
    if (newConfig.iconColorHover) {
      CONFIG.THEME.ICON_COLOR_HOVER = newConfig.iconColorHover;
    }
    if (newConfig.primaryColor) {
      CONFIG.THEME.PRIMARY_COLOR = newConfig.primaryColor;
    }
    if (newConfig.iconPosition) {
      CONFIG.THEME.ICON_POSITION = newConfig.iconPosition;
    }
    if (newConfig.iconOffset !== undefined) {
      CONFIG.THEME.ICON_OFFSET = newConfig.iconOffset;
    }
    if (newConfig.iconSizeMultiplier !== undefined) {
      CONFIG.THEME.ICON_SIZE_MULTIPLIER = newConfig.iconSizeMultiplier;
    }
    
    console.log('[Visual Search] ✅ Updated CONFIG.THEME:', CONFIG.THEME);
    
    console.log('[Visual Search] ✅ Theme configuration updated');
  }
  
  function addGlobalStyles() {
    if (document.querySelector('#visual-search-global-styles')) return;
    
    // Read theme configuration before adding styles
    getThemeConfigFromAppBlocks();
    
    const style = document.createElement('style');
    style.id = 'visual-search-global-styles';
    style.textContent = STYLES.spinnerKeyframes + STYLES.responsiveStyles + STYLES.cropperStyles;

    // Load cropper.js CSS and JS
    loadCropperJS();
    document.head.appendChild(style);
  }

  function loadCropperJS() {
    // Check if cropper.js is already loaded
    if (window.Cropper) {
      console.log('[Visual Search] 📦 Cropper.js already loaded');
      return;
    }

    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.css';
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.js';
    script.onload = () => {
      console.log('[Visual Search] ✅ Cropper.js loaded successfully');
    };
    script.onerror = () => {
      console.error('[Visual Search] ❌ Failed to load Cropper.js');
    };
    document.head.appendChild(script);
  }

  function isMobileDevice() {
    return window.innerWidth <= 768;
  }
  
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
  
  function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.visual-search-notification');
    existing.forEach(el => el.remove());
    
    const toast = document.createElement('div');
    toast.className = 'visual-search-notification';
    toast.style.cssText = STYLES.notification(type);
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

  function applyCrop() {
    const drawer = document.querySelector('.visual-search-drawer');
    if (!drawer) return;
    
    // Check if cropper already exists
    const container = drawer.querySelector('#image-selection-container');

    if (!container._cropper) {
      // Show crop box
      const imageContainer = drawer.querySelector('#image-selection-container');
      const img = drawer.querySelector('#uploaded-image');
      
      if (imageContainer && img) {
        // Hide any existing detection boxes
        const existingDetectionBox = imageContainer.querySelector('#detection-box');
        if (existingDetectionBox) {
          existingDetectionBox.remove();
        }

        // Remove all detection-circle and detection-rectangle bounding boxes since they're no longer relevant after crop
        const detectionCircles = imageContainer.querySelectorAll('.detection-circle');
        const detectionRectangles = imageContainer.querySelectorAll('.detection-rectangle');

        detectionCircles.forEach(circle => {
          console.log('[Visual Search] 🗑️ Removing detection circle:', circle.id);
          circle.remove();
        });

        detectionRectangles.forEach(rectangle => {
          console.log('[Visual Search] 🗑️ Removing detection rectangle:', rectangle.id);
          rectangle.remove();
        });

        console.log('[Visual Search] ✅ Removed', detectionCircles.length, 'detection circles and', detectionRectangles.length, 'detection rectangles before applying crop');

        addCropBox(imageContainer, img);
      } 
    }
  }
  
  // ====================================================================
  // LOADING STATES
  // ====================================================================
  // VISUAL SEARCH ICON CREATION & INJECTION
  // ====================================================================
  
  // ====================================================================
  // THEME COLOR APPLICATION
  // ====================================================================
  
  function applyThemeColorsToDrawer(drawer) {
    console.log('[Visual Search] 🎨 Applying theme colors to drawer...');
    console.log('[Visual Search] 📋 Current theme config:', CONFIG.THEME);
    
    try {
      // Apply primary color to the main icon background
      const iconBackground = drawer.querySelector('div[style*="background: #e60023"]');
      if (iconBackground) {
        iconBackground.style.background = CONFIG.THEME.PRIMARY_COLOR;
        iconBackground.style.boxShadow = `0 4px 16px ${CONFIG.THEME.PRIMARY_COLOR}33`; // 20% opacity
        console.log('[Visual Search] ✅ Applied primary color to icon background:', CONFIG.THEME.PRIMARY_COLOR);
      }
      
      // Apply colors to any upload buttons
      const uploadButtons = drawer.querySelectorAll('button[style*="background"]');
      uploadButtons.forEach(button => {
        if (button.style.background.includes('#e60023') || button.style.backgroundColor.includes('#e60023')) {
          button.style.background = CONFIG.THEME.PRIMARY_COLOR;
          button.style.backgroundColor = CONFIG.THEME.PRIMARY_COLOR;
          
          // Update hover states if they exist
          const originalOnMouseOver = button.onmouseover;
          button.onmouseover = function() {
            this.style.background = CONFIG.THEME.PRIMARY_COLOR_DARK || CONFIG.THEME.PRIMARY_COLOR;
            this.style.backgroundColor = CONFIG.THEME.PRIMARY_COLOR_DARK || CONFIG.THEME.PRIMARY_COLOR;
            if (originalOnMouseOver) originalOnMouseOver.call(this);
          };
          
          const originalOnMouseOut = button.onmouseout;
          button.onmouseout = function() {
            this.style.background = CONFIG.THEME.PRIMARY_COLOR;
            this.style.backgroundColor = CONFIG.THEME.PRIMARY_COLOR;
            if (originalOnMouseOut) originalOnMouseOut.call(this);
          };
          
          console.log('[Visual Search] ✅ Applied primary color to button');
        }
      });
      
      // Apply colors to any elements with Pinterest red
      const pinterestRedElements = drawer.querySelectorAll('*');
      pinterestRedElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.backgroundColor.includes('rgb(230, 0, 35)') || 
            computedStyle.color.includes('rgb(230, 0, 35)') ||
            element.style.background.includes('#e60023') ||
            element.style.color.includes('#e60023')) {
          
          if (element.style.background.includes('#e60023')) {
            element.style.background = element.style.background.replace('#e60023', CONFIG.THEME.PRIMARY_COLOR);
          }
          if (element.style.backgroundColor.includes('#e60023')) {
            element.style.backgroundColor = CONFIG.THEME.PRIMARY_COLOR;
          }
          if (element.style.color.includes('#e60023')) {
            element.style.color = CONFIG.THEME.PRIMARY_COLOR;
          }
          
          console.log('[Visual Search] ✅ Applied primary color to element');
        }
      });
      
      // Apply CSS custom properties for any future elements
      drawer.style.setProperty('--vs-primary-color', CONFIG.THEME.PRIMARY_COLOR);
      drawer.style.setProperty('--vs-primary-color-dark', CONFIG.THEME.PRIMARY_COLOR_DARK || CONFIG.THEME.PRIMARY_COLOR);
      drawer.style.setProperty('--vs-icon-color', CONFIG.THEME.ICON_COLOR);
      drawer.style.setProperty('--vs-icon-color-hover', CONFIG.THEME.ICON_COLOR_HOVER);
      
      console.log('[Visual Search] ✅ Applied CSS custom properties to drawer');
      
      // Set up a mutation observer to apply colors to dynamically added elements
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node;
              // Apply colors to any new buttons with Pinterest red
              if (element.style?.background?.includes('#e60023') || 
                  element.style?.backgroundColor?.includes('#e60023')) {
                element.style.background = element.style.background?.replace('#e60023', CONFIG.THEME.PRIMARY_COLOR) || CONFIG.THEME.PRIMARY_COLOR;
                element.style.backgroundColor = CONFIG.THEME.PRIMARY_COLOR;
                console.log('[Visual Search] ✅ Applied colors to dynamically added element');
              }
              
              // Also check child elements
              const childButtons = element.querySelectorAll?.('button[style*="#e60023"], *[style*="#e60023"]');
              childButtons?.forEach(childElement => {
                if (childElement.style.background.includes('#e60023')) {
                  childElement.style.background = childElement.style.background.replace('#e60023', CONFIG.THEME.PRIMARY_COLOR);
                }
                if (childElement.style.backgroundColor.includes('#e60023')) {
                  childElement.style.backgroundColor = CONFIG.THEME.PRIMARY_COLOR;
                }
                console.log('[Visual Search] ✅ Applied colors to dynamically added child element');
              });
            }
          });
        });
      });
      
      observer.observe(drawer, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['style']
      });
      
      // Store observer for cleanup
      drawer._themeObserver = observer;
      
    } catch (error) {
      console.error('[Visual Search] ❌ Error applying theme colors:', error);
    }
  }



  // ====================================================================
  // SIMPLE MOBILE EXPAND FUNCTIONALITY
  // ====================================================================
  
  function initializeMobileExpand(drawer) {
    const isMobile = isMobileDevice();
    if (!isMobile) return;
    
    const expandButton = drawer.querySelector('#mobile-expand-toggle');
    const leftPanel = drawer.querySelector('#left-panel');
    const expandContainer = drawer.querySelector('.mobile-expand-button');
    
    if (!expandButton || !leftPanel || !expandContainer) return;
    
    let isExpanded = false;
    
    // Show expand button when in mobile results mode
    const observer = new MutationObserver(() => {
      const modalContent = drawer.querySelector('#modal-content');
      if (modalContent && modalContent.classList.contains('mobile-results-mode')) {
        expandContainer.style.display = 'block';
      } else {
        expandContainer.style.display = 'none';
      }
    });
    
    const modalContent = drawer.querySelector('#modal-content');
    if (modalContent) {
      observer.observe(modalContent, { attributes: true, attributeFilter: ['class'] });
    }
    
    expandButton.addEventListener('click', () => {
      isExpanded = !isExpanded;
      
      if (isExpanded) {
        // Expand: Add expanded class for full height results
        modalContent.classList.add('mobile-results-expanded');
        expandButton.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
          Show Image
        `;
        expandButton.style.background = '#c8001c';
        expandButton.style.color = 'white';
      } else {
        // Collapse: Remove expanded class to show compact results with image
        modalContent.classList.remove('mobile-results-expanded');
        expandButton.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 15l-6-6-6 6"/>
          </svg>
          Expand Results
        `;
        expandButton.style.background = '#e60023';
        expandButton.style.color = 'white';
      }
    });
    
    // Add hover effects
    expandButton.addEventListener('mouseenter', () => {
      if (!isExpanded) {
        expandButton.style.background = '#c8001c';
      }
    });
    
    expandButton.addEventListener('mouseleave', () => {
      if (!isExpanded) {
        expandButton.style.background = '#e60023';
      }
    });
    
    // Reset state when modal closes or new search starts
    const resetExpandState = () => {
      isExpanded = false;
      if (modalContent) modalContent.classList.remove('mobile-results-expanded');
      expandButton.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 15l-6-6-6 6"/>
        </svg>
        Expand Results
      `;
      expandButton.style.background = '#e60023';
      expandButton.style.color = 'white';
    };
    
    // Listen for modal close
    const closeButton = drawer.querySelector('#close-modal');
    if (closeButton) {
      closeButton.addEventListener('click', resetExpandState);
    }
    
    // Listen for new uploads (reset to upload mode)
    const uploadButton = drawer.querySelector('#upload-new-image');
    if (uploadButton) {
      uploadButton.addEventListener('click', resetExpandState);
    }
    
    console.log('[Visual Search] 📱 Simple mobile expand functionality initialized');
  }

  // ====================================================================
  // ANALYTICS UTILITIES
  // ====================================================================

  function trackEvent(action, metadata = {}, type = 'analytics') {
    if (type === 'analytics' && !CONFIG.ANALYTICS_ENABLED) return;

    try {
      const cleanMetadata = { ...metadata };
      delete cleanMetadata.action;

      const payload = {
        shop: CONFIG.SHOP_DOMAIN,
        action: type === 'app_block' ? `app_block_${action}` : action,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'visual-search',
          actionType: type === 'analytics' ? 'analytics-event' : 'app-block-usage',
          ...cleanMetadata
        }
      };

      fetch(`${CONFIG.APP_URL}/api/cleanup-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }).then(() => {
        if (type === 'app_block') {
          console.log(`[Visual Search] 📊 App block ${action} tracked`);
        }
      }).catch(error => {
        const errorMessage = type === 'app_block'
          ? `⚠️ Failed to track ${action}:`
          : `${action} tracking failed:`;
        console.log(`[Visual Search] ${errorMessage}`, error);
      });
    } catch (error) {
      const errorMessage = type === 'app_block'
        ? `⚠️ Tracking error for ${action}:`
        : `${action} tracking error:`;
      console.log(`[Visual Search] ${errorMessage}`, error);
    }
  }

  function trackAnalyticsEvent(action, metadata = {}) {
    trackEvent(action, metadata, 'analytics');
  }

  function trackAppBlockUsage(action, metadata = {}) {
    trackEvent(action, metadata, 'app_block');
  }

  // ====================================================================
  // PINTEREST-STYLE DRAWER
  // ====================================================================
  
  function openVisualSearchDrawer(searchInput) {
    console.log('[Visual Search] 🚪 Opening drawer with searchInput:', !!searchInput, searchInput);

    // Track visual search component loaded
    trackAnalyticsEvent('loaded', {
      actionType: 'component-loaded',
      hasSearchInput: !!searchInput,
      browserWidth: window.innerWidth,
      browserHeight: window.innerHeight,
      isMobile: window.innerWidth <= 768
    });

    // Read theme configuration from app blocks before creating drawer
    console.log('[Visual Search] 🎨 Reading theme configuration before opening drawer...');
    getThemeConfigFromAppBlocks();

    // If searchInput is null/undefined, create a fallback
    if (!searchInput) {
      console.log('[Visual Search] ⚠️ No searchInput provided, creating fallback');
      // Create a mock search input object
      searchInput = createFallbackSearchInput();
    }
    
    // Remove any existing drawer
    const existingDrawer = document.querySelector('.visual-search-drawer');
    if (existingDrawer) {
      existingDrawer.remove();
    }

    // Force our modal to be on top by temporarily reducing other high z-index elements
    const highZIndexElements = Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const zIndex = parseInt(getComputedStyle(el).zIndex);
        return zIndex > 100000 && !el.classList.contains('visual-search-drawer');
      });
    
    // Store original z-index values and temporarily lower them
    const originalZIndexes = new Map();
    highZIndexElements.forEach(el => {
      const originalZIndex = el.style.zIndex || getComputedStyle(el).zIndex;
      originalZIndexes.set(el, originalZIndex);
      el.style.zIndex = '99999';
    });

    const isMobile = isMobileDevice();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'visual-search-drawer';
    overlay.style.cssText = STYLES.drawerOverlay;

    // Create drawer content
    const drawer = document.createElement('div');
    drawer.style.cssText = STYLES.drawerContent(isMobile);
    drawer.innerHTML = DRAWER_TEMPLATE;

    overlay.appendChild(drawer);
    document.body.appendChild(overlay);

    // Apply dynamic theme colors to the drawer
    applyThemeColorsToDrawer(drawer);

    // Store the searchInput reference on multiple elements for easy access
    overlay._searchInput = searchInput;
    drawer._searchInput = searchInput;
    
    // Store globally as fallback - make it persistent
    window.visualSearchCurrentInput = searchInput;
    window.visualSearchCurrentSearchInput = searchInput; // Additional backup
    
    // Also store on any modal content that might exist
    const modalContent = drawer.querySelector('#modal-content');
    if (modalContent) {
      modalContent._searchInput = searchInput;
    }

    console.log('[Visual Search] 💾 Stored searchInput on drawer elements:', !!searchInput);
    console.log('[Visual Search] 🌍 Stored searchInput globally:', !!window.visualSearchCurrentInput);
    console.log('[Visual Search] 🔍 SearchInput details:', {
      value: searchInput?.value,
      type: searchInput?.type,
      name: searchInput?.name
    });

    // Add global styles for responsive behavior
    addGlobalStyles();

    // Animate in
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      if (isMobile) {
        drawer.style.transform = 'translateY(0)';
      } else {
        drawer.style.transform = 'translateY(0) scale(1)';
      }
    });

    // Close function
    const closeDrawer = () => {
      overlay.style.opacity = '0';
      if (isMobile) {
        drawer.style.transform = 'translateY(100%)';
      } else {
        drawer.style.transform = 'translateY(32px) scale(0.96)';
      }
      
      // Clean up mutation observer
      if (drawer._themeObserver) {
        drawer._themeObserver.disconnect();
        drawer._themeObserver = null;
        console.log('[Visual Search] 🧹 Theme mutation observer cleaned up');
      }
      
      // Restore original z-index values
      originalZIndexes.forEach((originalZIndex, el) => {
        if (originalZIndex === 'auto' || originalZIndex === '') {
          el.style.zIndex = '';
        } else {
          el.style.zIndex = originalZIndex;
        }
      });
      
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, CONFIG.ANIMATION_DURATION);
    };

    // Event handlers
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDrawer();
    });

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeDrawer();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Button handlers
    drawer.querySelector('#close-drawer-x').addEventListener('click', closeDrawer);

    // Add simple mobile expand functionality
    initializeMobileExpand(drawer);

    // Main upload area click handler
    drawer.querySelector('#main-upload-area').addEventListener('click', () => {
      openVisualSearchWithSelection(searchInput, drawer);
    });

    drawer.querySelector('#upload-from-device').addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent triggering the main upload area
      openVisualSearchWithSelection(searchInput, drawer);
    });

    drawer.querySelector('#take-photo').addEventListener('click', () => {
      const button = drawer.querySelector('#take-photo');
      button.style.transform = 'scale(0.98)';
      button.style.opacity = '0.8';
      
      setTimeout(() => {
        openVisualSearchWithSelection(searchInput, drawer, true);
      }, 150);
    });

    drawer.querySelector('#from-url').addEventListener('click', () => {
      const button = drawer.querySelector('#from-url');
      button.style.transform = 'scale(0.98)';
      button.style.opacity = '0.8';
      
      setTimeout(() => {
        openUrlInputDialog(searchInput, drawer);
      }, 150);
    });





    // Crop button handler
    drawer.querySelector('#crop-button')?.addEventListener('click', () => {
      applyCrop();
    });

    // Filter handlers - Simplified for no filters
    // setupFilterHandlers(drawer, searchInput);
    
    // Results section handlers  
    setupResultsHandlers(drawer, searchInput);
  }
  
  // ====================================================================
  // VISUAL SEARCH WITH ITEM SELECTION
  // ====================================================================
  
  function openVisualSearchWithSelection(searchInput, drawer, useCamera = false) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = CONFIG.ACCEPTED_TYPES.join(',');
    if (useCamera) {
      fileInput.capture = 'environment';
    }
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file || !validateFile(file)) return;

      try {
        // Track image upload
        trackAnalyticsEvent('added', {
          actionType: 'image-upload',
          fileSize: file.size,
          fileType: file.type,
          fileName: file.name,
          uploadMethod: useCamera ? 'camera' : 'file-picker'
        });

        // Show image preview immediately
        showImagePreview(drawer, file, searchInput);

        // 🚀 IMMEDIATE API CALL - Call backend as soon as file is uploaded
        performImmediateImageAnalysis(drawer, file, searchInput);
        
      } catch (error) {
        console.error('Visual search error:', error);
        showError('Something went wrong. Please try again.');
      }
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  }

  function showImagePreview(drawer, imageFile, searchInput) {
    const isMobile = isMobileDevice();
    
    // Hide upload section, show image preview
    drawer.querySelector('#upload-section').style.display = 'none';
    drawer.querySelector('#image-preview-section').style.display = 'block';

    // Setup Upload Another button event listener immediately when image preview is shown
    const uploadAnotherBtn = drawer.querySelector('#upload-another');
    console.log('Upload Another button element:', uploadAnotherBtn);
    if (uploadAnotherBtn) {
      // Remove any existing event listeners
      uploadAnotherBtn.replaceWith(uploadAnotherBtn.cloneNode(true));
      const newUploadAnotherBtn = drawer.querySelector('#upload-another');

      // Add multiple event listeners to ensure it works
      newUploadAnotherBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Upload Another button clicked');
        showUploadSection(drawer);
      }, true); // Use capture phase

      newUploadAnotherBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Upload Another button mousedown');
        showUploadSection(drawer);
      });
    } else {
      console.log('Upload Another button not found in drawer');
    }

    // On mobile, also add results mode class for better layout
    if (isMobile) {
      const modalContent = drawer.querySelector('#modal-content');
      if (modalContent) modalContent.classList.add('mobile-results-mode');
    }
    
    // Display the uploaded image with skeleton loader
    const imageContainer = drawer.querySelector('#image-selection-container');
    
    // Show skeleton loader first
    imageContainer.innerHTML = `
      <div style="${STYLES.imageSkeleton}" id="image-skeleton"></div>
    `;
    
    // Check if this is a URL-based image (like from search results) or a real file
    if (imageFile._imageUrl) {
      // Handle URL-based images (from search results)
      const img = document.createElement('img');
      img.style.cssText = `
        max-width: calc(100% - 30px);
        max-height: calc(100% - 30px);
        width: auto;
        height: auto;
        min-width: 150px;
        min-height: 150px;
        border-radius: 8px;
        object-fit: contain;
        opacity: 0;
        transition: opacity 0.3s ease;
        background: transparent;
        display: block;
        margin: 0 auto;
        position: relative;
        z-index: 1;
      `;
      img.id = 'uploaded-image';
      img.src = imageFile._imageUrl;
      
      // Once image loads, fade it in, remove skeleton, and add crop box
      img.onload = () => {
        const skeleton = imageContainer.querySelector('#image-skeleton');
        if (skeleton) {
          skeleton.remove();
        }
        img.style.opacity = '1';
        
        // Update centralized image state
        updateImageState(img);
        
      };
      
      img.onerror = () => {
        const skeleton = imageContainer.querySelector('#image-skeleton');
        if (skeleton) {
          skeleton.remove();
        }
        imageContainer.innerHTML = `
          <div style="color: #666; text-align: center; padding: 40px;">
            Failed to load image. Please try again.
          </div>
        `;
      };
      
      imageContainer.appendChild(img);
    } else {
      // Handle real file uploads
      const reader = new FileReader();
      reader.onload = (e) => {
        // Create image element
        const img = document.createElement('img');
        img.style.cssText = `
          max-width: calc(100% - 30px);
          max-height: calc(100% - 30px);
          width: auto;
          height: auto;
          min-width: 150px;
          min-height: 150px;
          border-radius: 8px;
          object-fit: contain;
          opacity: 0;
          transition: opacity 0.3s ease;
          background: transparent;
          display: block;
          margin: 0 auto;
        `;
        img.id = 'uploaded-image';
        img.src = e.target.result;
        
        // Once image loads, fade it in, remove skeleton, and add crop box
        img.onload = () => {
          const skeleton = imageContainer.querySelector('#image-skeleton');
          if (skeleton) {
            skeleton.remove();
          }
          img.style.opacity = '1';
          
          updateImageState(img);
          
        };
        
        imageContainer.appendChild(img);
      };
      reader.readAsDataURL(imageFile);
    }
    
    // Store file for later analysis - store on multiple elements to ensure real-time analysis can find it
    drawer._imageFile = imageFile;
    drawer._searchInput = searchInput;
    
    // Store globally as fallback - ensure it's persistent
    window.visualSearchCurrentInput = searchInput;
    window.visualSearchCurrentSearchInput = searchInput; // Additional backup
    
    // Also store on modal-content div (which real-time analysis looks for)
    const modalContent = drawer.querySelector('#modal-content');
    if (modalContent) {
      modalContent._imageFile = imageFile;
      modalContent._searchInput = searchInput;
    }
    
    // Also store on the image container as a fallback
    const imageSelectionContainer = drawer.querySelector('#image-selection-container');
    if (imageSelectionContainer) {
      imageSelectionContainer._imageFile = imageFile;
      imageSelectionContainer._searchInput = searchInput;
    }
    
    // Also store on the drawer overlay element for better access
    const drawerOverlay = drawer.closest('.visual-search-drawer');
    if (drawerOverlay) {
      drawerOverlay._imageFile = imageFile;
      drawerOverlay._searchInput = searchInput;
      
      // Store references on the main drawer div too
      const mainDrawerDiv = drawerOverlay.querySelector('div[style*="flex"]');
      if (mainDrawerDiv && mainDrawerDiv !== drawer) {
        mainDrawerDiv._imageFile = imageFile;
        mainDrawerDiv._searchInput = searchInput;
      }
      
      // Also store on any visual-search-modal-content div
      const modalContentDiv = drawerOverlay.querySelector('.visual-search-modal-content');
      if (modalContentDiv && modalContentDiv !== drawer) {
        modalContentDiv._imageFile = imageFile;
        modalContentDiv._searchInput = searchInput;
      }
      
      // Store on the main background white div (most reliable)
      const bgWhiteDiv = drawerOverlay.querySelector('div[style*="background: white"]');
      if (bgWhiteDiv && bgWhiteDiv !== drawer) {
        bgWhiteDiv._imageFile = imageFile;
        bgWhiteDiv._searchInput = searchInput;
      }
    }
    
    console.log('[Visual Search] 📦 Data stored on elements:');
    console.log('  - drawer:', !!drawer._imageFile, !!drawer._searchInput);
    console.log('  - modalContent:', !!(modalContent && modalContent._imageFile), !!(modalContent && modalContent._searchInput));
    console.log('  - imageContainer:', !!(imageSelectionContainer && imageSelectionContainer._imageFile), !!(imageSelectionContainer && imageSelectionContainer._searchInput));
    console.log('  - drawerOverlay:', !!(drawerOverlay && drawerOverlay._imageFile), !!(drawerOverlay && drawerOverlay._searchInput));
    console.log('  - global:', !!window.visualSearchCurrentInput);
    
    // Set up crop button event listener (now that the button exists in DOM)
    const cropButton = drawer.querySelector('#crop-button');
    if (cropButton) {
      cropButton.addEventListener('click', () => {
        applyCrop();
      });
    }
  }

  // 🚀 NEW FUNCTION: Real-time API call when user crops or resizes
  async function performRealTimeCropAnalysis(container) {
    try {
      console.log('[Visual Search] 🎯 Real-time crop analysis triggered!');
      
      // Find the drawer and data more reliably
      let drawer = null;
      let imageFile = null;
      let searchInput = null;
      
      // First, get the drawer container
      const drawerContainer = container.closest('.visual-search-drawer');
      if (!drawerContainer) {
        console.log('[Visual Search] ❌ Could not find drawer container');
        return;
      }
      
      // Try to find data from the drawer overlay first (most reliable)
      if (drawerContainer._imageFile && drawerContainer._searchInput) {
        imageFile = drawerContainer._imageFile;
        searchInput = drawerContainer._searchInput;
        drawer = drawerContainer.querySelector('#modal-content') || drawerContainer.querySelector('.visual-search-modal-content');
        console.log('[Visual Search] ✅ Found data on drawer overlay');
      }
      
      // If not found, try the main drawer div
      if (!imageFile || !searchInput) {
        const mainDrawer = drawerContainer.querySelector('div[style*="background: white"]');
        if (mainDrawer && (mainDrawer._imageFile || mainDrawer._searchInput)) {
          imageFile = imageFile || mainDrawer._imageFile;
          searchInput = searchInput || mainDrawer._searchInput;
          drawer = drawer || mainDrawer.querySelector('#modal-content') || mainDrawer;
          console.log('[Visual Search] ✅ Found data on main drawer div');
        }
      }
      
      // If not found, try image selection container
      if (!imageFile || !searchInput) {
        const imageSelectionContainer = drawerContainer.querySelector('#image-selection-container');
        if (imageSelectionContainer && (imageSelectionContainer._imageFile || imageSelectionContainer._searchInput)) {
          imageFile = imageFile || imageSelectionContainer._imageFile;
          searchInput = searchInput || imageSelectionContainer._searchInput;
          drawer = drawer || drawerContainer.querySelector('#modal-content') || drawerContainer.querySelector('.visual-search-modal-content');
          console.log('[Visual Search] ✅ Found data on image selection container');
        }
      }
      
      // If still not found, try modal content
      if (!imageFile || !searchInput) {
        const modalContent = drawerContainer.querySelector('#modal-content');
        if (modalContent && (modalContent._imageFile || modalContent._searchInput)) {
          imageFile = imageFile || modalContent._imageFile;
          searchInput = searchInput || modalContent._searchInput;
          drawer = drawer || modalContent;
          console.log('[Visual Search] ✅ Found data on modal content');
        }
      }
      
      // Last resort: try to find any div with the data
      if (!imageFile || !searchInput) {
        const allDivs = drawerContainer.querySelectorAll('div');
        for (const div of allDivs) {
          if (div._imageFile || div._searchInput) {
            imageFile = imageFile || div._imageFile;
            searchInput = searchInput || div._searchInput;
            drawer = drawer || div;
            console.log('[Visual Search] ✅ Found data on div element');
            break;
          }
        }
      }
      
      console.log('[Visual Search] 🔍 Drawer found:', !!drawer);
      console.log('[Visual Search] 🔍 Image file exists:', !!imageFile);
      console.log('[Visual Search] 🔍 Search input exists:', !!searchInput);
      
      if (!drawer) {
        return;
      }
      
      if (!imageFile) {
        return;
      }
      
      if (!searchInput) {
        console.log('[Visual Search] ❌ No search input found');
        // Try to get searchInput from global scope or window
        if (window.visualSearchCurrentInput) {
          searchInput = window.visualSearchCurrentInput;
          console.log('[Visual Search] ✅ Found searchInput from global scope');
        } else if (window.visualSearchCurrentSearchInput) {
          searchInput = window.visualSearchCurrentSearchInput;
          console.log('[Visual Search] ✅ Found searchInput from backup global scope');
        } else {
          // Create a fallback search input if none exists
          searchInput = createFallbackSearchInput();
          console.log('[Visual Search] ⚠️ Created fallback searchInput');
        }
      }
      
      const cropData = getCropData(drawer);
      if (!cropData) {
        console.log('[Visual Search] ⚠️ No crop data available for real-time analysis');
        return;
      }
      
      console.log('[Visual Search] 🔄 Calling immediate API with crop data:', cropData);
      
      // Store the data on the drawer temporarily for the API call
      drawer._imageFile = imageFile;
      drawer._searchInput = searchInput;
      
      // Call the API immediately without any delay
      await performCroppedImageSearch(drawer, searchInput, cropData);
      
    } catch (error) {
      console.error('[Visual Search] ❌ Real-time crop analysis failed:', error);
    }
  }

  // 🚀 NEW FUNCTION: Immediate API call when file is uploaded
  async function performImmediateImageAnalysis(drawer, imageFile, searchInput) {
    try {
      console.log('[Visual Search] 🚀 Starting immediate image analysis...');
      
      // Update UI to show we're analyzing
      updateResultsHeader(drawer, 'Analyzing image...', 'Detecting items in your uploaded image...');
      clearResults(drawer);
      showSkeletonLoaders(drawer);
      
      // Handle URL-based images differently
      if (imageFile._imageUrl) {
        console.log('[Visual Search] 📤 Processing URL-based image:', imageFile._imageUrl);
        
        // For URL-based images, we need to fetch and convert to blob first
        try {
          const response = await fetch(imageFile._imageUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch image from URL: ${response.status}`);
          }
          
          const blob = await response.blob();
          const file = new File([blob], imageFile.name, { type: blob.type || 'image/jpeg' });
          
          // Now proceed with the file upload
          await performImmediateFileAnalysis(drawer, file, searchInput);
          
        } catch (error) {
          console.error('[Visual Search] ❌ Failed to process URL image:', error);
          throw new Error('Failed to process image from URL');
        }
        
      } else {
        // Handle regular file uploads
        await performImmediateFileAnalysis(drawer, imageFile, searchInput);
      }
      
    } catch (error) {
      console.error('[Visual Search] ❌ Immediate image analysis error:', error);
      showError('Failed to analyze image. Please try again.');
      updateResultsHeader(drawer, 'Analysis failed', 'Something went wrong during image analysis');
      removeSkeletonLoaders(drawer);
      const emptyState = drawer.querySelector('#empty-state');
      if (emptyState) {
        emptyState.style.display = 'flex';
      }
    }
  }
  
  // Helper function to handle actual file analysis
  async function performImmediateFileAnalysis(drawer, imageFile, searchInput) {
    // Prepare form data for immediate analysis
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('crop', 'false');
    
    console.log('[Visual Search] 📤 Sending immediate analysis request to:', CONFIG.EXTERNAL_API_URL);
    console.log('[Visual Search] 📄 File details:', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type
    });
    console.log('[Visual Search] 🏪 Shop domain:', CONFIG.SHOP_DOMAIN);
    
    // Make API call immediately
    const response = await fetch(CONFIG.EXTERNAL_API_URL, {
      method: 'POST',
      headers: {
        'shopDomainURL': CONFIG.SHOP_DOMAIN
      },
      body: formData,
    });
    
    console.log('[Visual Search] 📥 Immediate analysis response status:', response.status);
    console.log('[Visual Search] 📥 Response headers:', response.headers);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Visual Search] ❌ Immediate analysis server error:', errorText);

      // Handle authentication errors specifically
      if (response.status === 401) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.code === 'SHOP_NOT_AUTHENTICATED' || errorData.code === 'SESSION_EXPIRED') {
            showError('App authentication expired. Please contact the store owner to reinstall the app.');
            updateResultsHeader(drawer, 'Authentication Required', 'The app needs to be reinstalled by the store owner');
            removeSkeletonLoaders(drawer);
            return;
          }
        } catch (e) {
          // If parsing fails, fall through to generic error
        }
      }

      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('[Visual Search] ✅ Immediate analysis API response:', result);
    
    // Extract detection data from API response using centralized image state
    const largestBoundingBoxId = result.largest_bounding_box_id || null;
    const allBoundingBox = result.all_bounding_box || [];
    const labels = result.labels || [];
    
    console.log('[Visual Search] 📦 Largest bounding box ID:', largestBoundingBoxId);
    console.log('[Visual Search] 🔲 All bounding boxes:', allBoundingBox.length);
    console.log('[Visual Search] 🏷️ Detection labels:', labels);
    
    // Show multiple detection bounding boxes if available (but not when cropper is active)
    const container = drawer.querySelector('#image-selection-container');
    if (allBoundingBox.length > 0 && imageState.element && !container._cropper) {
      showMultipleDetections(drawer, allBoundingBox, largestBoundingBoxId, labels);
    }
    
    // Process results immediately and show to user
    if (result && (result.products || result.detectedItems || result.length > 0)) {
      let detectedItems = [];
      
      if (Array.isArray(result)) {
        // Result is directly an array of items
        detectedItems = result.map((item, index) => ({
          id: item.productId || item.id || index,
          image: item.image || item.imageUrl || (item.images && item.images[0] && item.images[0].url),
          name: item.name || item.title || `Item ${index + 1}`,
          confidence: item.confidence || 0.9,
          price: item.price,
          currency: item.currency || 'USD',
          handle: item.handle,
          available: item.available,
          vendor: item.vendor,
          description: item.description,
          variants: item.variants
        }));
      } else if (result.detectedItems) {
        detectedItems = result.detectedItems;
      } else if (result.products) {
        detectedItems = result.products.map((item, index) => ({
          id: item.productId || item.id || index,
          image: item.image || item.imageUrl || (item.images && item.images[0] && item.images[0].url),
          name: item.name || item.title || `Item ${index + 1}`,
          confidence: item.confidence || 0.9,
          price: item.price,
          currency: item.currency || 'USD',
          handle: item.handle,
          available: item.available,
          vendor: item.vendor,
          description: item.description,
          variants: item.variants
        }));
      }
      
      if (detectedItems.length > 0) {
        console.log(`[Visual Search] ✅ Found ${detectedItems.length} items immediately`);
        
        // Update UI with immediate results
        updateResultsHeader(drawer, 'Items detected!', `Found ${detectedItems.length} items in your image`);
        removeSkeletonLoaders(drawer);
        
        // Show results immediately without requiring crop selection
        showSearchResults(drawer, detectedItems, 'immediate', searchInput);
        
        // Show success notification
        showSuccess(`Found ${detectedItems.length} items in your image!`);
        
      } else {
        console.log('[Visual Search] ⚠️ No items detected in immediate analysis');
        updateResultsHeader(drawer, 'No items detected', 'Try adjusting the crop area or uploading a different image');
        removeSkeletonLoaders(drawer);
        const emptyState = drawer.querySelector('#empty-state');
        if (emptyState) {
          emptyState.style.display = 'flex';
        }
      }
    } else {
      throw new Error('No valid response data received');
    }
  }

  function addCropBox(container, img) {
    // Check if cropper.js is loaded
    if (!window.Cropper) {
      console.warn('[Visual Search] ⚠️ Cropper.js not loaded yet, retrying in 500ms...');
      setTimeout(() => addCropBox(container, img), 500);
      return;
    }

    // Clean up any existing cropper
    if (container._cropper) {
      container._cropper.destroy();
      container._cropper = null;
    }

    // Clean up hide observer
    if (container._hideObserver) {
      container._hideObserver.disconnect();
      container._hideObserver = null;
    }

    // Initialize cropper.js on the image
    const cropper = new Cropper(img, {
      aspectRatio: NaN, // Free aspect ratio
      viewMode: 1, // Restrict crop box not to exceed canvas
      dragMode: 'move',
      autoCropArea: 0.5, // 50% of image area
      restore: false,
      guides: true,
      center: true,
      highlight: true,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      responsive: true,
      background: false, // Don't show background grid
      modal: false, // Don't show modal (dark area outside crop)
      ready() {
        console.log('[Visual Search] ✅ Cropper.js initialized successfully');

        // Get cropper elements for proper overlay styling
        const cropperContainer = container.querySelector('.cropper-container');
        const cropperCanvas = container.querySelector('.cropper-canvas');
        const cropperDragBox = container.querySelector('.cropper-drag-box');
        const cropperCropBox = container.querySelector('.cropper-crop-box');
        const cropperViewBox = container.querySelector('.cropper-view-box');

        if (cropperContainer) {
          // Make cropper container overlay the image perfectly
          cropperContainer.style.cssText += `
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100% !important;
            max-height: none !important;
            z-index: 10 !important;
            pointer-events: auto !important;
          `;
        }

        // Completely hide the cropper canvas to show the original image behind
        if (cropperCanvas) {
          cropperCanvas.style.cssText += `
            opacity: 0 !important;
            visibility: hidden !important;
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            max-width: 100% !important;
            max-height: 100% !important;
            pointer-events: none !important;
            z-index: -1 !important;
          `;
        }

        // Also hide any img elements inside the cropper container
        const cropperImages = cropperContainer.querySelectorAll('img');
        cropperImages.forEach(img => {
          if (img.id !== 'uploaded-image') {
            img.style.cssText += `
              opacity: 0 !important;
              visibility: hidden !important;
              pointer-events: none !important;
              z-index: -1 !important;
            `;
          }
        });

        if (cropperDragBox) {
          cropperDragBox.style.zIndex = '11';
        }

        if (cropperCropBox) {
          cropperCropBox.style.zIndex = '12';
        }

        if (cropperViewBox) {
          cropperViewBox.style.zIndex = '13';
        }

        // Ensure the parent container supports the overlay
        container.style.cssText += `
          position: relative !important;
          overflow: visible !important;
        `;

        // Set up observer to hide new cropper images (without watching style changes to avoid infinite loop)
        const hideObserver = new MutationObserver((mutations) => {
          mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const newImages = node.tagName === 'IMG' ? [node] : node.querySelectorAll('img');
                  newImages.forEach(img => {
                    if (img.id !== 'uploaded-image' && !img.dataset.hidden) {
                      img.dataset.hidden = 'true'; // Mark to prevent re-processing
                      img.style.cssText += `
                        opacity: 0 !important;
                        visibility: hidden !important;
                        pointer-events: none !important;
                        z-index: -1 !important;
                      `;
                    }
                  });
                }
              });
            }
          });
        });

        hideObserver.observe(cropperContainer, {
          childList: true,
          subtree: true
        });

        // Store observer for cleanup
        container._hideObserver = hideObserver;
      },
      crop(event) {
        // Handle real-time crop changes
        const data = event.detail;
        console.log('[Visual Search] 📏 Crop area changed:', data);

        // Trigger real-time analysis when user stops interacting
        clearTimeout(container._cropTimeout);
        container._cropTimeout = setTimeout(() => {
          performRealTimeCropAnalysis(container);
        }, 500);
      },
      cropend() {
        // Called when crop interaction ends
        console.log('[Visual Search] 🏁 Crop interaction ended');
        performRealTimeCropAnalysis(container);
      }
    });

    // Store cropper instance for cleanup
    container._cropper = cropper;

    console.log('[Visual Search] 🌱 Cropper.js crop box added successfully');
  }

  // setupCropBoxInteraction removed - cropper.js handles this automatically
  function setupCropBoxInteraction_REMOVED() {
    let isDragging = false;
    let isResizing = false;
    let activeHandle = null;
    let resizeType = null; // 'corner' or 'border'
    let startX, startY, startLeft, startTop, startWidth, startHeight;

    function getEventXY(e) {
      if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else {
        return { x: e.clientX, y: e.clientY };
      }
    }

    function constrainToImage(left, top, width, height) {
      const bounds = cropBox._imageBounds;
      const minSize = cropBox._minCropSize || 50;
      
      // Get handle dimensions for proper boundary calculation
      const handleOffset = cropBox._handleOffset || 6;
      const handleSize = cropBox._handleSize || 12;
      const handleMargin = handleOffset + (handleSize / 2);
      
      // Create effective bounds that account for handle overflow
      const effectiveBounds = {
        left: bounds.left + handleMargin,
        top: bounds.top + handleMargin,
        right: bounds.right - handleMargin,
        bottom: bounds.bottom - handleMargin
      };
      
      // Constrain size first with minimum size and available space
      const maxWidth = effectiveBounds.right - effectiveBounds.left;
      const maxHeight = effectiveBounds.bottom - effectiveBounds.top;
      width = Math.max(minSize, Math.min(width, maxWidth));
      height = Math.max(minSize, Math.min(height, maxHeight));
      
      // Constrain position to keep crop box within effective bounds
      left = Math.max(effectiveBounds.left, Math.min(left, effectiveBounds.right - width));
      top = Math.max(effectiveBounds.top, Math.min(top, effectiveBounds.bottom - height));
      
      // Double-check that the position + size doesn't exceed boundaries
      if (left + width > effectiveBounds.right) {
        left = effectiveBounds.right - width;
      }
      if (top + height > effectiveBounds.bottom) {
        top = effectiveBounds.bottom - height;
      }
      
      // Final safety check to ensure we're within effective bounds
      left = Math.max(effectiveBounds.left, left);
      top = Math.max(effectiveBounds.top, top);
      
      return { left, top, width, height };
    }

    function startDrag(e) {
      console.log('[Visual Search] 🎯 Start drag triggered');
      // Don't start drag if clicking on resize handles
      if (e.target.classList.contains('resize-handle') || 
          e.target.closest('.resize-handle')) {
        return;
      }
      
      isDragging = true;
      const { x, y } = getEventXY(e);
      startX = x;
      startY = y;
      startLeft = parseInt(cropBox.style.left);
      startTop = parseInt(cropBox.style.top);
      
      // Add visual feedback for dragging
      cropBox.style.cssText += STYLES.cropBoxActive;
      cropBox.style.cursor = 'grabbing';
      container.style.cursor = 'grabbing';
      
      // Prevent text selection and other interactions
      e.preventDefault();
      e.stopPropagation();
    }

    function startResize(e) {
      isResizing = true;
      resizeType = e.target.dataset.type;
      
      if (resizeType === 'corner') {
        activeHandle = e.target.dataset.position;
      } else if (resizeType === 'border') {
        activeHandle = e.target.dataset.side;
      }
      
      const { x, y } = getEventXY(e);
      startX = x;
      startY = y;
      startLeft = parseInt(cropBox.style.left);
      startTop = parseInt(cropBox.style.top);
      startWidth = parseInt(window.getComputedStyle(cropBox).width, 10);
      startHeight = parseInt(window.getComputedStyle(cropBox).height, 10);
      
      // Visual feedback
      if (resizeType === 'corner') {
        // Corner handle visual feedback will be handled by CSS hover
      } else if (resizeType === 'border') {
        const indicator = e.target.querySelector('div');
        if (indicator) {
          indicator.style.background = 'rgba(230, 0, 35, 0.8)';
          indicator.style.borderColor = 'rgba(255, 255, 255, 1)';
          indicator.style.boxShadow = '0 2px 8px rgba(230, 0, 35, 0.3)';
          indicator.style.transform = indicator.style.transform.replace('scale(1)', 'scale(1.1)');
        }
      }
      
      container.style.cursor = e.target.style.cursor;
      e.preventDefault();
      e.stopPropagation();
    }

    function onMove(e) {
      const { x, y } = getEventXY(e);
      
      if (isDragging) {
        const dx = x - startX;
        const dy = y - startY;
        const newLeft = startLeft + dx;
        const newTop = startTop + dy;
        const currentWidth = parseInt(cropBox.style.width);
        const currentHeight = parseInt(cropBox.style.height);
        
        const constrained = constrainToImage(newLeft, newTop, currentWidth, currentHeight);
        
        // Use transform for smoother movement during drag
        cropBox.style.transform = `translate(${constrained.left - startLeft}px, ${constrained.top - startTop}px)`;
        
        // Update actual position
        cropBox.style.left = constrained.left + 'px';
        cropBox.style.top = constrained.top + 'px';
        
      } else if (isResizing && activeHandle) {
        const dx = x - startX;
        const dy = y - startY;
        let newLeft = startLeft;
        let newTop = startTop;
        let newWidth = startWidth;
        let newHeight = startHeight;
        
        if (resizeType === 'corner') {
          // Corner resize - handle all 4 corners
          if (activeHandle === 'nw') {
            newLeft = startLeft + dx;
            newTop = startTop + dy;
            newWidth = startWidth - dx;
            newHeight = startHeight - dy;
          } else if (activeHandle === 'ne') {
            newTop = startTop + dy;
            newWidth = startWidth + dx;
            newHeight = startHeight - dy;
          } else if (activeHandle === 'sw') {
            newLeft = startLeft + dx;
            newWidth = startWidth - dx;
            newHeight = startHeight + dy;
          } else if (activeHandle === 'se') {
            newWidth = startWidth + dx;
            newHeight = startHeight + dy;
          }
        } else if (resizeType === 'border') {
          // Border resize - handle horizontal and vertical
          if (activeHandle === 'top') {
            newTop = startTop + dy;
            newHeight = startHeight - dy;
          } else if (activeHandle === 'bottom') {
            newHeight = startHeight + dy;
          } else if (activeHandle === 'left') {
            newLeft = startLeft + dx;
            newWidth = startWidth - dx;
          } else if (activeHandle === 'right') {
            newWidth = startWidth + dx;
          }
        }
        
        const constrained = constrainToImage(newLeft, newTop, newWidth, newHeight);
        cropBox.style.left = constrained.left + 'px';
        cropBox.style.top = constrained.top + 'px';
        cropBox.style.width = constrained.width + 'px';
        cropBox.style.height = constrained.height + 'px';
      }
      
      if (isDragging || isResizing) {
        e.preventDefault();
      }
    }

    function endAction() {
      console.log('[Visual Search] 🎯 End action triggered, isDragging:', isDragging, 'isResizing:', isResizing);
      if (isDragging) {
        // Clean up drag styling
        cropBox.style.cssText = cropBox.style.cssText.replace(STYLES.cropBoxActive, '');
        cropBox.style.cursor = 'grab';
        cropBox.style.transform = ''; // Remove transform after drag
        container.style.cursor = '';
        
        // 🚀 IMMEDIATE API CALL: Call API right away when user drags crop box
        console.log('[Visual Search] 🎯 User finished dragging - calling immediate API');
        console.log('[Visual Search] 🎯 About to call performRealTimeCropAnalysis with container:', container);
        performRealTimeCropAnalysis(container);
      }
      if (isResizing) {
        // Reset visual feedback for all handles
        const handles = cropBox.querySelectorAll('.resize-handle');
        handles.forEach(handle => {
          if (handle.classList.contains('resize-handle-border')) {
            // Reset border handle styles
            const indicator = handle.querySelector('div');
            if (indicator) {
              indicator.style.background = 'rgba(248, 248, 248, 0.8)';
              indicator.style.borderColor = 'rgba(255, 255, 255, 0.9)';
              indicator.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              indicator.style.transform = indicator.style.transform.replace('scale(1.1)', 'scale(1)');
            }
          }
        });
        container.style.cursor = '';
        
        // 🚀 IMMEDIATE API CALL: Call API right away when user resizes crop box
        console.log('[Visual Search] 🎯 User finished resizing - calling immediate API');
        performRealTimeCropAnalysis(container);
      }
      
      isDragging = false;
      isResizing = false;
      activeHandle = null;
      resizeType = null;
    }

    // Event Listeners (Mouse + Touch)
    cropBox.addEventListener('mousedown', startDrag);
    cropBox.addEventListener('touchstart', startDrag, { passive: false });

    // Add event listeners to all resize handles
    const resizeHandles = cropBox.querySelectorAll('.resize-handle');
    resizeHandles.forEach(handle => {
      handle.addEventListener('mousedown', startResize);
      handle.addEventListener('touchstart', startResize, { passive: false });
    });

    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });

    document.addEventListener('mouseup', endAction);
    document.addEventListener('touchend', endAction);
    
    // Store cleanup function
    cropBox._cleanup = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('mouseup', endAction);
      document.removeEventListener('touchend', endAction);
    };
  }

  function getCropData(drawer) {
    const container = drawer.querySelector('#image-selection-container');
    const img = drawer.querySelector('#uploaded-image');

    if (!container || !img || !container._cropper) {
      console.warn('[Visual Search] ⚠️ No cropper instance found');
      return null;
    }

    try {
      // Get crop data from cropper.js
      const cropData = container._cropper.getData();
      const canvasData = container._cropper.getCanvasData();
      const imageData = container._cropper.getImageData();

      console.log('[Visual Search] 📏 Cropper.js crop data:', cropData);
      console.log('[Visual Search] 🖼️ Canvas data:', canvasData);
      console.log('[Visual Search] 🖌️ Image data:', imageData);

      // Convert to normalized coordinates (0-1 scale) relative to actual image
      const relativeX = cropData.x / imageData.naturalWidth;
      const relativeY = cropData.y / imageData.naturalHeight;
      const relativeWidth = cropData.width / imageData.naturalWidth;
      const relativeHeight = cropData.height / imageData.naturalHeight;

      return {
        x: Math.max(0, Math.min(1, relativeX)),
        y: Math.max(0, Math.min(1, relativeY)),
        width: Math.max(0, Math.min(1, relativeWidth)),
        height: Math.max(0, Math.min(1, relativeHeight))
      };
    } catch (error) {
      console.error('[Visual Search] ❌ Error getting crop data:', error);
      return null;
    }
  }

  async function performCroppedImageSearch(drawer, searchInput, cropData) {
    try {
      updateResultsHeader(drawer, 'Analyzing cropped area...', 'Detecting items in the selected area...');
      clearResults(drawer);
      showSkeletonLoaders(drawer);

      // Get the cropped image binary from cropper
      const container = drawer.querySelector('#image-selection-container');
      if (!container || !container._cropper) {
        console.error('[Visual Search] ❌ No cropper found for extracting cropped image');
        return;
      }

      // Extract cropped image as blob
      const croppedCanvas = container._cropper.getCroppedCanvas();
      if (!croppedCanvas) {
        console.error('[Visual Search] ❌ Failed to get cropped canvas');
        return;
      }

      // Convert canvas to blob
      const croppedBlob = await new Promise(resolve => {
        croppedCanvas.toBlob(resolve, 'image/jpeg', 0.9);
      });

      const formData = new FormData();
      formData.append('file', croppedBlob, 'cropped-image.jpg');
      formData.append('crop', 'true');
      
      console.log('[Visual Search] Sending cropped analysis request to:', CONFIG.EXTERNAL_API_URL);
      console.log('[Visual Search] Crop data:', cropData);
      console.log('[Visual Search] Shop domain:', CONFIG.SHOP_DOMAIN);

      const response = await fetch(CONFIG.EXTERNAL_API_URL, {
        method: 'POST',
        headers: {
          'shopDomainURL': CONFIG.SHOP_DOMAIN
        },
        body: formData,
      });
      
      console.log('[Visual Search] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Visual Search] Server error response:', errorText);

        // Handle authentication errors specifically
        if (response.status === 401) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.code === 'SHOP_NOT_AUTHENTICATED' || errorData.code === 'SESSION_EXPIRED') {
              showError('App authentication expired. Please contact the store owner to reinstall the app.');
              updateResultsHeader(drawer, 'Authentication Required', 'The app needs to be reinstalled by the store owner');
              removeSkeletonLoaders(drawer);
              return;
            }
          } catch (e) {
            // If parsing fails, fall through to generic error
          }
        }

        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      console.log('[Visual Search] Cropped Analysis API Response:', result);
      
      // Handle the API response similar to regular analysis
      if (result && (result.products || result.detectedItems || result.length > 0)) {
        let detectedItems = [];
        
        if (Array.isArray(result)) {
          detectedItems = result.map((item, index) => ({
            id: item.productId || item.id || index,
            image: item.image || item.imageUrl || (item.images && item.images[0] && item.images[0].url),
            name: item.name || item.title || `Item ${index + 1}`,
            confidence: item.confidence || 0.9,
            price: item.price,
            currency: item.currency || 'USD',
            handle: item.handle,
            available: item.available,
            vendor: item.vendor,
            description: item.description,
            variants: item.variants,
            url: item.url
          }));
        } else if (result.detectedItems) {
          detectedItems = result.detectedItems;
        } else if (result.products) {
          detectedItems = result.products.map((item, index) => ({
            id: item.productId || item.id || index,
            image: item.image || item.imageUrl || (item.images && item.images[0] && item.images[0].url),
            name: item.name || item.title || `Item ${index + 1}`,
            confidence: item.confidence || 0.9,
            price: item.price,
            currency: item.currency || 'USD',
            handle: item.handle,
            available: item.available,
            vendor: item.vendor,
            description: item.description,
            variants: item.variants,
            url: item.url
          }));
        }
        
        if (detectedItems.length > 0) {
          console.log(`[Visual Search] ✅ Found ${detectedItems.length} items in cropped area`);
          
          // Update UI with cropped area results
          updateResultsHeader(drawer, `Found ${detectedItems.length} items`, `Items detected in your selected area`);
          removeSkeletonLoaders(drawer);
          
          // Show the detected items directly as results
          displayAllResults(drawer, detectedItems);
          
          // Store the results
          drawer._detectedItems = detectedItems;
          
          // Show success notification
          showSuccess(`Found ${detectedItems.length} items in the selected area!`);

        } else {
          showError('No items detected in the selected area. Try adjusting the crop area.');
          updateResultsHeader(drawer, 'No items detected', 'Try adjusting the crop area');
          removeSkeletonLoaders(drawer);
          const emptyState = drawer.querySelector('#empty-state');
          if (emptyState) {
            emptyState.style.display = 'flex';
          }
        }
      } else {
        showError(result.error || 'Could not analyze the selected area. Please try again.');
        updateResultsHeader(drawer, 'Analysis failed', 'Could not detect items in the selected area');
        removeSkeletonLoaders(drawer);
        const emptyState = drawer.querySelector('#empty-state');
        if (emptyState) {
          emptyState.style.display = 'flex';
        }
      }
    } catch (error) {
      console.error('Cropped visual search error:', error);
      showError('Something went wrong. Please try again.');
      updateResultsHeader(drawer, 'Search failed', 'Something went wrong during analysis');
      removeSkeletonLoaders(drawer);
      const emptyState = drawer.querySelector('#empty-state');
      if (emptyState) {
        emptyState.style.display = 'flex';
      }
    }
  }

  function showUploadSection(drawer) {
    // Clean up cropper if it exists
    const container = drawer.querySelector('#image-selection-container');
    if (container && container._cropper) {
      container._cropper.destroy();
      container._cropper = null;
    }

    // Clean up hide observer
    if (container && container._hideObserver) {
      container._hideObserver.disconnect();
      container._hideObserver = null;
    }
    
    // Show upload section, hide preview
    drawer.querySelector('#upload-section').style.display = 'block';
    drawer.querySelector('#image-preview-section').style.display = 'none';
    
    // Reset data
    drawer._imageFile = null;
    drawer._detectedItems = null;
    drawer._selectedItems = [];
    
    // Reset results and show empty state
    updateResultsHeader(drawer, 'Ready to search', 'Upload an image to start searching');
    clearResults(drawer);
    
    // Show empty state again
    const emptyState = drawer.querySelector('#empty-state');
    if (emptyState) {
      emptyState.style.display = 'flex';
    }
  }

  function updateResultsHeader(drawer, title, description) {
    drawer.querySelector('#results-title').textContent = title;
    drawer.querySelector('#results-count').textContent = description;
  }

  function clearResults(drawer) {
    const resultsGrid = drawer.querySelector('#results-grid');
    resultsGrid.innerHTML = '';
  }

  function showSkeletonLoaders(drawer) {
    const resultsGrid = drawer.querySelector('#results-grid');
    const emptyState = drawer.querySelector('#empty-state');
    
    // Hide empty state while loading
    if (emptyState) {
      emptyState.style.display = 'none';
    }
    
    // Add skeleton cards for first two rows
    // Mobile: 2 columns, Desktop: up to 5 columns (responsive)
    const skeletonCount = window.innerWidth <= 768 ? 4 : 6; // 2 rows on mobile, 1.2 rows on desktop
    
    for (let i = 0; i < skeletonCount; i++) {
      const skeletonCard = createSkeletonCard();
      resultsGrid.appendChild(skeletonCard);
    }
  }

  function removeSkeletonLoaders(drawer) {
    const resultsGrid = drawer.querySelector('#results-grid');
    const skeletonCards = resultsGrid.querySelectorAll('.skeleton-card');
    skeletonCards.forEach(card => card.remove());
  }

  function showSearchResults(drawer, products, searchType, searchInput) {
    // Store data for infinite scroll
    drawer._allProducts = products;
    drawer._currentPage = 0;
    drawer._itemsPerPage = 20;
    drawer._searchInput = searchInput;

    // Track search results viewed
    trackAnalyticsEvent('viewed', {
      actionType: 'search-results-viewed',
      searchType: searchType,
      resultsCount: products.length,
      itemsPerPage: drawer._itemsPerPage
    });

    // Display all results directly (no filtering)
    displayAllResults(drawer, products);

    // Setup infinite scroll for results container
    setupInfiniteScroll(drawer);
  }

  function displayAllResults(drawer, products) {
    const resultsGrid = drawer.querySelector('#results-grid');
    const emptyState = drawer.querySelector('#empty-state');
    
    // Remove skeleton loaders first
    removeSkeletonLoaders(drawer);
    
    // Hide empty state when we have results
    if (emptyState) {
      emptyState.style.display = 'none';
    }
    
    // Update header
    updateResultsHeader(drawer, 'Search results', `Found ${products.length} similar products`);
    
    // Display first 20 products initially
    const initialProducts = products.slice(0, drawer._itemsPerPage);
    initialProducts.forEach(product => {
        const productCard = createProductCard(product);
        resultsGrid.appendChild(productCard);
    });
  }



  function setupInfiniteScroll(drawer) {
    const resultsContainer = drawer.querySelector('#results-container');
    const loadingIndicator = drawer.querySelector('#loading-more');
    
    // Remove existing scroll listener
    if (drawer._scrollListener) {
      resultsContainer.removeEventListener('scroll', drawer._scrollListener);
    }
    
    drawer._scrollListener = () => {
      const scrollTop = resultsContainer.scrollTop;
      const scrollHeight = resultsContainer.scrollHeight;
      const clientHeight = resultsContainer.clientHeight;
      
      // Load more when near bottom
      if (scrollTop + clientHeight >= scrollHeight - 100 && 
          drawer._allProducts && 
          drawer._currentPage * drawer._itemsPerPage < drawer._allProducts.length) {
        
        if (loadingIndicator.style.display !== 'block') {
          loadingIndicator.style.display = 'block';
          
          // Simulate loading delay
          setTimeout(() => {
            loadNextPage(drawer);
          }, 500);
        }
      }
    };
    
    resultsContainer.addEventListener('scroll', drawer._scrollListener);
  }

  function loadNextPage(drawer) {
    const nextPage = drawer._currentPage + 1;
    const startIndex = nextPage * drawer._itemsPerPage;
    const endIndex = startIndex + drawer._itemsPerPage;
    const pageProducts = drawer._allProducts.slice(startIndex, endIndex);
    
    const resultsGrid = drawer.querySelector('#results-grid');
    
    pageProducts.forEach(product => {
      const productCard = createProductCard(product);
      resultsGrid.appendChild(productCard);
    });
    
    drawer._currentPage = nextPage;
    
    // Hide loading indicator
    drawer.querySelector('#loading-more').style.display = 'none';
    
    // Update results count
    const displayedCount = Math.min((nextPage + 1) * drawer._itemsPerPage, drawer._allProducts.length);
    updateResultsHeader(drawer, 'Search results', `Showing ${displayedCount} of ${drawer._allProducts.length} products`);
  }

  function setupResultsHandlers(_drawer, _searchInput) {
    // Results section is now always visible in the right panel
    // No need for back navigation in the new layout
  }

  function createProductCard(product) {
    const card = document.createElement('div');
    card.style.cssText = `
      background: white;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e9e9e9;
      transition: all 0.2s ease;
      position: relative;
    `;
    
    const productImage = product.image || (product.images && product.images[0] && product.images[0].url) || '';
    const productPrice = product.price ? `${product.currency || 'USD'} ${product.price}` : '';
    const productTitle = product.name || product.title || 'Untitled Product';
    const isAvailable = product.available !== false;
    
    card.innerHTML = `
      <div style="
        aspect-ratio: 1;
        background: #f7f7f7;
        position: relative;
        overflow: hidden;
      ">
        <img src="${productImage}" alt="${productTitle}" style="
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.2s ease;
        " onload="this.parentElement.style.background='transparent'"
           onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMiA4VjE2TTggMTJIMTYiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+Cg=='">
        
        
        <!-- Camera overlay icon for search by image -->
        <div class="camera-overlay" style="
          position: absolute;
          top: 8px;
          left: 8px;
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.3s ease;
          z-index: 10;
          pointer-events: none;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        " title="Search with this image">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#333" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));">
            <!-- Camera body -->
            <path d="M9 2l.75 3h4.5L15 2z" fill="currentColor" opacity="0.8"/>
            <rect x="2" y="6" width="20" height="12" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="1.8"/>
            <rect x="3" y="7" width="18" height="10" rx="1" ry="1" fill="currentColor" opacity="0.1"/>
            
            <!-- Camera lens -->
            <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
            <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.3"/>
            
            <!-- Flash/viewfinder -->
            <circle cx="17" cy="9" r="0.8" fill="currentColor"/>
          </svg>
        </div>
      </div>
      
      <!-- Product Information -->
      <div class="visual-search-product-info" style="
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      ">
        <div class="visual-search-product-title" style="
          font-size: 14px;
          font-weight: 500;
          line-height: 1.3;
          color: #111111;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">${productTitle}</div>
        
        ${product.vendor ? `
          <div style="
            font-size: 12px;
            color: #666666;
            font-weight: 400;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          ">${product.vendor}</div>
        ` : ''}
        
        <div class="visual-search-product-price" style="
          font-size: 14px;
          font-weight: 600;
          color: ${isAvailable ? '#1a73e8' : '#666666'};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          ${!isAvailable ? 'text-decoration: line-through;' : ''}
        ">${productPrice}</div>
        
        <!-- Product Action Button -->
        <button class="product-action-btn" style="
          width: 100%;
          padding: 8px 12px;
          margin-top: 8px;
          background: ${isAvailable ? '#000000' : '#000000'};
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: ${isAvailable ? 'pointer' : 'default'};
          opacity: ${isAvailable ? '1' : '0.5'};
          transition: all 0.2s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          ${!isAvailable ? 'pointer-events: none;' : ''}
        " ${isAvailable ? '' : 'disabled'}>
          ${isAvailable ? 'View Product' : 'Out of Stock'}
        </button>
      </div>
    `;
    
    // Add hover effects
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
      const img = card.querySelector('img');
      const cameraOverlay = card.querySelector('.camera-overlay');
      
      img.style.transform = 'scale(1.05)';
      
      // Show camera overlay
      cameraOverlay.style.opacity = '1';
      cameraOverlay.style.transform = 'scale(1)';
      cameraOverlay.style.pointerEvents = 'auto';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'none';
      const img = card.querySelector('img');
      const cameraOverlay = card.querySelector('.camera-overlay');
      
      img.style.transform = 'scale(1)';
      
      // Hide camera overlay
      cameraOverlay.style.opacity = '0';
      cameraOverlay.style.transform = 'scale(0.8)';
      cameraOverlay.style.pointerEvents = 'none';
    });

    // Add click handler specifically for the camera overlay icon
    const cameraOverlay = card.querySelector('.camera-overlay');
    cameraOverlay.addEventListener('click', (e) => {
      // Prevent event bubbling to avoid triggering any parent click handlers
      e.preventDefault();
      e.stopPropagation();
      
      console.log('[Visual Search] 📷 Camera icon clicked for search by image');
      
      // Check if we're in a drawer context
      const drawer = card.closest('.visual-search-drawer');
      if (drawer) {
        // Try to find the drawer content with search input data
        let drawerContent = null;
        let searchInput = null;
        
        // Method 1: Try to find data on drawer overlay (most reliable)
        if (drawer._searchInput) {
          searchInput = drawer._searchInput;
          drawerContent = drawer.querySelector('#modal-content') || drawer.querySelector('.visual-search-modal-content');
          console.log('[Visual Search] ✅ Found searchInput on drawer overlay');
        }
        
        // Method 2: Try to find data on main drawer div
        if (!searchInput) {
          const mainDrawer = drawer.querySelector('div[style*="background: white"]');
          if (mainDrawer && mainDrawer._searchInput) {
            searchInput = mainDrawer._searchInput;
            drawerContent = mainDrawer.querySelector('#modal-content') || mainDrawer;
            console.log('[Visual Search] ✅ Found searchInput on main drawer div');
          }
        }
        
        // Method 3: Try to find data on modal content
        if (!searchInput) {
          const modalContent = drawer.querySelector('#modal-content');
          if (modalContent && modalContent._searchInput) {
            searchInput = modalContent._searchInput;
            drawerContent = modalContent;
            console.log('[Visual Search] ✅ Found searchInput on modal content');
          }
        }
        
        // Method 4: Try to find data on image selection container
        if (!searchInput) {
          const imageContainer = drawer.querySelector('#image-selection-container');
          if (imageContainer && imageContainer._searchInput) {
            searchInput = imageContainer._searchInput;
            drawerContent = drawer.querySelector('#modal-content') || drawer.querySelector('.visual-search-modal-content');
            console.log('[Visual Search] ✅ Found searchInput on image container');
          }
        }
        
        // Method 5: Try to find any div with search input data
        if (!searchInput) {
          const allDivs = drawer.querySelectorAll('div');
          for (const div of allDivs) {
            if (div._searchInput) {
              searchInput = div._searchInput;
              drawerContent = div;
              console.log('[Visual Search] ✅ Found searchInput on div element');
              break;
            }
          }
        }
        
        // Method 6: Try global scope as fallback
        if (!searchInput && window.visualSearchCurrentInput) {
          searchInput = window.visualSearchCurrentInput;
          drawerContent = drawer.querySelector('#modal-content') || drawer.querySelector('.visual-search-modal-content');
          console.log('[Visual Search] ✅ Found searchInput from global scope');
        }
        
        // Method 7: Try backup global scope
        if (!searchInput && window.visualSearchCurrentSearchInput) {
          searchInput = window.visualSearchCurrentSearchInput;
          drawerContent = drawer.querySelector('#modal-content') || drawer.querySelector('.visual-search-modal-content');
          console.log('[Visual Search] ✅ Found searchInput from backup global scope');
        }
        
        // Method 8: Create fallback if still not found
        if (!searchInput) {
          searchInput = createFallbackSearchInput();
          drawerContent = drawer.querySelector('#modal-content') || drawer.querySelector('.visual-search-modal-content');
          console.log('[Visual Search] ⚠️ Created fallback searchInput for camera icon click');
        }
        
        console.log('[Visual Search] 🔍 Search input found:', !!searchInput);
        console.log('[Visual Search] 🔍 Drawer content found:', !!drawerContent);
        console.log('[Visual Search] 📸 Product image URL:', product.image);
        
        if (searchInput && drawerContent) {
          // Use the result image for a new search
          searchByResultImage(product.image, searchInput, drawerContent);
        } else {
          console.log('[Visual Search] ❌ Could not find search input or drawer content for search by image');
          showError('Could not start new search. Please try again.');
        }
      }
    });
    
    // Add click handler to navigate to product page
    card.addEventListener('click', (e) => {
      // Don't trigger if camera overlay was clicked
      if (e.target.closest('.camera-overlay')) {
        return;
      }
      
      // Don't trigger if button was clicked - button will handle its own navigation
      if (e.target.closest('.product-action-btn')) {
        return;
      }
      
      // Navigate to product page with variant support
      let productUrl;
      
      if (product.selectedVariant) {
        // This is a variant product - redirect with variant parameter
        const variantId = product.selectedVariant.id.split('/').pop(); // Extract ID from GID
        const baseUrl = product.handle ? 
          `/products/${product.handle}` : 
          `https://${CONFIG.SHOP_DOMAIN}/products/${product.id}`;
        productUrl = `${baseUrl}?variant=${variantId}`;
        console.log('[Visual Search] 🔗 Variant card clicked, navigating to variant:', productUrl);
      } else {
        // Regular product - redirect to product page
        productUrl = product.handle ? 
          `/products/${product.handle}` : 
          `https://${CONFIG.SHOP_DOMAIN}/products/${product.id}`;
        console.log('[Visual Search] 🔗 Navigating to product:', productUrl);
      }
      
      // Track product click
      trackAnalyticsEvent('used', {
        actionType: 'product-click',
        productId: product.id,
        productHandle: product.handle,
        productTitle: product.title,
        clickType: product.selectedVariant ? 'variant-click' : 'product-click'
      });
      
      // Open product page
      window.open(productUrl, '_blank');
    });

    // Add specific click handler for the product action button
    const productButton = card.querySelector('.product-action-btn');
    if (productButton && isAvailable) {
      productButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Navigate to product page with variant support
        let productUrl;
        
        if (product.selectedVariant) {
          // This is a variant product - redirect with variant parameter
          const variantId = product.selectedVariant.id.split('/').pop(); // Extract ID from GID
          const baseUrl = product.handle ? 
            `/products/${product.handle}` : 
            `https://${CONFIG.SHOP_DOMAIN}/products/${product.id}`;
          productUrl = `${baseUrl}?variant=${variantId}`;
          console.log('[Visual Search] 🛍️ Variant product button clicked, redirecting to variant:', productUrl);
        } else {
          // Regular product - redirect to product page
          productUrl = product.handle ? 
            `/products/${product.handle}` : 
            `https://${CONFIG.SHOP_DOMAIN}/products/${product.id}`;
          console.log('[Visual Search] 🛍️ Product button clicked, navigating to:', productUrl);
        }
        
        // Track button click (if analytics enabled)
        if (CONFIG.ANALYTICS_ENABLED) {
          // Analytics tracking could be added here
        }
        
        // Open product page
        window.open(productUrl, '_blank');
      });

      // Add hover effect to available buttons
      productButton.addEventListener('mouseenter', () => {
        productButton.style.background = '#333333';
      });

      productButton.addEventListener('mouseleave', () => {
        productButton.style.background = '#000000';
      });
    }
    
    // Add keyboard accessibility
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View product: ${productTitle}${productPrice ? ` - ${productPrice}` : ''}`);
    
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
    
    return card;
  }
  
  function createSkeletonCard() {
    const skeletonCard = document.createElement('div');
    skeletonCard.className = 'skeleton-card';
    skeletonCard.style.cssText = STYLES.productSkeleton;
    
    skeletonCard.innerHTML = `
      <div style="
        aspect-ratio: 1;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: visual-search-skeleton-pulse 1.5s ease-in-out infinite;
        object-fit: cover;
        border-radius: 12px 12px 0 0;
        display: block;
      "></div>
      <div style="padding: 12px;">
        <div style="
          height: 14px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: visual-search-skeleton-pulse 1.5s ease-in-out infinite;
          border-radius: 4px;
          margin-bottom: 6px;
        "></div>
        <div style="
          height: 12px;
          width: 60%;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: visual-search-skeleton-pulse 1.5s ease-in-out infinite;
          border-radius: 4px;
        "></div>
      </div>
    `;
    
    return skeletonCard;
  }
  
  // ====================================================================
  // SEARCH BY RESULT IMAGE
  // ====================================================================
  
  // Helper function to create a fallback search input
  function createFallbackSearchInput() {
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
  
  async function searchByResultImage(imageUrl, searchInput, drawer) {
    try {
      console.log('[Visual Search] 🖼️ Starting search by result image');
      console.log('[Visual Search] 📸 Image URL:', imageUrl);
      console.log('[Visual Search] 🔍 Search input exists:', !!searchInput);
      console.log('[Visual Search] 📦 Drawer exists:', !!drawer);

      // Show feedback to user
      showNotification('Using this image for new search...', 'info');

      // Create a fake file object for the result image
      const fakeFile = {
        name: 'result-image.jpg',
        type: 'image/jpeg',
        size: 0,
        _imageUrl: imageUrl
      };

      // Update the uploaded image display (this handles everything)
      showImagePreview(drawer, fakeFile, searchInput);

      // 🚀 TRIGGER API CALL - Call backend to search with the new image
      await performImmediateImageAnalysis(drawer, fakeFile, searchInput);

      showSuccess('Searching with selected image...');

    } catch (error) {
      console.error('Search by result image error:', error);
      showError('Could not use this image for search. Please try again.');
    }
  }

  // ====================================================================
  // URL INPUT DIALOG
  // ====================================================================
  
  function openUrlInputDialog(searchInput, drawer) {
    const urlDialog = document.createElement('div');
    urlDialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      z-index: 1000000 !important;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 300ms ease;
    `;

    const dialogContent = document.createElement('div');
    dialogContent.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
      transform: scale(0.9);
      transition: transform 300ms ease;
    `;

    dialogContent.innerHTML = `
      <h3 style="
        margin: 0 0 16px;
        color: #111111;
        font-size: 18px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">Add image URL</h3>
      
      <input type="url" id="image-url-input" placeholder="Paste image URL here..." style="
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e9e9e9;
        border-radius: 12px;
        font-size: 14px;
        margin-bottom: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-sizing: border-box;
      ">
      
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="cancel-url" style="
          padding: 8px 16px;
          border: 1px solid #e9e9e9;
          border-radius: 8px;
          background: white;
          color: #5f5f5f;
          font-size: 14px;
          cursor: pointer;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">Cancel</button>
        
        <button id="submit-url" style="
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          background: #e60023;
          color: white;
          font-size: 14px;
          cursor: pointer;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">Search</button>
      </div>
    `;

    urlDialog.appendChild(dialogContent);
    document.body.appendChild(urlDialog);

    // Animate in
    requestAnimationFrame(() => {
      urlDialog.style.opacity = '1';
      dialogContent.style.transform = 'scale(1)';
    });

    // Focus input
    setTimeout(() => {
      dialogContent.querySelector('#image-url-input').focus();
    }, 100);

    // Close function
    const closeDialog = () => {
      urlDialog.style.opacity = '0';
      dialogContent.style.transform = 'scale(0.9)';
      setTimeout(() => {
        if (urlDialog.parentNode) {
          urlDialog.parentNode.removeChild(urlDialog);
        }
      }, 300);
    };

    // Event handlers
    dialogContent.querySelector('#cancel-url').addEventListener('click', closeDialog);
    
    dialogContent.querySelector('#submit-url').addEventListener('click', () => {
      const url = dialogContent.querySelector('#image-url-input').value.trim();
      if (url) {
        closeDialog();
        processImageFromUrlWithSelection(url, searchInput, drawer);
      }
    });

    dialogContent.querySelector('#image-url-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const url = e.target.value.trim();
        if (url) {
          closeDialog();
          processImageFromUrlWithSelection(url, searchInput, drawer);
        }
      } else if (e.key === 'Escape') {
        closeDialog();
      }
    });

    urlDialog.addEventListener('click', (e) => {
      if (e.target === urlDialog) closeDialog();
    });
  }

  async function processImageFromUrlWithSelection(url, searchInput, drawer) {
    try {
      updateResultsHeader(drawer, 'Loading image...', 'Processing image from URL...');
      
      // Create a fake file object for the URL image
      const fakeFile = {
        name: 'url-image.jpg',
        type: 'image/jpeg',
        size: 0,
        _imageUrl: url
      };
      
      // Show image preview immediately
      showImagePreview(drawer, fakeFile, searchInput);
      
      // 🚀 IMMEDIATE API CALL for URL-based images too
      performImmediateImageAnalysis(drawer, fakeFile, searchInput);
      
      // Update the image container to use URL instead of file reader
      const imageContainer = drawer.querySelector('#image-selection-container');
      imageContainer.innerHTML = `
        <img src="${url}" style="
          max-width: calc(100% - 20px);
          max-height: calc(100% - 20px);
          width: auto;
          height: auto;
          border-radius: 8px;
          object-fit: contain;
          display: block;
          margin: 0 auto;
          background: transparent;
        " id="uploaded-image" onload="
          this.parentElement.style.background='transparent';
        " onerror="
          this.parentElement.innerHTML='<div style=\\'color: #666; text-align: center; padding: 40px;\\'>Failed to load image from URL</div>';
        ">
      `;
      
    } catch (error) {
      console.error('Visual search error:', error);
      showError('Could not load image from URL. Please check the URL and try again.');
      updateResultsHeader(drawer, 'Failed to load image', 'Please check the URL and try again');
    }
  }

  // ====================================================================
  // FILE UPLOAD & PROCESSING
  // ====================================================================
  
  function validateFile(file) {
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      showError('Image too large. Please choose an image under 5MB.');
      return false;
    }
    
    if (!CONFIG.ACCEPTED_TYPES.includes(file.type)) {
      showError('Please select a valid image file (JPEG, PNG, WebP, GIF, HEIC, AVIF, BMP, TIFF, or SVG).');
      return false;
    }
    
    return true;
  }

  // ====================================================================
  // APP BLOCK CLEANUP SYSTEM
  // ====================================================================
  
  // Global cleanup function that can be called from anywhere
  let globalCleanupPerformed = false;
  
  function performGlobalCleanup() {
    if (globalCleanupPerformed) {
      console.log('[Visual Search] 🧹 Global cleanup already performed, skipping');
      return true;
    }
    
    console.log('[Visual Search] 🧹 Performing global cleanup - app block removed');
    globalCleanupPerformed = true;
    
    // Remove global styles
    const globalStyles = document.querySelector('#visual-search-global-styles');
    if (globalStyles) {
      globalStyles.remove();
      console.log('[Visual Search] ✅ Global styles removed');
    }
    
    // Close any open drawers
    const existingDrawers = document.querySelectorAll('.visual-search-drawer');
    existingDrawers.forEach(drawer => {
      drawer.remove();
      console.log('[Visual Search] ✅ Open drawer closed');
    });
    
    // Remove any overlays
    const overlays = document.querySelectorAll('.visual-search-overlay');
    overlays.forEach(overlay => {
      overlay.remove();
      console.log('[Visual Search] ✅ Overlay removed');
    });
    
    // Remove any injected icons (backup cleanup)
    const visualSearchIcons = document.querySelectorAll('.visual-search-icon');
    visualSearchIcons.forEach(icon => {
      icon.remove();
      console.log('[Visual Search] ✅ Injected icon removed');
    });
    
    // Clear global variables
    if (window.visualSearchCurrentInput) {
      delete window.visualSearchCurrentInput;
    }
    if (window.visualSearchCurrentSearchInput) {
      delete window.visualSearchCurrentSearchInput;
    }
    if (window.visualSearchUnified) {
      delete window.visualSearchUnified;
    }
    
    console.log('[Visual Search] ✅ Global cleanup completed successfully');
    return true;
  }
  

  function initializeCleanupSystem() {
    console.log('[Visual Search] 🧹 Starting enhanced cleanup monitoring system...');
    
    let cleanupAttempts = 0;
    const maxCleanupAttempts = 5; // Reduced for faster cleanup
    let monitoringInterval = null;
    let cleanupPerformed = false;
    
    function checkAppBlockPresence() {
      // Use centralized app block selectors
      const appBlockSelectors = CONFIG.APP_BLOCK_SELECTORS.ALL;
      
      let totalFound = 0;
      const detection = {};
      
      appBlockSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          detection[selector] = elements.length;
          totalFound += elements.length;
        } catch (e) {
          // Ignore selector errors
          detection[selector] = 0;
        }
      });
      
     
      
      return totalFound > 0;
    }
    
    function performCleanup() {
      if (cleanupPerformed) {
        console.log('[Visual Search] 🧹 Cleanup already performed, skipping');
        return true;
      }
      
      console.log('[Visual Search] 🧹 Performing cleanup - app block removed');
      cleanupPerformed = true;
      
      // Stop monitoring immediately
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
      }
      
      // Call the global cleanup function
      const success = performGlobalCleanup();
      
      // Set a flag to prevent re-initialization
      window.visualSearchCleanedUp = true;
      
      return success;
    }
    
    function monitorAppBlocks() {
      // Don't monitor if cleanup already performed
      if (cleanupPerformed || window.visualSearchCleanedUp) {
        return true;
      }
      
      const hasAppBlocks = checkAppBlockPresence();
      
      if (!hasAppBlocks) {
        cleanupAttempts++;
        console.log('[Visual Search] ⚠️ No app blocks found, attempt:', cleanupAttempts);
        
        // Trigger cleanup after just 2 consecutive checks (faster cleanup)
        if (cleanupAttempts >= 2) {
          console.log('[Visual Search] 🚨 Triggering cleanup after', cleanupAttempts, 'attempts');
          return performCleanup();
        }
      } else {
        // Reset cleanup attempts if app blocks are found
        cleanupAttempts = 0;
      }
      
      return false;
    }
    
    // Initial check with faster response
    if (!checkAppBlockPresence()) {
      console.log('[Visual Search] 🔍 No app blocks detected on initial load');
      cleanupAttempts = 1;
      
      // Quick followup check
      setTimeout(() => {
        if (!checkAppBlockPresence()) {
          console.log('[Visual Search] 🚨 Still no app blocks after 2 seconds - triggering cleanup');
          performCleanup();
        }
      }, 2000);
    }
    
    // Set up monitoring interval with faster frequency
    monitoringInterval = setInterval(() => {
      const shouldStop = monitorAppBlocks();
      
      if (shouldStop || cleanupAttempts >= maxCleanupAttempts) {
        if (monitoringInterval) {
          clearInterval(monitoringInterval);
          monitoringInterval = null;
        }
        console.log('[Visual Search] 🛑 Monitoring stopped');
      }
    }, 5000); // Check every 5 seconds for faster response
    
    // Enhanced MutationObserver for immediate detection
    if (typeof MutationObserver !== 'undefined') {
      const immediateObserver = new MutationObserver((mutations) => {
        let potentialRemoval = false;
        
        mutations.forEach((mutation) => {
          // Check if any nodes were removed
          if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
            mutation.removedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Check if removed node contained app blocks - using centralized selectors
                if (node.matches && (
                  node.matches(CONFIG.APP_BLOCK_SELECTORS.HEADER_BLOCK) ||
                  node.matches(CONFIG.APP_BLOCK_SELECTORS.FLOATING_BLOCK) ||
                  node.matches(CONFIG.APP_BLOCK_SELECTORS.INPUT_EMBED_ANY) ||
                  node.querySelector(CONFIG.APP_BLOCK_SELECTORS.HEADER_BLOCK) ||
                  node.querySelector(CONFIG.APP_BLOCK_SELECTORS.FLOATING_BLOCK) ||
                  node.querySelector(CONFIG.APP_BLOCK_SELECTORS.INPUT_EMBED_ANY)
                )) {
                  potentialRemoval = true;
                  console.log('[Visual Search] 🚨 Potential app block removal detected:', node);
                }
              }
            });
          }
          
          // Also check for attribute changes that might indicate app block changes
          if (mutation.type === 'attributes' && 
              (mutation.attributeName === 'data-visual-search-block' ||
               mutation.attributeName === 'data-vs-block-type')) {
            potentialRemoval = true;
            console.log('[Visual Search] 🚨 App block attribute change detected');
          }
        });
        
        if (potentialRemoval) {
          // Immediate check
          setTimeout(() => {
            console.log('[Visual Search] 🔍 Checking app block presence after potential removal...');
            if (!checkAppBlockPresence()) {
              console.log('[Visual Search] 🧹 Confirmed: App blocks removed - triggering immediate cleanup');
              performCleanup();
            } else {
              console.log('[Visual Search] ✅ App blocks still present after mutation');
            }
          }, 500); // Very quick response
          
          // Followup check
          setTimeout(() => {
            if (!cleanupPerformed && !checkAppBlockPresence()) {
              console.log('[Visual Search] 🧹 Followup: App blocks still missing - triggering cleanup');
              performCleanup();
            }
          }, 2000);
        }
      });
      
      // Observe the entire document with comprehensive options
      immediateObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
          'data-visual-search-block',
          'data-vs-block-type',
          'class'
        ]
      });
      
      console.log('[Visual Search] 👁️ Enhanced immediate cleanup detection active');
    }
    
    // Enhanced Shopify theme editor event handling
    const themeEditorEvents = [
      'shopify:section:load',
      'shopify:section:unload',
      'shopify:section:reorder',
      'shopify:section:select',
      'shopify:section:deselect',
      'shopify:block:select',
      'shopify:block:deselect',
      'shopify:block:load',
      'shopify:block:unload'
    ];
    
    themeEditorEvents.forEach(event => {
      document.addEventListener(event, (e) => {
        console.log('[Visual Search] 🎨 Shopify theme event detected:', event, e.detail);
        
        // Quick check after theme events
        setTimeout(() => {
          if (!cleanupPerformed && !checkAppBlockPresence()) {
            console.log('[Visual Search] 🧹 No app blocks after Shopify theme event - triggering cleanup');
            performCleanup();
          }
        }, 1000);
      });
    });
    
    // Page visibility change detection
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !cleanupPerformed) {
        setTimeout(() => {
          if (!checkAppBlockPresence()) {
            console.log('[Visual Search] 🧹 No app blocks after page became visible - checking for cleanup');
            cleanupAttempts++;
            if (cleanupAttempts >= 2) {
              performCleanup();
            }
          }
        }, 1000);
      }
    });
    
    // Window focus event (additional safety check)
    window.addEventListener('focus', () => {
      if (!cleanupPerformed) {
        setTimeout(() => {
          monitorAppBlocks();
        }, 500);
      }
    });
  }

  // ====================================================================
  // DETECTION SWITCHING AND CROPPING LOGIC
  // ====================================================================
  
  async function switchToDetection(drawer, detectionData) {
    try {
      console.log('[Visual Search] 🔄 Switching to detection:', detectionData);
      
      // Show loading state immediately when user clicks
      showLoadingState(drawer);
      
      // Update current selected detection
      drawer._currentSelectedDetection = parseInt(detectionData.boxId);
      
      // Move rectangle outline to new detection
      updateDetectionRectangle(drawer, detectionData.index);
      
      // Crop image to selected detection area
      const croppedImageFile = await cropImageToDetection(detectionData.bboxNormalized);
      
      if (croppedImageFile) {
        // Call API with cropped image (this also handles its own loading state)
        await performAnalysisWithCroppedImage(drawer, croppedImageFile);
      } else {
        // If cropping failed, hide loading state
        hideLoadingState(drawer);
        console.error('[Visual Search] ❌ Failed to crop image for selected detection');
      }
      
    } catch (error) {
      console.error('[Visual Search] ❌ Error switching detection:', error);
      hideLoadingState(drawer);
    }
  }
  
  async function cropImageToDetection(bboxNormalized) {
    try {
      if (!imageState.element) {
        console.error('[Visual Search] ❌ No image element found');
        return null;
      }
      
      // Create canvas for cropping
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Get original image dimensions
      const originalWidth = imageState.naturalWidth;
      const originalHeight = imageState.naturalHeight;
      
      // Convert normalized coordinates to pixel coordinates
      const x1 = Math.floor(bboxNormalized[0] * originalWidth);
      const y1 = Math.floor(bboxNormalized[1] * originalHeight);
      const x2 = Math.floor(bboxNormalized[2] * originalWidth);
      const y2 = Math.floor(bboxNormalized[3] * originalHeight);
      
      const cropWidth = x2 - x1;
      const cropHeight = y2 - y1;
      
      // Set canvas dimensions to crop size
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      
      console.log('[Visual Search] ✂️ Cropping image:', {
        originalDimensions: { width: originalWidth, height: originalHeight },
        bboxNormalized: bboxNormalized,
        pixelCoords: { x1, y1, x2, y2 },
        cropDimensions: { width: cropWidth, height: cropHeight }
      });
      
      // Draw cropped portion of image to canvas
      ctx.drawImage(
        imageState.element,
        x1, y1, cropWidth, cropHeight, // Source rectangle
        0, 0, cropWidth, cropHeight    // Destination rectangle
      );
      
      // Convert canvas to blob, then to file
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'cropped-detection.jpg', { type: 'image/jpeg' });
            console.log('[Visual Search] ✅ Cropped image created:', file.size, 'bytes');
            resolve(file);
          } else {
            console.error('[Visual Search] ❌ Failed to create cropped image blob');
            resolve(null);
          }
        }, 'image/jpeg', 0.9);
      });
      
    } catch (error) {
      console.error('[Visual Search] ❌ Error cropping image:', error);
      return null;
    }
  }
  
  function updateDetectionRectangle(drawer, newIndex) {
    // Remove existing rectangle
    const existingRectangle = drawer.querySelector('.detection-rectangle');
    if (existingRectangle) {
      existingRectangle.remove();
    }
    
    // Add rectangle to new detection (reuse the showSingleDetection logic for rectangle)
    const imageContainer = drawer.querySelector('#image-selection-container');
    const newDetectionData = drawer._allBoundingBox[newIndex];
    const bboxNormalized = Object.values(newDetectionData)[0];
    const boxId = Object.keys(newDetectionData)[0];
    
    // Find the label for this detection
    const labels = drawer._detectionLabels || [];
    const matchingLabel = labels.find(labelObj => labelObj[boxId]);
    const labelText = matchingLabel ? matchingLabel[boxId] : null;
    
    console.log(`[Visual Search] 🏷️ Switching rectangle to: ${labelText || 'Unlabeled'} (${boxId})`);
    
    // Show rectangle for the new selection with label
    showDetectionRectangle(imageContainer, bboxNormalized, newIndex, labelText);
  }
  
  function showDetectionRectangle(imageContainer, bboxNormalized, index, labelText = null) {
    const imageRect = imageState.element.getBoundingClientRect();
    const containerRect = imageContainer.getBoundingClientRect();
    
    const imgLeft = imageRect.left - containerRect.left;
    const imgTop = imageRect.top - containerRect.top;
    
    const w = imageState.naturalWidth;
    const h = imageState.naturalHeight;
    
    const absoluteBbox = [
      Math.floor(bboxNormalized[0] * w),
      Math.floor(bboxNormalized[1] * h),
      Math.floor(bboxNormalized[2] * w),
      Math.floor(bboxNormalized[3] * h)
    ];
    
    const bboxAbsolute = {
      x: absoluteBbox[0],
      y: absoluteBbox[1],
      width: absoluteBbox[2] - absoluteBbox[0],
      height: absoluteBbox[3] - absoluteBbox[1]
    };
    
    const scaledBbox = {
      x: bboxAbsolute.x * imageState.scaleX,
      y: bboxAbsolute.y * imageState.scaleY,
      width: bboxAbsolute.width * imageState.scaleX,
      height: bboxAbsolute.height * imageState.scaleY
    };
    
    const rectangleLeft = imgLeft + scaledBbox.x;
    const rectangleTop = imgTop + scaledBbox.y;
    const rectangleWidth = scaledBbox.width;
    const rectangleHeight = scaledBbox.height;
    
    const detectionRectangle = document.createElement('div');
    detectionRectangle.className = 'detection-rectangle';
    detectionRectangle.id = `detection-rectangle-${index}`;
    detectionRectangle.innerHTML = '&nbsp;';
    detectionRectangle.style.cssText = `
      position: absolute;
      left: ${rectangleLeft}px;
      top: ${rectangleTop}px;
      width: ${rectangleWidth}px;
      height: ${rectangleHeight}px;
      border: 3px solid #FF0000;
      background: #ea0d0d2b;
      pointer-events: none;
      z-index: 999;
      border-radius: 4px;
    `;
    
    // Add label to the rectangle if available
    if (labelText) {
      const rectangleLabel = document.createElement('div');
      rectangleLabel.className = 'detection-rectangle-label';
      rectangleLabel.innerHTML = labelText;
      rectangleLabel.style.cssText = `
        position: absolute;
        top: -22px;
        left: 0px;
        background: #FF0000;
        color: white;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 8px;
        font-weight: 600;
        white-space: nowrap;
        z-index: 1000;
      `;
      detectionRectangle.appendChild(rectangleLabel);
    }
    
    imageContainer.appendChild(detectionRectangle);
  }
  
  async function performAnalysisWithCroppedImage(drawer, croppedImageFile) {
    try {
      console.log('[Visual Search] 🔍 Calling API with cropped image...');
      
      // Loading state is already shown in switchToDetection
      // Get search input for API call
      const searchInput = getStoredSearchInput(drawer);
      
      // Call the API with cropped image (reuse existing API call logic)
      const formData = new FormData();
      formData.append('file', croppedImageFile);
      formData.append('crop', 'true');

      const response = await fetch(CONFIG.EXTERNAL_API_URL, {
        method: 'POST',
        headers: {
          'shopDomainURL': CONFIG.SHOP_DOMAIN
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Visual Search] ❌ API error:', errorText);

        // Handle authentication errors specifically
        if (response.status === 401) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.code === 'SHOP_NOT_AUTHENTICATED' || errorData.code === 'SESSION_EXPIRED') {
              showError('App authentication expired. Please contact the store owner to reinstall the app.');
              hideLoadingState(drawer);
              return;
            }
          } catch (e) {
            // If parsing fails, fall through to generic error
          }
        }

        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[Visual Search] ✅ Cropped image API response:', result);
      
      // Update UI with new results
      updateResultsFromCroppedArea(drawer, result);
      
    } catch (error) {
      console.error('[Visual Search] ❌ Error calling API with cropped image:', error);
      hideLoadingState(drawer);
    }
  }
  
  function updateResultsFromCroppedArea(drawer, result) {
    console.log('[Visual Search] 🎯 Updating results from cropped area:', result);
    
    // Update product results using existing display function
    if (result && result.products && result.products.length > 0) {
      console.log('[Visual Search] 📦 Showing', result.products.length, 'products from cropped area');
      
      // Clear any existing empty states
      const emptyState = drawer.querySelector('#empty-state');
      if (emptyState) {
        emptyState.style.display = 'none';
      }
      
      // showSearchResults automatically handles clearing skeleton loaders
      showSearchResults(drawer, result.products, 'cropped-area', null);
      
      // Update header to indicate this is from cropped area
      updateResultsHeader(drawer, 'Detection Area Results', `Found ${result.products.length} products in selected area`);
      
      console.log('[Visual Search] ✅ Results should now be visible in the grid');
    } else {
      console.log('[Visual Search] ❌ No products found in cropped area');
      
      // Hide loading state for no results case
      hideLoadingState(drawer);
      
      // Show no results message using existing grid
      const resultsGrid = drawer.querySelector('#results-grid');
      if (resultsGrid) {
        resultsGrid.innerHTML = `
          <div style="text-align: center; padding: 40px; color: #666; grid-column: 1 / -1;">
            <div style="font-size: 18px; margin-bottom: 8px;">No products found</div>
            <div style="font-size: 14px;">Try selecting a different detection area</div>
          </div>
        `;
      }
      
      // Update header for no results
      updateResultsHeader(drawer, 'Detection Area Results', 'No products found in selected area');
    }
  }
  
  function showLoadingState(drawer) {
    console.log('[Visual Search] 💀 Showing skeleton loaders...');
    const resultsGrid = drawer.querySelector('#results-grid');
    console.log('[Visual Search] 🎯 Results grid found:', !!resultsGrid);
    
    // Clear existing content first
    if (resultsGrid) {
      resultsGrid.innerHTML = '';
    }
    
    // Use existing skeleton loaders instead of custom spinner
    showSkeletonLoaders(drawer);
    
    // Check if skeletons were added
    const skeletonCards = resultsGrid ? resultsGrid.querySelectorAll('.skeleton-card') : [];
    console.log('[Visual Search] 💀 Skeleton cards added:', skeletonCards.length);
  }
  
  function hideLoadingState(drawer) {
    // Remove skeleton loaders using existing function
    removeSkeletonLoaders(drawer);
  }
  
  function getStoredSearchInput(drawer) {
    // Try to get stored search input from various locations
    return drawer._searchInput || 
           window.visualSearchCurrentInput || 
           drawer.querySelector('#modal-content')?._searchInput ||
           drawer.querySelector('#image-selection-container')?._searchInput ||
           null;
  }

  // ====================================================================
  // BOUNDING BOX DETECTION VISUALIZATION
  // ====================================================================
  
  function showMultipleDetections(drawer, allBoundingBox, largestBoundingBoxId, labels = []) {
    // Store data on drawer for access in click handlers
    drawer._allBoundingBox = allBoundingBox;
    drawer._currentSelectedDetection = largestBoundingBoxId;
    drawer._detectionLabels = labels;
    // Don't show detection boxes when cropper is active
    const container = drawer.querySelector('#image-selection-container');
    if (container && container._cropper) {
      console.log('[Visual Search] 🔇 Skipping detection boxes - cropper is active');
      return;
    }
    
    console.log('[Visual Search] 📍 Showing multiple detections:', allBoundingBox.length);
    
    const imageContainer = drawer.querySelector('#image-selection-container');
    
    if (!imageContainer || !imageState.element) {
      console.error('[Visual Search] ❌ Image container or image state not found');
      return;
    }
    
    // Ensure the container has proper positioning and overflow
    const containerStyle = getComputedStyle(imageContainer);
    if (containerStyle.position === 'static') {
      imageContainer.style.position = 'relative';
    }
    if (containerStyle.overflow === 'hidden') {
      imageContainer.style.overflow = 'visible';
    }
    
    // Remove any existing detection boxes
    const existingBoxes = imageContainer.querySelectorAll('.detection-box');
    existingBoxes.forEach(box => box.remove());
    
    
    // Add CSS animation if not already added (shared for all detection boxes)
    if (!document.querySelector('#detection-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'detection-animation-styles';
      style.textContent = `
        @keyframes detection-appear {
          0% { 
            opacity: 0; 
            transform: scale(0.8); 
          }
          100% { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        
        @keyframes detection-pulse {
          0%, 100% { 
            transform: scale(1); 
          }
          50% { 
            transform: scale(0.85); 
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Process all bounding boxes with new format
    console.log('[Visual Search] 📊 Showing all', allBoundingBox.length, 'detections');
    
    // Process all bounding boxes
    allBoundingBox.forEach((boundingBox, index) => {
      // Extract the first (and likely only) key-value pair from the bounding box object
      const boxId = Object.keys(boundingBox)[0];
      const bboxNormalized = boundingBox[boxId];
      
      // Find matching label for this detection
      const matchingLabel = labels.find(labelObj => labelObj[boxId]);
      const labelText = matchingLabel ? matchingLabel[boxId] : null;
      
      const color = '#FF0000'; // Red color for all detections
      
      // Check if this is the largest bounding box
      const isLargestDetection = largestBoundingBoxId !== null && parseInt(boxId) === largestBoundingBoxId;
      
      console.log(`[Visual Search] 🏷️ Detection ${index} (${boxId}): ${labelText || 'No label'}`);
      
      showSingleDetection(drawer, imageContainer, bboxNormalized, color, index, isLargestDetection, labelText);
    });
  }

  
  function showSingleDetection(drawer, imageContainer, bboxNormalized, color, index, isLargestDetection, labelText = null) {
    // Use centralized image state for dimensions and scaling
    const imageRect = imageState.element.getBoundingClientRect();
    const containerRect = imageContainer.getBoundingClientRect();
    
    // Calculate relative position of image within container
    const imgLeft = imageRect.left - containerRect.left;
    const imgTop = imageRect.top - containerRect.top;
    
    // Apply normalization formula: [x1, y1, x2, y2] normalized -> absolute pixels
    // Formula: new_box = [x1*w, y1*h, x2*w, y2*h]
    const w = imageState.naturalWidth;  // Original image width
    const h = imageState.naturalHeight; // Original image height
    
    const absoluteBbox = [
      Math.floor(bboxNormalized[0] * w), // x1 * width
      Math.floor(bboxNormalized[1] * h), // y1 * height  
      Math.floor(bboxNormalized[2] * w), // x2 * width
      Math.floor(bboxNormalized[3] * h)  // y2 * height
    ];
    
    // Convert [x1, y1, x2, y2] to [x, y, width, height] format
    const bboxAbsolute = {
      x: absoluteBbox[0],                           // x1
      y: absoluteBbox[1],                           // y1  
      width: absoluteBbox[2] - absoluteBbox[0],     // x2 - x1
      height: absoluteBbox[3] - absoluteBbox[1]     // y2 - y1
    };
    
    // Scale to displayed image dimensions
    const scaledBbox = {
      x: bboxAbsolute.x * imageState.scaleX,
      y: bboxAbsolute.y * imageState.scaleY,
      width: bboxAbsolute.width * imageState.scaleX,
      height: bboxAbsolute.height * imageState.scaleY
    };
    
    // Always show small circle at center for all detections
    const centerX = imgLeft + scaledBbox.x + (scaledBbox.width / 2);
    const centerY = imgTop + scaledBbox.y + (scaledBbox.height / 2);
    const circleSize = 10;
    const boxLeft = centerX - (circleSize / 2);
    const boxTop = centerY - (circleSize / 2);
    const boxWidth = circleSize;
    const boxHeight = circleSize;
    
    
    // Create detection circle element (same for all detections)
    const detectionBox = document.createElement('div');
    detectionBox.className = 'detection-circle';
    detectionBox.id = `detection-circle-${index}`;
    detectionBox.innerHTML = '&nbsp;'; // Add non-breaking space so it's not considered empty
    detectionBox.style.cssText = `
      position: absolute;
      left: ${boxLeft}px;
      top: ${boxTop}px;
      width: ${boxWidth}px;
      height: ${boxHeight}px;
      border: 2px solid #FF0000;
      background: #FF0000;
      pointer-events: auto;
      cursor: pointer;
      z-index: ${1000 + index};
      border-radius: 50%;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);
      animation: detection-appear 0.5s ease-out, detection-pulse 2s ease-in-out 0.5s infinite;
    `;
    
    // Store detection data on the element for click handler
    detectionBox._detectionData = {
      index: index,
      bboxNormalized: bboxNormalized,
      boxId: Object.keys(drawer._allBoundingBox[index])[0], // Store the box ID
      labelText: labelText // Store the label for this detection
    };
    
    // Add click handler to switch detection and call API with cropped area
    detectionBox.addEventListener('click', function(e) {
      e.stopPropagation();
      console.log(`[Visual Search] 🖱️ Detection ${index} (${labelText || 'Unlabeled'}) clicked, switching to this area`);
      const detectionData = this._detectionData;
      switchToDetection(drawer, detectionData);
    });
    
    // If this is the largest detection, also add a rectangle outline (without animation)
    if (isLargestDetection) {
      const rectangleLeft = imgLeft + scaledBbox.x;
      const rectangleTop = imgTop + scaledBbox.y;
      const rectangleWidth = scaledBbox.width;
      const rectangleHeight = scaledBbox.height;
      
      const detectionRectangle = document.createElement('div');
      detectionRectangle.className = 'detection-rectangle';
      detectionRectangle.id = `detection-rectangle-${index}`;
      detectionRectangle.innerHTML = '&nbsp;';
      detectionRectangle.style.cssText = `
        position: absolute;
        left: ${rectangleLeft}px;
        top: ${rectangleTop}px;
        width: ${rectangleWidth}px;
        height: ${rectangleHeight}px;
        border: 3px solid #FF0000;
        background: #ea0d0d2b;
        pointer-events: none;
        z-index: ${999 + index};
        border-radius: 4px;
      `;
      
      // Add label to the active rectangle if available
      if (labelText) {
        const rectangleLabel = document.createElement('div');
        rectangleLabel.className = 'detection-rectangle-label';
        rectangleLabel.innerHTML = labelText;
        rectangleLabel.style.cssText = `
          position: absolute;
          top: -30px;
          left: 0px;
          background: #FF0000;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          z-index: ${1000 + index};
        `;
        detectionRectangle.appendChild(rectangleLabel);
      }
      
      imageContainer.appendChild(detectionRectangle);
    }
    
    
    // Add detection circle to container
    imageContainer.appendChild(detectionBox);
    
    // Debug: Log the container and circle positioning
    console.log('[Visual Search] 🔍 Debug positioning:', {
      containerRect: {
        left: containerRect.left,
        top: containerRect.top,
        width: containerRect.width,
        height: containerRect.height
      },
      imageRect: {
        left: imageRect.left,
        top: imageRect.top,
        width: imageRect.width,
        height: imageRect.height
      },
      circlePosition: {
        left: boxLeft,
        top: boxTop
      },
      containerStyle: {
        position: getComputedStyle(imageContainer).position,
        overflow: getComputedStyle(imageContainer).overflow,
        zIndex: getComputedStyle(imageContainer).zIndex
      }
    });
  }

  // ====================================================================
  // INITIALIZATION & EVENT LISTENERS
  // ====================================================================

  function initialize() {
    console.log('[Visual Search] Initializing unified script...');
    
    // Use centralized app block selectors
    const appBlockSelectors = CONFIG.APP_BLOCK_SELECTORS.ALL;
    
    // Enhanced app block detection with unique counting - STRICT MODE
    const detection = {};
    const allFoundElements = new Set();
    
    appBlockSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        detection[selector] = elements.length;
        
        // Add elements to set for deduplication
        elements.forEach(el => {
          allFoundElements.add(el);
        });
        
      } catch (e) {
        detection[selector] = 0;
      }
    });
    
    const totalFoundElements = allFoundElements.size;
    const hasAppBlocks = totalFoundElements > 0;
    
    console.log('[Visual Search]   FINAL COUNT SUMMARY:', {
      individualSelectorCounts: detection,
      totalUniqueElements: totalFoundElements,
      hasAppBlocks: hasAppBlocks,
      expectedCount: 'Should match number of enabled blocks'
    });
    
    if (!hasAppBlocks) {
      initializeCleanupSystem();
      return;
    }
        
    // 🆕 TRACK APP BLOCK PRESENCE - with specific block types
    const enabledBlockTypes = [];
    const blockTypeMapping = CONFIG.APP_BLOCK_SELECTORS.TYPE_MAPPING;
    
    // Determine which specific block types are enabled
    Object.entries(detection).forEach(([selector, count]) => {
      if (count > 0 && blockTypeMapping[selector]) {
        enabledBlockTypes.push(blockTypeMapping[selector]);
      }
    });
    
    trackAppBlockUsage('block_loaded', {
      feature: 'app_block_detected',
      enabledBlockTypes: enabledBlockTypes,
      blockDetails: detection,
      pageUrl: window.location.href
    });
    
    // Add global styles only if app blocks are present
    addGlobalStyles();
    
    // Initialize cleanup monitoring
    initializeCleanupSystem();
    
    // Inject icons (currently disabled in your version)
    // Uncomment these lines if you want to re-enable automatic injection
    // if (document.readyState === 'loading') {
    //   document.addEventListener('DOMContentLoaded', injectVisualSearchIcon);
    // } else {
    //   injectVisualSearchIcon();
    // }
    
    // Watch for navigation changes (SPA support)
    let currentUrl = location.href;
    const checkUrlChange = debounce(() => {
      if (location.href !== currentUrl) {
        currentUrl = location.href;
        // Re-check app blocks on navigation
        setTimeout(() => {
          const stillHasBlocks = appBlockSelectors.some(selector => 
            document.querySelectorAll(selector).length > 0
          );
          if (!stillHasBlocks) {
            console.log('[Visual Search] 🔍 No app blocks after navigation - may have been removed');
          }
        }, 1000);
      }
    }, 100);
    
    setInterval(checkUrlChange, 1000);
    
    // Shopify theme events
    const shopifyEvents = [
      'shopify:section:load',
      'shopify:section:reorder', 
      'shopify:section:select',
      'shopify:section:deselect'
    ];
    
    shopifyEvents.forEach(event => {
      document.addEventListener(event, () => {
        setTimeout(() => {
          // Re-check app blocks after theme events
          const stillHasBlocks = appBlockSelectors.some(selector => 
            document.querySelectorAll(selector).length > 0
          );
          if (!stillHasBlocks) {
            console.log('[Visual Search] 🔍 No app blocks after theme event - may have been removed');
          }
        }, 1000);
      });
    });
    
    // Expose API for manual control
    window.visualSearchUnified = {
      openDrawer: (searchInput) => {
        // If no searchInput provided, create a fallback
        if (!searchInput) {
          searchInput = createFallbackSearchInput();
          console.log('[Visual Search] 🔧 Manual drawer open with fallback searchInput');
        }
        return openVisualSearchDrawer(searchInput);
      },
      config: CONFIG,
      createFallbackSearchInput: createFallbackSearchInput, // Expose helper function
      checkAppBlocks: () => {
        return appBlockSelectors.some(selector => 
          document.querySelectorAll(selector).length > 0
        );
      },
      // Manual cleanup function for debugging
      forceCleanup: () => {
        console.log('[Visual Search] 🔧 Manual cleanup triggered');
        return performGlobalCleanup();
      }
    };
    
    console.log('[Visual Search] ✅ Initialization complete');
  }
  
  // Start the magic
  initialize();
  
})();
