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
    // App configuration - Static values
    APP_URL: 'https://pixel-dress-store.myshopify.com/',
    EXTERNAL_API_URL: 'http://localhost:3000/visual-search',
    SHOP_DOMAIN: 'pixel-dress-store.myshopify.com',
    
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
  
  console.log('[Visual Search] Static Configuration loaded: PankajTest', {
    appUrl: CONFIG.APP_URL,
    shopDomain: CONFIG.SHOP_DOMAIN,
    primaryColor: CONFIG.THEME.PRIMARY_COLOR,
    iconStyle: CONFIG.THEME.ICON_STYLE
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
      
      /* Mobile-friendly tips section */
      .visual-search-tips {
        padding: 14px;
        border-radius: 10px;
      }
      
      .visual-search-tips h4 {
        font-size: 14px;
        margin-bottom: 8px;
      }
      
      .visual-search-tips ul {
        font-size: 13px;
        line-height: 1.6;
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
          height: 180px !important;
        }
        
        #image-selection-container img {
          width: 100% !important;
          min-width: 100% !important;
          min-height: 240px !important;
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
    // Simple camera icon for visual search
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 2l.75 3h4.5L15 2z" fill="currentColor" opacity="0.8"/>
      <rect x="2" y="6" width="20" height="12" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <rect x="3" y="7" width="18" height="10" rx="1" ry="1" fill="currentColor" opacity="0.1"/>
      <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.3"/>
      <circle cx="17" cy="9" r="0.8" fill="currentColor"/>
    </svg>`;
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
  
  function injectVisualSearchIcon() {
    console.log('[Visual Search] Search selector injection disabled in this version');
    return; // Early return - no search selector injection
  }
  
  // ====================================================================
  // PINTEREST-STYLE DRAWER
  // ====================================================================
  
  function openVisualSearchDrawer(searchInput) {
    console.log('[Visual Search] 🚪 Opening drawer with searchInput:', !!searchInput, searchInput);
    
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
        console.log('[Visual Search] ❌ Could not find drawer element');
        return;
      }
      
      if (!imageFile) {
        console.log('[Visual Search] ❌ No image file found');
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
    formData.append('image', imageFile);
    formData.append('analyze', 'true');
    
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
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'shopDomainURL': CONFIG.SHOP_DOMAIN
      }
    });
    
    console.log('[Visual Search] 📥 Immediate analysis response status:', response.status);
    console.log('[Visual Search] 📥 Response headers:', response.headers);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Visual Search] ❌ Immediate analysis server error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('[Visual Search] ✅ Immediate analysis API response:', result);
    
    // Process results immediately and show to user
    if (result && (result.products || result.detectedItems || result.length > 0)) {
      let detectedItems = [];
      
      if (Array.isArray(result)) {
        // Result is directly an array of items
        detectedItems = result.map((item, index) => ({
          id: item.productId || item.id || index,
          image: item.image || item.imageUrl,
          name: item.name || item.title || `Item ${index + 1}`,
          confidence: item.confidence || 0.9
        }));
      } else if (result.detectedItems) {
        detectedItems = result.detectedItems;
      } else if (result.products) {
        detectedItems = result.products.map((item, index) => ({
          id: item.productId || item.id || index,
          image: item.image || item.imageUrl,
          name: item.name || item.title || `Item ${index + 1}`,
          confidence: item.confidence || 0.9
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
      opacity: 1;
      transform: scale(1);
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
      pointer-events: auto;
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
      dragArea.style.pointerEvents = 'auto';
    });
    
    cropBox.addEventListener('mouseleave', () => {
      dragArea.style.opacity = '0.7';
      dragArea.style.transform = 'translate(-50%, -50%) scale(1)';
      // Keep pointer events auto so dragging still works
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
    
    // Store image bounds for constraint checking - use actual image boundaries
    cropBox._imageBounds = {
      left: imgLeft,
      top: imgTop,
      right: imgLeft + imgWidth,
      bottom: imgTop + imgHeight
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
        
        // 🚀 IMMEDIATE API CALL: Call API right away when user drags crop box
        console.log('[Visual Search] 🎯 User finished dragging - calling immediate API');
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
      console.log('[Visual Search] Shop domain:', CONFIG.SHOP_DOMAIN);
      
      const response = await fetch(CONFIG.EXTERNAL_API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'shopDomainURL': CONFIG.SHOP_DOMAIN
        }
      });
      
      console.log('[Visual Search] Response status:', response.status);
      console.log('[Visual Search] Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Visual Search] Server error response:', errorText);
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
            image: item.image || item.imageUrl,
            name: item.name || item.title || `Item ${index + 1}`,
            confidence: item.confidence || 0.9,
            price: item.price,
            url: item.url
          }));
        } else if (result.detectedItems) {
          detectedItems = result.detectedItems;
        } else if (result.products) {
          detectedItems = result.products.map((item, index) => ({
            id: item.productId || item.id || index,
            image: item.image || item.imageUrl,
            name: item.name || item.title || `Item ${index + 1}`,
            confidence: item.confidence || 0.9,
            price: item.price,
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
      
      console.log('[Visual Search] Search response status:', response.status);
      console.log('[Visual Search] Search response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Visual Search] Search server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
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
    
    // Expose API for manual control
    window.visualSearchUnified = {
      inject: injectVisualSearchIcon,
      openDrawer: (searchInput) => {
        // If no searchInput provided, create a fallback
        if (!searchInput) {
          searchInput = createFallbackSearchInput();
          console.log('[Visual Search] 🔧 Manual drawer open with fallback searchInput');
        }
        return openVisualSearchDrawer(searchInput);
      },
      openSearch: openVisualSearch,
      config: CONFIG,
      createFallbackSearchInput: createFallbackSearchInput // Expose helper function
    };
    
    console.log('[Visual Search] Initialization complete');
  }
  
  // Start the magic
  initialize();
  
})();
