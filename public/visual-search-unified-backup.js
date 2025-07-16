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
      
      @keyframes visual-search-skeleton-pulse {
        0% { opacity: 1; }
        50% { opacity: 0.4; }
        100% { opacity: 1; }
      }
    `,
    
    // Responsive media queries for modal content
    responsiveStyles: `
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
    
    // Pinterest-style modal content - Mobile-first responsive design
    drawerContent: (isMobile) => `
      background: #ffffff;
      border-radius: ${isMobile ? '20px 20px 0 0' : '20px'};
      padding: 0;
      max-width: ${isMobile ? '100%' : '1600px'};
      width: ${isMobile ? '100%' : '95%'};
      max-height: ${isMobile ? '95vh' : '90vh'};
      height: ${isMobile ? '95vh' : '800px'};
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
        z-index: 999998;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px var(--visual-search-shadow-medium, rgba(0,0,0,0.15));
        max-width: 300px;
        word-wrap: break-word;
        transform: translateX(100%);
        transition: transform 0.3s ease;
      `;
    }
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
        min-height: 300px;
        max-height: 50vh;
        padding: 16px;
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
            ">Analyzing image and searching for similar products...</p>
          </div>

          <!-- Image Container -->
          <div id="image-selection-container" style="
            position: relative;
            margin-bottom: 16px;
            border-radius: 8px;
            overflow: hidden;
            background: #f7f7f7;
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            max-height: 400px;
          ">
            <!-- Uploaded image will be inserted here -->
          </div>

          <!-- Upload Another Button -->
          <div style="
            display: flex;
            justify-content: center;
            margin-top: 12px;
          ">
            <button id="upload-another" style="
              background: white;
              color: #e60023;
              border: 2px solid #e60023;
              padding: 10px 20px;
              border-radius: 6px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
    style.textContent = STYLES.spinnerKeyframes + STYLES.responsiveStyles;
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
    
    const reader = new FileReader();
    reader.onload = (e) => {
      // Create image element
      const img = document.createElement('img');
      img.style.cssText = `
        width: 100%;
        height: 100%;
        border-radius: 8px;
        object-fit: contain;
        max-width: 100%;
        max-height: 100%;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      img.id = 'uploaded-image';
      img.src = e.target.result;
      
      // Once image loads, fade it in and remove skeleton
      img.onload = () => {
        const skeleton = imageContainer.querySelector('#image-skeleton');
        if (skeleton) {
          skeleton.remove();
        }
        img.style.opacity = '1';
      };
      
      imageContainer.appendChild(img);
    };
    reader.readAsDataURL(imageFile);
    
    // Store file for later analysis
    drawer._imageFile = imageFile;
    drawer._searchInput = searchInput;
    
    // Automatically analyze the image when preview is shown
    analyzeUploadedImage(drawer, searchInput);
  }

  function showUploadSection(drawer) {
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
      </div>
    `;
    
    // Add hover effects
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
      const img = card.querySelector('img');
      img.style.transform = 'scale(1.05)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'none';
      const img = card.querySelector('img');
      img.style.transform = 'scale(1)';
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
          max-width: 100%;
          max-height: 100%;
          border-radius: 8px;
          object-fit: contain;
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
