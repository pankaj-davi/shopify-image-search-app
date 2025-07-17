(function() {
  'use strict';
  
  // ====================================================================
  // VISUAL SEARCH - UNIFIED SCRIPT
  // Single source of truth for all visual search functionality
  // Pinterest-style UI with comprehensive styling and functionality
  // ====================================================================
  
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
    // App configuration
    APP_URL: window.VISUAL_SEARCH_CONFIG?.appUrl || 'https://your-app-domain.com',
    EXTERNAL_API_URL: 'http://localhost:3000/pi/visual-search',
    SHOP_DOMAIN: window.VISUAL_SEARCH_CONFIG?.shopDomain || window.Shopify?.shop || '',
    
    // Theme customization (can be overridden by store owners)
    THEME: {
      // Icon colors - use CSS variables for theme compatibility
      ICON_COLOR: window.VISUAL_SEARCH_CONFIG?.theme?.iconColor || 'var(--visual-search-text-secondary, #5f6368)',
      ICON_COLOR_HOVER: window.VISUAL_SEARCH_CONFIG?.theme?.iconColorHover || 'var(--visual-search-text-primary, #202124)',
      ICON_BACKGROUND_HOVER: window.VISUAL_SEARCH_CONFIG?.theme?.iconBackgroundHover || 'var(--visual-search-bg-surface-hover, rgba(95, 99, 104, 0.08))',
      
      // Brand colors - use CSS variables for theme compatibility
      PRIMARY_COLOR: window.VISUAL_SEARCH_CONFIG?.theme?.primaryColor || 'var(--visual-search-brand-primary, #008060)',
      PRIMARY_COLOR_DARK: window.VISUAL_SEARCH_CONFIG?.theme?.primaryColorDark || 'var(--visual-search-brand-active, #004C3F)',
      
      // Icon style
      ICON_STYLE: window.VISUAL_SEARCH_CONFIG?.theme?.iconStyle || 'google', // 'google', 'minimal', 'branded'
      ICON_SIZE_MULTIPLIER: window.VISUAL_SEARCH_CONFIG?.theme?.iconSizeMultiplier || 1.0,
      
      // Position
      ICON_POSITION: window.VISUAL_SEARCH_CONFIG?.theme?.iconPosition || 'right', // 'right', 'left'
      ICON_OFFSET: window.VISUAL_SEARCH_CONFIG?.theme?.iconOffset || 8
    },
    
    // UI Settings (fallback to theme or defaults)
    get PINTEREST_RED() { return this.THEME.PRIMARY_COLOR; },
    get PINTEREST_RED_DARK() { return this.THEME.PRIMARY_COLOR_DARK; },
    
    ICON_SIZE_DEFAULT: 24,
    ICON_SIZE_MIN: 20,
    ICON_SIZE_MAX: 28,
    
    // Animation settings
    ANIMATION_DURATION: 400,
    ANIMATION_EASING: 'cubic-bezier(0.16, 1, 0.3, 1)',
    
    // File upload settings
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    
    // Search selectors for finding input fields
    SEARCH_SELECTORS: [
      'input[type="search"]',
      'input[name*="search"]',
      'input[placeholder*="search" i]',
      'input[class*="search"]',
      'input[id*="search"]',
      '[role="searchbox"]',
      '.search-input',
      '#search',
      '.header-search input',
      '.predictive-search input',
      '.search-bar input'
    ]
  };
  
  console.log('[Visual Search] Configuration:', {
    appUrl: CONFIG.APP_URL,
    shopDomain: CONFIG.SHOP_DOMAIN,
    hasConfig: !!window.VISUAL_SEARCH_CONFIG,
    CONFIG : JSON.parse(JSON.stringify(CONFIG)),
  });
  
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
        gap: 12px !important;
      }
      
      .visual-search-results-header {
        padding: 16px !important;
        position: sticky !important;
        top: 0 !important;
        background: #ffffff !important;
        z-index: 10 !important;
      }
      
      .visual-search-results-container {
        padding: 16px !important;
        -webkit-overflow-scrolling: touch;
      }
      
      /* Touch-optimized button sizes */
      .visual-search-alt-button {
        padding: 14px 12px !important;
        font-size: 14px !important;
        gap: 8px !important;
        border-radius: 10px !important;
        min-height: 48px !important;
      }
      
      .visual-search-alt-button svg {
        width: 18px !important;
        height: 18px !important;
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
        width: 56px !important;
        height: 56px !important;
        margin-bottom: 16px !important;
      }
      
      .visual-search-upload-icon svg {
        width: 28px !important;
        height: 28px !important;
      }
      
      .visual-search-main-upload h3 {
        font-size: 18px !important;
        margin-bottom: 10px !important;
      }
      
      .visual-search-main-upload p {
        font-size: 15px !important;
        margin-bottom: 20px !important;
        max-width: 260px !important;
      }
      
      .visual-search-main-upload button {
        padding: 14px 28px !important;
        font-size: 15px !important;
        min-height: 48px !important;
      }
      
      /* Mobile-friendly tips section */
      .visual-search-tips {
        padding: 14px !important;
        border-radius: 10px !important;
      }
      
      .visual-search-tips h4 {
        font-size: 14px !important;
        margin-bottom: 8px !important;
      }
      
      .visual-search-tips ul {
        font-size: 13px !important;
        line-height: 1.6 !important;
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
        max-width: calc(100% - 30px) !important;
        max-height: calc(100% - 30px) !important;
        width: auto !important;
        height: auto !important;
        min-width: 120px !important;
        min-height: 120px !important;
        object-fit: contain !important;
        display: block !important;
        margin: 0 auto !important;
      }
      
      /* Close button mobile optimization */
      #close-drawer-x {
        width: 40px !important;
        height: 40px !important;
        top: 8px !important;
        right: 12px !important;
        font-size: 18px !important;
        touch-action: manipulation !important;
      }
      
      /* Header mobile adjustments */
      .visual-search-drawer > div > div:first-child {
        padding: 16px 20px 12px !important;
      }
      
      .visual-search-drawer h2 {
        font-size: 20px !important;
      }
      
      .visual-search-drawer > div > div:first-child p {
        font-size: 14px !important;
      }
      
      /* Empty state mobile */
      .visual-search-empty-state {
        padding: 40px 20px !important;
      }
      
      .visual-search-empty-icon {
        width: 64px !important;
        height: 64px !important;
        margin-bottom: 16px !important;
      }
      
      .visual-search-empty-icon svg {
        width: 28px !important;
        height: 28px !important;
      }
      
      .visual-search-empty-state h3 {
        font-size: 16px !important;
        margin-bottom: 6px !important;
      }
      
      .visual-search-empty-state p {
        font-size: 13px !important;
        max-width: 280px !important;
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
          width: 64px !important;
          height: 64px !important;
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
          padding: 40px 24px !important;
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
        .visual-search-tips {
          padding: 16px !important;
          border-radius: 12px !important;
        }
        .visual-search-tips h4 {
          font-size: 14px !important;
          margin-bottom: 8px !important;
        }
        .visual-search-tips ul {
          font-size: 13px !important;
          line-height: 1.6 !important;
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
          max-height: 450px !important;
          min-height: 250px !important;
          width: 100% !important;
          box-sizing: border-box !important;
          overflow: visible !important;
          padding: 15px !important;
        }
        
        #image-selection-container img {
          max-width: calc(100% - 30px) !important;
          max-height: calc(100% - 30px) !important;
          width: auto !important;
          height: auto !important;
          min-width: 180px !important;
          min-height: 180px !important;
          object-fit: contain !important;
          display: block !important;
          margin: 0 auto !important;
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
    
    // Icon styles - Google-inspired design with smart positioning
    icon: (size, offset = 8) => `
      position: absolute;
      top: 50%;
      ${CONFIG.THEME.ICON_POSITION}: ${offset}px;
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
      border-radius: ${isMobile ? '20px 20px 0 0' : '20px'};
      padding: 0;
      max-width: ${isMobile ? '100%' : '1600px'};
      width: ${isMobile ? '100%' : '95%'};
      max-height: ${isMobile ? '95vh' : '90vh'};
      height: ${isMobile ? 'auto' : '800px'};
      min-height: ${isMobile ? '50vh' : '600px'};
      ${isMobile ? 'position: fixed; bottom: 0; left: 0; right: 0;' : ''}
      overflow: hidden;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1);
      transform: ${isMobile ? 'translateY(100%)' : 'translateY(24px) scale(0.94)'};
      transition: all 300ms cubic-bezier(0.2, 0.8, 0.2, 1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      position: relative;
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

    // Crop box styles for image selection
    cropBox: `
      position: absolute;
      border: 3px solid #f8f8f8;
      cursor: grab;
      box-sizing: border-box;
      touch-action: none;
      background: rgba(248, 248, 248, 0.02);
      transition: all 0.2s ease;
      opacity: 0;
      transform: scale(0.9);
      animation: crop-box-appear 0.3s ease forwards;
      min-width: 50px;
      min-height: 50px;
      border-radius: 12px;
      box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.8);
    `,

    cropBoxActive: `
      border-color: #f0f0f0;
      background: rgba(248, 248, 248, 0.05);
      box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.9), 0 4px 12px rgba(0, 0, 0, 0.1);
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
    ">
      <!-- Mobile: Stacked Layout, Desktop: Side-by-side Layout -->
      
      <!-- Left Side - Image Upload/Selection -->
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
            " onmouseover="
              this.style.background='#c8001c';
              this.style.transform='translateY(-1px)';
            " onmouseout="
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

            <!-- URL Option -->
            <button id="from-url" class="visual-search-alt-button" style="
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
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              From URL
            </button>
          </div>

          <!-- Mobile-Optimized Tips -->
          <div class="visual-search-tips" style="
            background: #ffffff;
            border: 1px solid #e9e9e9;
            border-radius: 8px;
            padding: 12px;
          ">
            <h4 style="
              margin: 0 0 6px;
              color: #111111;
              font-size: 13px;
              font-weight: 600;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">💡 Tips for better results</h4>
            
            <ul style="
              margin: 0;
              padding-left: 14px;
              color: #5f5f5f;
              font-size: 12px;
              line-height: 1.5;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
              <li>Use clear, well-lit images</li>
              <li>Focus on a single main item</li>
              <li>Avoid cluttered backgrounds</li>
            </ul>
          </div>
        </div>

        <!-- Image Preview Section (Hidden Initially) -->
        <div id="image-preview-section" style="display: none;">
          <div style="
            text-align: center;
            margin-bottom: 16px;
          ">
            <h3 style="
              margin: 0 0 6px;
              color: #111111;
              font-size: 16px;
              font-weight: 600;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">Your uploaded image</h3>
            <p style="
              margin: 0;
              color: #5f5f5f;
              font-size: 13px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">Adjust the crop area to focus on the item you want to search for</p>
          </div>

          <!-- Image Container with Crop Tool -->
          <div id="image-selection-container" style="
            position: relative;
            margin-bottom: 16px;
            border-radius: 8px;
            overflow: visible;
            background: #fafafa;
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            max-height: 350px;
            border: 1px solid #e9e9e9;
            width: 100%;
            box-sizing: border-box;
            padding: 15px;
          ">
            <!-- Uploaded image and crop box will be inserted here -->
          </div>

          <!-- Control Buttons -->
          <div style="
            display: flex;
            gap: 8px;
            justify-content: center;
            margin-top: 12px;
          ">
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
      ">
        <!-- Search Results Section -->
        <div id="results-section" style="
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        ">
          <!-- Results Header -->
          <div id="results-header" class="visual-search-results-header" style="
            padding: 16px;
            border-bottom: 1px solid #e9e9e9;
            background: #ffffff;
            flex-shrink: 0;
          ">
            <h3 id="results-title" style="
              margin: 0 0 4px;
              color: #111111;
              font-size: 16px;
              font-weight: 600;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">Ready to search</h3>
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
            padding: 16px;
          ">
            <div id="results-grid" class="visual-search-results-grid" style="
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
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
  
  function addGlobalStyles() {
    if (document.querySelector('#visual-search-global-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'visual-search-global-styles';
    style.textContent = STYLES.spinnerKeyframes + STYLES.responsiveStyles + STYLES.cropBoxKeyframes;
    document.head.appendChild(style);
  }
  
  function createSVGIcon() {
    // Different icon styles based on theme configuration
    const iconStyle = CONFIG.THEME.ICON_STYLE || 'google';
    
    switch (iconStyle) {
      case 'minimal':
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
          <rect x="7" y="7" width="8" height="6" rx="1"/>
        </svg>`;
      
      case 'branded':
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          <circle cx="12" cy="8" r="2" fill="white"/>
          <rect x="8" y="10" width="8" height="4" rx="1" fill="white" opacity="0.8"/>
        </svg>`;
      
      case 'google':
      default:
        // Google-style camera icon for image search
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <!-- Camera body -->
          <path d="M9 2l.75 3h4.5L15 2z" fill="currentColor" opacity="0.8"/>
          <rect x="2" y="6" width="20" height="12" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <rect x="3" y="7" width="18" height="10" rx="1" ry="1" fill="currentColor" opacity="0.1"/>
          
          <!-- Camera lens -->
          <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.3"/>
          
          <!-- Flash/viewfinder -->
          <circle cx="17" cy="9" r="0.8" fill="currentColor"/>
        </svg>`;
    }
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
  
  // ====================================================================
  // LOADING STATES
  // ====================================================================
  
  function showLoadingState(input) {
    const icon = input.parentElement?.querySelector('.visual-search-icon');
    if (icon) {
      icon.style.opacity = '0.3';
      icon.style.pointerEvents = 'none';
      icon.innerHTML = `<div style="${STYLES.spinner}"></div>`;
    }
  }
  
  function hideLoadingState(input) {
    const icon = input.parentElement?.querySelector('.visual-search-icon');
    if (icon) {
      icon.style.opacity = '0.7';
      icon.style.pointerEvents = 'auto';
      icon.innerHTML = createSVGIcon();
      // Restore theme colors
      icon.style.color = CONFIG.THEME.ICON_COLOR;
    }
  }
  
  // ====================================================================
  // VISUAL SEARCH ICON CREATION & INJECTION
  // ====================================================================
  
  function createVisualSearchIcon(input, size = CONFIG.ICON_SIZE_DEFAULT, offset = 8) {
    const icon = document.createElement('div');
    icon.className = 'visual-search-icon';
    icon.setAttribute('aria-label', 'Search by image1');
    icon.setAttribute('role', 'button');
    icon.setAttribute('tabindex', '0');
    icon.title = 'Search by image1';
    
    icon.style.cssText = STYLES.icon(size, offset);
    icon.innerHTML = createSVGIcon();
    
    // Google-style hover effects with theme colors
    icon.addEventListener('mouseenter', () => {
      icon.style.opacity = '1';
      icon.style.backgroundColor = CONFIG.THEME.ICON_BACKGROUND_HOVER;
      icon.style.borderRadius = '50%';
      icon.style.color = CONFIG.THEME.ICON_COLOR_HOVER;
    });
    
    icon.addEventListener('mouseleave', () => {
      icon.style.opacity = '0.7';
      icon.style.backgroundColor = 'transparent';
      icon.style.borderRadius = '3px';
      icon.style.color = CONFIG.THEME.ICON_COLOR;
    });
    
    // Click handlers
    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openVisualSearchDrawer(input);
    };
    
    icon.addEventListener('click', handleClick);
    icon.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick(e);
      }
    });
    
    return icon;
  }
  
  function injectVisualSearchIcon() {
    console.log('[Visual Search] Injecting visual search icons...');
    
    const searchInputs = document.querySelectorAll(CONFIG.SEARCH_SELECTORS.join(','));
    console.log(`[Visual Search] Found ${searchInputs.length} search inputs`);

    searchInputs.forEach(input => {
      // Skip if already injected or hidden
      if (input.closest('.search-container')?.querySelector('.visual-search-icon')) return;
      if (input.dataset.visualSearchInjected) return;
      if (getComputedStyle(input).display === 'none') return;

      // Mark as injected
      input.dataset.visualSearchInjected = 'true';

      // Get container and make it relative
      const container = input.closest('form, div, .search-form, .search-wrapper, .field') || input.parentElement;
      if (!container) return;
      
      const containerStyle = getComputedStyle(container);
      if (containerStyle.position === 'static') {
        container.style.position = 'relative';
      }

      // Calculate icon size and smart positioning to avoid overlap
      const inputStyle = getComputedStyle(input);
      const inputHeight = parseInt(inputStyle.height) || 40;
      const iconSize = Math.min(Math.max(inputHeight * 0.6, CONFIG.ICON_SIZE_MIN), CONFIG.ICON_SIZE_MAX) * CONFIG.THEME.ICON_SIZE_MULTIPLIER;
      
      // Check for existing icons/buttons in the input area
      const existingIcons = container.querySelectorAll('button, .icon, .search-icon, [class*="icon"], [class*="search"]');
      const currentPaddingLeft = parseInt(inputStyle.paddingLeft) || 0;
      const currentPaddingRight = parseInt(inputStyle.paddingRight) || 0;
      
      // Calculate safe position based on theme position setting
      let positionOffset = CONFIG.THEME.ICON_OFFSET;
      let additionalPadding = iconSize + 15;
      
      if (CONFIG.THEME.ICON_POSITION === 'left') {
        // Position on left side
        if (existingIcons.length > 0) {
          positionOffset = currentPaddingLeft > 30 ? currentPaddingLeft + 8 : 40;
          additionalPadding = positionOffset + iconSize + 8;
        }
        
        // Ensure minimum padding for our icon on left
        const finalPadding = Math.max(currentPaddingLeft, additionalPadding);
        input.style.paddingLeft = finalPadding + 'px';
      } else {
        // Position on right side (default)
        if (existingIcons.length > 0) {
          positionOffset = currentPaddingRight > 30 ? currentPaddingRight + 8 : 40;
          additionalPadding = positionOffset + iconSize + 8;
        }
        
        // Ensure minimum padding for our icon on right
        const finalPadding = Math.max(currentPaddingRight, additionalPadding);
        input.style.paddingRight = finalPadding + 'px';
      }

      // Create and inject icon with smart positioning
      const icon = createVisualSearchIcon(input, iconSize, positionOffset);
      container.appendChild(icon);
    });
  }
  
  // ====================================================================
  // PINTEREST-STYLE DRAWER
  // ====================================================================
  
  function openVisualSearchDrawer(searchInput) {
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

    // Upload Another button handler
    drawer.querySelector('#upload-another')?.addEventListener('click', () => {
      showUploadSection(drawer);
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
        // Show image preview immediately
        showImagePreview(drawer, file, searchInput);
        
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
    // Hide upload section, show image preview
    drawer.querySelector('#upload-section').style.display = 'none';
    drawer.querySelector('#image-preview-section').style.display = 'block';
    
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
        
        // Add crop box after image loads with smooth transition
        setTimeout(() => {
          addCropBox(imageContainer, img);
        }, 300);
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
          
          // Add crop box after image loads with smooth transition
          setTimeout(() => {
            addCropBox(imageContainer, img);
          }, 300);
        };
        
        imageContainer.appendChild(img);
      };
      reader.readAsDataURL(imageFile);
    }
    
    // Store file for later analysis
    drawer._imageFile = imageFile;
    drawer._searchInput = searchInput;
  }

  function triggerAutoSearch(container) {
    // Get the drawer element
    const drawer = container.closest('.visual-search-drawer').querySelector('div');
    if (!drawer || !drawer._imageFile || !drawer._searchInput) return;
    
    const cropData = getCropData(drawer);
    if (cropData) {
      performCroppedImageSearch(drawer, drawer._searchInput, cropData);
    }
  }

  function addCropBox(container, img) {
    // Calculate image dimensions and position within container
    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    
    // Calculate relative position of image within container
    const imgLeft = imgRect.left - containerRect.left;
    const imgTop = imgRect.top - containerRect.top;
    const imgWidth = imgRect.width;
    const imgHeight = imgRect.height;
    
    // Mobile responsive sizing
    const isMobile = window.innerWidth <= 768;
    const minCropSize = isMobile ? 80 : 100; // Smaller minimum on mobile
    const handleSize = isMobile ? 16 : 12; // Larger handles on mobile for easier touch
    const handleOffset = isMobile ? 8 : 6; // Larger offset on mobile
    
    // Calculate safe boundaries - ensure handles stay within image bounds
    const handleMargin = handleOffset + (handleSize / 2);
    const safeImgLeft = imgLeft + handleMargin;
    const safeImgTop = imgTop + handleMargin;
    const safeImgWidth = imgWidth - (handleMargin * 2);
    const safeImgHeight = imgHeight - (handleMargin * 2);
    
    // Create crop box (centered on image, responsive size) within safe boundaries
    const cropPercentage = isMobile ? 0.6 : 0.5; // Smaller percentage to ensure handles fit
    const maxCropWidth = Math.min(safeImgWidth, imgWidth * 0.8);
    const maxCropHeight = Math.min(safeImgHeight, imgHeight * 0.8);
    const cropWidth = Math.max(Math.min(maxCropWidth * cropPercentage, maxCropWidth), minCropSize);
    const cropHeight = Math.max(Math.min(maxCropHeight * cropPercentage, maxCropHeight), minCropSize);
    
    // Center the crop box within safe boundaries
    const cropLeft = safeImgLeft + (safeImgWidth - cropWidth) / 2;
    const cropTop = safeImgTop + (safeImgHeight - cropHeight) / 2;
    
    const cropBox = document.createElement('div');
    cropBox.id = 'crop-box';
    cropBox.style.cssText = `
      ${STYLES.cropBox}
      left: ${cropLeft}px;
      top: ${cropTop}px;
      width: ${cropWidth}px;
      height: ${cropHeight}px;
    `;
    
    // Create all 4 corner resize handles with mobile-responsive sizing
    const cornerHandles = [
      { id: 'nw', position: 'nw', cursor: 'nw-resize' },
      { id: 'ne', position: 'ne', cursor: 'ne-resize' },
      { id: 'sw', position: 'sw', cursor: 'sw-resize' },
      { id: 'se', position: 'se', cursor: 'se-resize' }
    ];
    
    cornerHandles.forEach(handle => {
      const resizeHandle = document.createElement('div');
      resizeHandle.id = `resize-handle-${handle.id}`;
      resizeHandle.className = 'resize-handle resize-handle-corner';
      resizeHandle.dataset.position = handle.position;
      resizeHandle.dataset.type = 'corner';
      resizeHandle.style.cssText = `
        position: absolute;
        width: ${handleSize}px;
        height: ${handleSize}px;
        background: rgba(248, 248, 248, 0.9);
        border: 2px solid rgba(255, 255, 255, 0.95);
        border-radius: ${isMobile ? '4px' : '2px'};
        cursor: ${handle.cursor};
        touch-action: none;
        transition: all 0.2s ease;
        z-index: 12;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        ${handle.position === 'nw' ? `top: -${handleOffset}px; left: -${handleOffset}px;` : ''}
        ${handle.position === 'ne' ? `top: -${handleOffset}px; right: -${handleOffset}px;` : ''}
        ${handle.position === 'sw' ? `bottom: -${handleOffset}px; left: -${handleOffset}px;` : ''}
        ${handle.position === 'se' ? `bottom: -${handleOffset}px; right: -${handleOffset}px;` : ''}
      `;
      cropBox.appendChild(resizeHandle);
    });
    
    // Create border resize handles (top, bottom, left, right) - mobile responsive
    const borderHandles = [
      { id: 'top', side: 'top' },
      { id: 'bottom', side: 'bottom' },
      { id: 'left', side: 'left' },
      { id: 'right', side: 'right' }
    ];
    
    const borderHandleSize = isMobile ? 12 : 8;
    const borderIndicatorSize = isMobile ? 20 : 16;
    
    borderHandles.forEach(handle => {
      const resizeHandle = document.createElement('div');
      resizeHandle.id = `resize-border-${handle.id}`;
      resizeHandle.className = 'resize-handle resize-handle-border';
      resizeHandle.dataset.side = handle.side;
      resizeHandle.dataset.type = 'border';
      resizeHandle.style.cssText = `
        position: absolute;
        background: transparent;
        touch-action: none;
        transition: all 0.2s ease;
        cursor: ${handle.side === 'top' || handle.side === 'bottom' ? 'ns-resize' : 'ew-resize'};
        ${handle.side === 'top' ? `top: -${borderHandleSize/2}px; left: ${handleSize + 4}px; right: ${handleSize + 4}px; height: ${borderHandleSize}px;` : ''}
        ${handle.side === 'bottom' ? `bottom: -${borderHandleSize/2}px; left: ${handleSize + 4}px; right: ${handleSize + 4}px; height: ${borderHandleSize}px;` : ''}
        ${handle.side === 'left' ? `left: -${borderHandleSize/2}px; top: ${handleSize + 4}px; bottom: ${handleSize + 4}px; width: ${borderHandleSize}px;` : ''}
        ${handle.side === 'right' ? `right: -${borderHandleSize/2}px; top: ${handleSize + 4}px; bottom: ${handleSize + 4}px; width: ${borderHandleSize}px;` : ''}
        z-index: 11;
      `;
      
      // Add the visual indicator
      const indicator = document.createElement('div');
      indicator.style.cssText = `
        position: absolute;
        background: rgba(248, 248, 248, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.95);
        border-radius: ${isMobile ? '3px' : '2px'};
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
        pointer-events: none;
        ${handle.side === 'top' || handle.side === 'bottom' ? 
          `left: 50%; top: 50%; transform: translate(-50%, -50%); width: ${borderIndicatorSize}px; height: ${isMobile ? 4 : 3}px;` : 
          `left: 50%; top: 50%; transform: translate(-50%, -50%); width: ${isMobile ? 4 : 3}px; height: ${borderIndicatorSize}px;`
        }
      `;
      resizeHandle.appendChild(indicator);
      cropBox.appendChild(resizeHandle);
    });
    
    container.appendChild(cropBox);
    
    // Add a center draggable area indicator - mobile responsive
    const dragArea = document.createElement('div');
    dragArea.className = 'crop-drag-area';
    const dragAreaSize = isMobile ? 32 : 24;
    dragArea.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${dragAreaSize}px;
      height: ${dragAreaSize}px;
      background: rgba(248, 248, 248, 0.9);
      border: 2px solid rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.7;
      transition: all 0.2s ease;
      pointer-events: none;
      z-index: 10;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    `;
    
    // Add drag icon
    const iconSize = isMobile ? 16 : 12;
    dragArea.innerHTML = `
      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #666;">
        <path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
      </svg>
    `;
    
    cropBox.appendChild(dragArea);
    
    // Add hover effects for the crop box
    cropBox.addEventListener('mouseenter', () => {
      dragArea.style.opacity = '1';
      dragArea.style.transform = 'translate(-50%, -50%) scale(1.1)';
    });
    
    cropBox.addEventListener('mouseleave', () => {
      dragArea.style.opacity = '0.7';
      dragArea.style.transform = 'translate(-50%, -50%) scale(1)';
    });
    
    // Update drag area cursor on mouse down
    cropBox.addEventListener('mousedown', (e) => {
      if (!e.target.classList.contains('resize-handle') && !e.target.closest('.resize-handle')) {
        dragArea.style.cursor = 'grabbing';
      }
    });
    
    document.addEventListener('mouseup', () => {
      dragArea.style.cursor = 'grab';
    });
    
    // Store image bounds for constraint checking - use safe boundaries
    cropBox._imageBounds = {
      left: safeImgLeft,
      top: safeImgTop,
      right: safeImgLeft + safeImgWidth,
      bottom: safeImgTop + safeImgHeight
    };
    
    // Store mobile state for interaction handling
    cropBox._isMobile = isMobile;
    cropBox._minCropSize = minCropSize;
    cropBox._handleSize = handleSize;
    cropBox._handleOffset = handleOffset;
    
    // Set up drag and resize functionality
    setupCropBoxInteraction(cropBox, container);
    
    // Auto-trigger search when crop box is created
    setTimeout(() => {
      triggerAutoSearch(container);
    }, 500);
  }

  function setupCropBoxInteraction(cropBox, container) {
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
      const handleSize = cropBox._handleSize || 12;
      const handleOffset = cropBox._handleOffset || 6;
      
      // Additional safety margin to ensure handles don't extend outside image
      const safetyMargin = Math.max(handleSize, handleOffset) + 2;
      const safeBounds = {
        left: bounds.left,
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom
      };
      
      // Constrain size first with mobile-aware minimum and safety margins
      const maxWidth = safeBounds.right - safeBounds.left;
      const maxHeight = safeBounds.bottom - safeBounds.top;
      width = Math.max(minSize, Math.min(width, maxWidth));
      height = Math.max(minSize, Math.min(height, maxHeight));
      
      // Constrain position to keep crop box (and handles) within safe bounds
      left = Math.max(safeBounds.left, Math.min(left, safeBounds.right - width));
      top = Math.max(safeBounds.top, Math.min(top, safeBounds.bottom - height));
      
      // Double-check that the position + size doesn't exceed boundaries
      if (left + width > safeBounds.right) {
        left = safeBounds.right - width;
      }
      if (top + height > safeBounds.bottom) {
        top = safeBounds.bottom - height;
      }
      
      // Final safety check to ensure we're within bounds
      left = Math.max(safeBounds.left, left);
      top = Math.max(safeBounds.top, top);
      
      return { left, top, width, height };
    }

    function startDrag(e) {
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
      if (isDragging) {
        // Clean up drag styling
        cropBox.style.cssText = cropBox.style.cssText.replace(STYLES.cropBoxActive, '');
        cropBox.style.cursor = 'grab';
        cropBox.style.transform = ''; // Remove transform after drag
        container.style.cursor = '';
        
        // Trigger auto search after drag
        setTimeout(() => {
          triggerAutoSearch(container);
        }, 300);
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
        
        // Trigger auto search after resize
        setTimeout(() => {
          triggerAutoSearch(container);
        }, 300);
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
    const cropBox = drawer.querySelector('#crop-box');
    const img = drawer.querySelector('#uploaded-image');
    
    if (!cropBox || !img) return null;
    
    const container = drawer.querySelector('#image-selection-container');
    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    const cropRect = cropBox.getBoundingClientRect();
    
    // Calculate crop coordinates relative to the actual image
    const imgLeft = imgRect.left - containerRect.left;
    const imgTop = imgRect.top - containerRect.top;
    const cropLeft = cropRect.left - containerRect.left;
    const cropTop = cropRect.top - containerRect.top;
    
    // Convert to image coordinates (0-1 scale)
    const relativeX = (cropLeft - imgLeft) / imgRect.width;
    const relativeY = (cropTop - imgTop) / imgRect.height;
    const relativeWidth = cropRect.width / imgRect.width;
    const relativeHeight = cropRect.height / imgRect.height;
    
    return {
      x: Math.max(0, Math.min(1, relativeX)),
      y: Math.max(0, Math.min(1, relativeY)),
      width: Math.max(0, Math.min(1, relativeWidth)),
      height: Math.max(0, Math.min(1, relativeHeight))
    };
  }

  async function performCroppedImageSearch(drawer, searchInput, cropData) {
    try {
      updateResultsHeader(drawer, 'Analyzing cropped area...', 'Detecting items in the selected area...');
      clearResults(drawer);
      showSkeletonLoaders(drawer);
      
      const formData = new FormData();
      formData.append('image', drawer._imageFile);
      formData.append('cropData', JSON.stringify(cropData));
      formData.append('analyze', 'true');
      
      console.log('[Visual Search] Sending cropped analysis request to:', CONFIG.EXTERNAL_API_URL);
      console.log('[Visual Search] Crop data:', cropData);
      
      const response = await fetch(CONFIG.EXTERNAL_API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'shopDomainURL': CONFIG.SHOP_DOMAIN
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log('[Visual Search] Cropped Analysis API Response:', result);
      
      // Handle the API response similar to regular analysis
      if (result && (result.products || result.detectedItems || result.length > 0)) {
        let detectedItems = [];
        
        if (Array.isArray(result)) {
          detectedItems = result.map((item, index) => ({
            id: item.productId || item.id || index,
            image: item.image || item.imageUrl
          }));
        } else if (result.detectedItems) {
          detectedItems = result.detectedItems;
        } else if (result.products) {
          detectedItems = result.products.map((item, index) => ({
            id: item.productId || item.id || index,
            image: item.image || item.imageUrl
          }));
        }
        
        if (detectedItems.length > 0) {
          drawer._detectedItems = detectedItems;
          performVisualSearch(drawer, detectedItems, searchInput, 'cropped area');
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
    // Clean up crop box event listeners if they exist
    const cropBox = drawer.querySelector('#crop-box');
    if (cropBox && cropBox._cleanup) {
      cropBox._cleanup();
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

  async function analyzeUploadedImage(drawer, searchInput) {
    try {
      updateResultsHeader(drawer, 'Analyzing image...', 'Detecting items in your image...');
      
      const formData = new FormData();
      formData.append('image', drawer._imageFile);
      formData.append('analyze', 'true');
      
      console.log('[Visual Search] Sending analysis request to:', CONFIG.EXTERNAL_API_URL);
      console.log('[Visual Search] Shop domain header:', CONFIG.SHOP_DOMAIN);
      
      const response = await fetch(CONFIG.EXTERNAL_API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'shopDomainURL': CONFIG.SHOP_DOMAIN
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log('[Visual Search] Analysis API Response:', result);
      
      // Handle the new API response format with product IDs and images array
      if (result && (result.products || result.detectedItems || result.length > 0)) {
        let detectedItems = [];
        
        // If result is an array, convert it to detectedItems format
        if (Array.isArray(result)) {
          detectedItems = result.map((item, index) => ({
            id: item.productId || item.id || index,
            image: item.image || item.imageUrl
          }));
        } 
        // If result has detectedItems property
        else if (result.detectedItems) {
          detectedItems = result.detectedItems;
        }
        // If result has products property
        else if (result.products) {
          detectedItems = result.products.map((item, index) => ({
            id: item.productId || item.id || index,
            image: item.image || item.imageUrl
          }));
        }
        
        if (detectedItems.length > 0) {
          drawer._detectedItems = detectedItems;
          // Automatically perform search with all detected items
          performVisualSearch(drawer, detectedItems, searchInput, 'detected items');
        } else {
          showError('No items detected in the image. Please try a different image.');
          updateResultsHeader(drawer, 'No items detected', 'Try uploading a clearer image');
          // Show empty state when no items detected
          const emptyState = drawer.querySelector('#empty-state');
          if (emptyState) {
            emptyState.style.display = 'flex';
          }
        }
      } else {
        showError(result.error || 'Could not analyze image. Please try again.');
        updateResultsHeader(drawer, 'Analysis failed', 'Could not detect items in the image');
        // Show empty state when analysis fails
        const emptyState = drawer.querySelector('#empty-state');
        if (emptyState) {
          emptyState.style.display = 'flex';
        }
      }
    } catch (error) {
      console.error('Visual search error:', error);
      showError('Something went wrong. Please try again.');
      updateResultsHeader(drawer, 'Analysis failed', 'Something went wrong during analysis');
      // Show empty state when error occurs
      const emptyState = drawer.querySelector('#empty-state');
      if (emptyState) {
        emptyState.style.display = 'flex';
      }
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

  async function performVisualSearch(drawer, items, searchInput, searchType) {
    try {
      updateResultsHeader(drawer, 'Searching...', 'Finding similar products...');
      clearResults(drawer);
      
      // Show skeleton loaders for first two rows (mobile: 2x2=4, desktop: could be more)
      showSkeletonLoaders(drawer);
      
      const formData = new FormData();
      formData.append('image', drawer._imageFile);
      formData.append('items', JSON.stringify(items));
      formData.append('search', 'true');
      
      console.log('[Visual Search] Sending search request to:', CONFIG.EXTERNAL_API_URL);
      console.log('[Visual Search] Shop domain header:', CONFIG.SHOP_DOMAIN);
      console.log('[Visual Search] Selected items:', items);
      
      const response = await fetch(CONFIG.EXTERNAL_API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'shopDomainURL': CONFIG.SHOP_DOMAIN
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log('[Visual Search] Search API Response:', result);
      
      // Handle the new API response format with product IDs and images array
      let products = [];
      
      if (Array.isArray(result)) {
        // If result is an array of products
        products = result.map((item, index) => ({
          id: item.productId || item.id || index,
          image: item.image || item.imageUrl
        }));
      } else if (result.success && result.products) {
        // If result has success flag and products array
        products = result.products;
      } else if (result.products) {
        // If result directly has products array
        products = result.products;
      }
      
      if (products.length > 0) {
        showSearchResults(drawer, products, searchType, searchInput);
      } else {
        showError(result.error || 'No similar items found.');
        updateResultsHeader(drawer, 'No results', 'Try uploading a different image');
        // Remove skeleton loaders and show empty state when no search results found
        removeSkeletonLoaders(drawer);
        const emptyState = drawer.querySelector('#empty-state');
        if (emptyState) {
          emptyState.style.display = 'flex';
        }
      }
    } catch (error) {
      console.error('Visual search error:', error);
      showError('Search failed. Please try again.');
      updateResultsHeader(drawer, 'Search failed', 'Something went wrong. Please try again.');
      // Remove skeleton loaders and show empty state when search fails
      removeSkeletonLoaders(drawer);
      const emptyState = drawer.querySelector('#empty-state');
      if (emptyState) {
        emptyState.style.display = 'flex';
      }
    }
  }

  function showSearchResults(drawer, products, searchType, searchInput) {
    // Store data for infinite scroll
    drawer._allProducts = products;
    drawer._currentPage = 0;
    drawer._itemsPerPage = 20;
    drawer._searchInput = searchInput;
    
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

  function setupResultsHandlers(drawer, searchInput) {
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
      cursor: pointer;
      position: relative;
    `;
    
    card.innerHTML = `
      <div style="
        aspect-ratio: 1;
        background: #f7f7f7;
        position: relative;
        overflow: hidden;
      ">
        <img src="${product.image}" alt="Product ${product.id}" style="
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.2s ease;
        " onload="this.parentElement.style.background='transparent'">
        
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
    
    // Add click handler for search by image functionality
    card.addEventListener('click', (e) => {
      // Check if we're in a drawer context
      const drawer = card.closest('.visual-search-drawer');
      if (drawer) {
        const drawerContent = drawer.querySelector('div');
        if (drawerContent && drawerContent._searchInput) {
          // Use the result image for a new search
          searchByResultImage(product.image, drawerContent._searchInput, drawerContent);
        }
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
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: visual-search-skeleton-pulse 1.5s ease-in-out infinite;
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
  
  async function searchByResultImage(imageUrl, searchInput, drawer) {
    try {
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
      
      // Update UI to show that we're using a new image
      updateResultsHeader(drawer, 'New search starting...', 'Using selected result image for search');
      
      showSuccess('Image updated! Crop and adjust the area to search.');
      
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
      
      updateResultsHeader(drawer, 'Image loaded', 'Analyzing image and searching for similar products...');
      
    } catch (error) {
      console.error('Visual search error:', error);
      showError('Could not load image from URL. Please check the URL and try again.');
      updateResultsHeader(drawer, 'Failed to load image', 'Please check the URL and try again');
    }
  }

  async function processImageFromUrl(url, searchInput) {
    try {
      showLoadingState(searchInput);
      
      const formData = new FormData();
      formData.append('imageUrl', url);
      formData.append('shop', CONFIG.SHOP_DOMAIN);
      
      const response = await fetch(`${CONFIG.APP_URL}/api/visual-search`, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.searchQuery) {
        searchInput.value = result.searchQuery;
        searchInput.focus();
        
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        setTimeout(() => {
          const form = searchInput.closest('form');
          if (form) {
            form.dispatchEvent(new Event('submit', { bubbles: true }));
          } else {
            const searchButton = searchInput.parentElement?.querySelector('button[type="submit"], .search-button, [aria-label*="search" i]');
            if (searchButton) {
              searchButton.click();
            }
          }
        }, 100);
        
        showSuccess(`Found: "${result.searchQuery}"`);
      } else {
        showError(result.error || 'Could not process image from URL. Please try again.');
      }
    } catch (error) {
      console.error('Visual search error:', error);
      showError('Could not load image from URL. Please check the URL and try again.');
    } finally {
      hideLoadingState(searchInput);
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
      showError('Please select a valid image file (JPEG, PNG, WebP, or GIF).');
      return false;
    }
    
    return true;
  }
  
  function openVisualSearch(searchInput, useCamera = false) {
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
        showLoadingState(searchInput);
        
        const formData = new FormData();
        formData.append('image', file);
        formData.append('shop', CONFIG.SHOP_DOMAIN);
        
        const response = await fetch(`${CONFIG.APP_URL}/api/visual-search`, {
          method: 'POST',
          body: formData,
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.searchQuery) {
          // Fill search input
          searchInput.value = result.searchQuery;
          searchInput.focus();
          
          // Trigger events
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          searchInput.dispatchEvent(new Event('change', { bubbles: true }));
          
          // Auto-submit search
          setTimeout(() => {
            const form = searchInput.closest('form');
            if (form) {
              form.dispatchEvent(new Event('submit', { bubbles: true }));
            } else {
              const searchButton = searchInput.parentElement?.querySelector('button[type="submit"], .search-button, [aria-label*="search" i]');
              if (searchButton) {
                searchButton.click();
              }
            }
          }, 100);
          
          showSuccess(`Found: "${result.searchQuery}"`);
        } else {
          showError(result.error || 'Could not process image. Please try again.');
        }
      } catch (error) {
        console.error('Visual search error:', error);
        showError('Something went wrong. Please try again.');
      } finally {
        hideLoadingState(searchInput);
      }
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  }
  
  // ====================================================================
  // INITIALIZATION & EVENT LISTENERS
  // ====================================================================
  
  function initialize() {
    console.log('[Visual Search] Initializing unified script...');
    
    // Add global styles
    addGlobalStyles();
    
    // Inject icons
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectVisualSearchIcon);
    } else {
      injectVisualSearchIcon();
    }
    
    // Watch for navigation changes (SPA support)
    let currentUrl = location.href;
    const checkUrlChange = debounce(() => {
      if (location.href !== currentUrl) {
        currentUrl = location.href;
        setTimeout(injectVisualSearchIcon, 1000);
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
      document.addEventListener(event, () => setTimeout(injectVisualSearchIcon, 1000));
    });
    
    // Mutation observer for dynamic content
    const observer = new MutationObserver(debounce((mutations) => {
      let shouldReinject = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
              const hasSearchInput = node.matches?.(CONFIG.SEARCH_SELECTORS.join(',')) ||
                                   node.querySelector?.(CONFIG.SEARCH_SELECTORS.join(','));
              if (hasSearchInput) {
                shouldReinject = true;
              }
            }
          });
        }
      });
      
      if (shouldReinject) {
        setTimeout(injectVisualSearchIcon, 500);
      }
    }, 250));
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Expose API for manual control
    window.visualSearchUnified = {
      inject: injectVisualSearchIcon,
      openDrawer: openVisualSearchDrawer,
      openSearch: openVisualSearch,
      config: CONFIG
    };
    
    console.log('[Visual Search] Initialization complete');
  }
  
  // Start the magic
  initialize();
  
})();
