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
    SHOP_DOMAIN: window.VISUAL_SEARCH_CONFIG?.shopDomain || window.Shopify?.shop || '',
    
    // Theme customization (can be overridden by store owners)
    THEME: {
      // Icon colors
      ICON_COLOR: window.VISUAL_SEARCH_CONFIG?.theme?.iconColor || '#5f6368',
      ICON_COLOR_HOVER: window.VISUAL_SEARCH_CONFIG?.theme?.iconColorHover || '#202124',
      ICON_BACKGROUND_HOVER: window.VISUAL_SEARCH_CONFIG?.theme?.iconBackgroundHover || 'rgba(95, 99, 104, 0.08)',
      
      // Brand colors  
      PRIMARY_COLOR: window.VISUAL_SEARCH_CONFIG?.theme?.primaryColor || '#E60023',
      PRIMARY_COLOR_DARK: window.VISUAL_SEARCH_CONFIG?.theme?.primaryColorDark || '#BD081C',
      
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
    hasConfig: !!window.VISUAL_SEARCH_CONFIG
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
      z-index: 10;
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
      border: 2px solid #ccc;
      border-top: 2px solid #666;
      border-radius: 50%;
      animation: visual-search-spin 1s linear infinite;
    `,
    
    // Drawer overlay
    drawerOverlay: `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.4);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(8px);
      opacity: 0;
      transition: all ${CONFIG.ANIMATION_DURATION}ms ${CONFIG.ANIMATION_EASING};
    `,
    
    // Drawer content
    drawerContent: (isMobile) => `
      background: #ffffff;
      border-radius: ${isMobile ? '20px' : '24px'};
      padding: 0;
      max-width: ${isMobile ? '400px' : '520px'};
      width: ${isMobile ? '95%' : '90%'};
      max-height: 85vh;
      overflow: hidden;
      box-shadow: 0 32px 64px rgba(0, 0, 0, 0.12), 0 16px 32px rgba(0, 0, 0, 0.08);
      transform: translateY(${isMobile ? '24px' : '32px'}) scale(${isMobile ? '0.98' : '0.96'});
      transition: all ${CONFIG.ANIMATION_DURATION}ms ${CONFIG.ANIMATION_EASING};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      position: relative;
      border: 1px solid rgba(0, 0, 0, 0.04);
    `,
    
    // Notification toast
    notification: (type) => {
      const colors = {
        success: { bg: '#4CAF50', text: '#fff' },
        error: { bg: '#f44336', text: '#fff' },
        info: { bg: '#2196F3', text: '#fff' }
      };
      return `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type].bg};
        color: ${colors[type].text};
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 300px;
        word-wrap: break-word;
        transform: translateX(100%);
        transition: transform 0.3s ease;
      `;
    }
  };
  
  // ====================================================================
  // PINTEREST-STYLE DRAWER HTML TEMPLATE
  // ====================================================================
  
  const DRAWER_TEMPLATE = `
    <!-- Header Section -->
    <div style="
      padding: 32px 32px 24px;
      background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      text-align: center;
      position: relative;
    ">
      <button id="close-drawer-x" style="
        position: absolute;
        top: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        border: none;
        background: rgba(0, 0, 0, 0.06);
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #333;
        transition: all 0.3s ${CONFIG.ANIMATION_EASING};
        font-size: 18px;
        font-weight: 300;
      " onmouseover="this.style.background='rgba(0, 0, 0, 0.1)'; this.style.transform='scale(1.05)';" onmouseout="this.style.background='rgba(0, 0, 0, 0.06)'; this.style.transform='scale(1)';">
        ×
      </button>

      <div style="
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, ${CONFIG.PINTEREST_RED} 0%, ${CONFIG.PINTEREST_RED_DARK} 100%);
        border-radius: 50%;
        margin: 0 auto 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 32px rgba(230, 0, 35, 0.3);
      ">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="9" cy="9" r="2"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      </div>
      
      <h2 style="
        margin: 0 0 8px;
        color: #333;
        font-size: 28px;
        font-weight: 700;
        line-height: 1.1;
        letter-spacing: -0.5px;
      ">Find your style</h2>
      
      <p style="
        margin: 0;
        color: #767676;
        font-size: 16px;
        line-height: 1.5;
        font-weight: 400;
      ">Upload a photo to discover similar items in our collection</p>
    </div>

    <!-- Upload Options -->
    <div style="padding: 32px;">
      <div style="display: grid; gap: 20px;">
        
        <!-- Upload Button -->
        <button id="upload-from-device" style="
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          width: 100%;
          padding: 20px;
          border: 2px dashed #E0E0E0;
          border-radius: 16px;
          background: #FAFAFA;
          color: #333;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ${CONFIG.ANIMATION_EASING};
          text-decoration: none;
          position: relative;
          overflow: hidden;
        " onmouseover="
          this.style.borderColor='${CONFIG.PINTEREST_RED}'; 
          this.style.background='#FFF5F5'; 
          this.style.transform='translateY(-2px)';
          this.style.boxShadow='0 8px 32px rgba(230, 0, 35, 0.15)';
        " onmouseout="
          this.style.borderColor='#E0E0E0'; 
          this.style.background='#FAFAFA';
          this.style.transform='translateY(0px)';
          this.style.boxShadow='none';
        ">
          <div style="
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, ${CONFIG.PINTEREST_RED} 0%, ${CONFIG.PINTEREST_RED_DARK} 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(230, 0, 35, 0.3);
          ">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div style="text-align: left;">
            <div style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 2px;">Upload from device</div>
            <div style="font-size: 13px; color: #767676; font-weight: 400;">Browse your photos</div>
          </div>
        </button>

        
        <!-- Camera Button -->
        <button id="take-photo" style="
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          width: 100%;
          padding: 20px;
          border: 2px solid #333;
          border-radius: 16px;
          background: #333;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ${CONFIG.ANIMATION_EASING};
          position: relative;
          overflow: hidden;
        " onmouseover="
          this.style.background='#111'; 
          this.style.transform='translateY(-2px)';
          this.style.boxShadow='0 8px 32px rgba(0, 0, 0, 0.2)';
        " onmouseout="
          this.style.background='#333';
          this.style.transform='translateY(0px)';
          this.style.boxShadow='none';
        ">
          <div style="
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #333 0%, #111 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid rgba(255, 255, 255, 0.2);
          ">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <div style="text-align: left;">
            <div style="font-size: 16px; font-weight: 600; color: white; margin-bottom: 2px;">Use camera</div>
            <div style="font-size: 13px; color: rgba(255, 255, 255, 0.8); font-weight: 400;">Take a photo now</div>
          </div>
        </button>

      </div>

      <!-- Divider -->
      <div style="
        margin: 32px 0;
        height: 1px;
        background: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.1) 50%, transparent 100%);
      "></div>

      <!-- How it works section -->
      <div style="text-align: center;">
        <h3 style="
          margin: 0 0 16px;
          color: #333;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: -0.2px;
        ">How it works</h3>
        
        <div style="display: grid; gap: 16px; text-align: left;">
          <div style="
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 16px;
            background: #FAFAFA;
            border-radius: 12px;
            border-left: 4px solid ${CONFIG.PINTEREST_RED};
          ">
            <div style="
              width: 32px;
              height: 32px;
              background: linear-gradient(135deg, ${CONFIG.PINTEREST_RED} 0%, ${CONFIG.PINTEREST_RED_DARK} 100%);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              margin-top: 2px;
            ">
              <span style="color: white; font-weight: 600; font-size: 14px;">1</span>
            </div>
            <div>
              <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 4px;">Upload your photo</div>
              <div style="font-size: 13px; color: #767676; line-height: 1.4;">Choose an image from your device or take a new photo</div>
            </div>
          </div>

          <div style="
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 16px;
            background: #FAFAFA;
            border-radius: 12px;
            border-left: 4px solid ${CONFIG.PINTEREST_RED};
          ">
            <div style="
              width: 32px;
              height: 32px;
              background: linear-gradient(135deg, ${CONFIG.PINTEREST_RED} 0%, ${CONFIG.PINTEREST_RED_DARK} 100%);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              margin-top: 2px;
            ">
              <span style="color: white; font-weight: 600; font-size: 14px;">2</span>
            </div>
            <div>
              <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 4px;">AI analysis</div>
              <div style="font-size: 13px; color: #767676; line-height: 1.4;">Our smart AI identifies key features and style elements</div>
            </div>
          </div>

          <div style="
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 16px;
            background: #FAFAFA;
            border-radius: 12px;
            border-left: 4px solid ${CONFIG.PINTEREST_RED};
          ">
            <div style="
              width: 32px;
              height: 32px;
              background: linear-gradient(135deg, ${CONFIG.PINTEREST_RED} 0%, ${CONFIG.PINTEREST_RED_DARK} 100%);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              margin-top: 2px;
            ">
              <span style="color: white; font-weight: 600; font-size: 14px;">3</span>
            </div>
            <div>
              <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 4px;">Discover similar items</div>
              <div style="font-size: 13px; color: #767676; line-height: 1.4;">Browse curated results that match your style</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid rgba(0, 0, 0, 0.08);
        text-align: center;
      ">
        <p style="
          margin: 0;
          font-size: 12px;
          color: #999;
          line-height: 1.4;
        ">Powered by advanced AI • Privacy protected</p>
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
    style.textContent = STYLES.spinnerKeyframes;
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
    icon.setAttribute('aria-label', 'Search by image');
    icon.setAttribute('role', 'button');
    icon.setAttribute('tabindex', '0');
    icon.title = 'Search by image';
    
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

    // Animate in
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      drawer.style.transform = 'translateY(0) scale(1)';
    });

    // Close function
    const closeDrawer = () => {
      overlay.style.opacity = '0';
      drawer.style.transform = isMobile 
        ? 'translateY(24px) scale(0.98)' 
        : 'translateY(32px) scale(0.96)';
      
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

    drawer.querySelector('#upload-from-device').addEventListener('click', () => {
      const button = drawer.querySelector('#upload-from-device');
      button.style.transform = 'scale(0.98)';
      button.style.opacity = '0.8';
      
      setTimeout(() => {
        closeDrawer();
        setTimeout(() => openVisualSearch(searchInput), 200);
      }, 150);
    });

    drawer.querySelector('#take-photo').addEventListener('click', () => {
      const button = drawer.querySelector('#take-photo');
      button.style.transform = 'scale(0.98)';
      button.style.opacity = '0.8';
      
      setTimeout(() => {
        closeDrawer();
        setTimeout(() => openVisualSearch(searchInput, true), 200);
      }, 150);
    });
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
