/**
 * Visual Search API Module
 * Contains all API calls, image analysis, and network functionality
 */
(function() {
  'use strict';

  // ====================================================================
  // API CONFIGURATION
  // ====================================================================
  
  function getApiConfig() {
    // Use global API URL from config module if available
    const GLOBAL_API_BASE_URL = window.VisualSearchConfig?.GLOBAL_API_BASE_URL || 'https://treaty-herein-theories-thinking.trycloudflare.com';
    
    return window.VisualSearchConfig?.CONFIG || {
      EXTERNAL_API_URL: `${GLOBAL_API_BASE_URL}/api/product-handle`,
      SHOP_DOMAIN: 'pixel-dress-store.myshopify.com',
      MAX_FILE_SIZE: 5 * 1024 * 1024,
      ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    };
  }

  // ====================================================================
  // REAL-TIME CROP ANALYSIS
  // ====================================================================

  async function performRealTimeCropAnalysis(container) {
    console.log('[Visual Search API] 🎯 Starting real-time crop analysis...');
    
    const CONFIG = getApiConfig();
    const imageState = window.VisualSearchConfig?.imageState || {};
    
    try {
      // Get crop data
      const cropData = getCropData(container);
      if (!cropData) {
        console.warn('[Visual Search API] No crop data available');
        return;
      }
      
      console.log('[Visual Search API] 📐 Crop data:', cropData);
      
      // Get the uploaded image file
      const drawer = document.querySelector('.visual-search-drawer');
      const fileInput = drawer?.querySelector('#visual-search-file-input');
      if (!fileInput?.files?.[0]) {
        console.warn('[Visual Search API] No file available for crop analysis');
        return;
      }
      
      const imageFile = fileInput.files[0];
      console.log('[Visual Search API] 📁 Using file for crop analysis:', imageFile.name);
      
      // Prepare form data
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('shopDomainURL', CONFIG.SHOP_DOMAIN);
      
      // Add crop parameters
      formData.append('cropX', Math.round(cropData.x));
      formData.append('cropY', Math.round(cropData.y)); 
      formData.append('cropWidth', Math.round(cropData.width));
      formData.append('cropHeight', Math.round(cropData.height));
      
      console.log('[Visual Search API] 📤 Sending crop analysis request...');
      
      const response = await fetch(CONFIG.EXTERNAL_API_URL, {
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
      console.log('[Visual Search API] ✅ Crop analysis response:', result);
      
      // Process results
      await processApiResponse(result, drawer);
      
    } catch (error) {
      console.error('[Visual Search API] ❌ Real-time crop analysis failed:', error);
      window.VisualSearchUtils?.showError?.('Analysis failed. Please try again.');
    }
  }

  // ====================================================================
  // IMMEDIATE IMAGE ANALYSIS
  // ====================================================================

  async function performImmediateImageAnalysis(drawer, imageFile, searchInput) {
    console.log('[Visual Search API] 🖼️ Starting immediate image analysis...');
    console.log('[Visual Search API] 📁 File:', imageFile?.name || 'No file');
    console.log('[Visual Search API] 🔍 SearchInput:', !!searchInput);
    console.log('[Visual Search API] 📦 Drawer:', !!drawer);
    
    // Store search input globally
    window.visualSearchCurrentInput = searchInput;
    window.visualSearchCurrentSearchInput = searchInput; // Additional backup
    
    if (!imageFile || !searchInput || !drawer) {
      console.error('[Visual Search API] Missing required parameters for immediate analysis');
      return;
    }
    
    try {
      // For blob URLs, we need to handle differently
      if (imageFile._imageUrl && imageFile._imageUrl.startsWith('blob:')) {
        console.log('[Visual Search API] 🔗 Processing blob URL:', imageFile._imageUrl);
        
        try {
          const response = await fetch(imageFile._imageUrl);
          const blob = await response.blob();
          console.log('[Visual Search API] 📥 Blob converted for analysis:', blob.type, blob.size);
          await performImmediateFileAnalysis(drawer, blob, searchInput);
        } catch (error) {
          console.error('[Visual Search API] ❌ Failed to process blob URL:', error);
          window.VisualSearchUtils?.showError?.('Failed to process image. Please try uploading again.');
        }
      } else {
        // Regular file processing
        await performImmediateFileAnalysis(drawer, imageFile, searchInput);
      }
    } catch (error) {
      console.error('[Visual Search API] ❌ Immediate analysis failed:', error);
      window.VisualSearchUtils?.showError?.('Image analysis failed. Please try again.');
    }
  }

  // ====================================================================
  // FILE ANALYSIS HELPER
  // ====================================================================

  async function performImmediateFileAnalysis(drawer, imageFile, searchInput) {
    console.log('[Visual Search API] 🔍 Analyzing file immediately...');
    
    const CONFIG = getApiConfig();
    
    try {
      // Store globally for access by other functions
      if (window.visualSearchCurrentInput) {
        searchInput = window.visualSearchCurrentInput;
        console.log('[Visual Search API] 🌍 Using globally stored searchInput');
      } else if (window.visualSearchCurrentSearchInput) {
        searchInput = window.visualSearchCurrentSearchInput;
        console.log('[Visual Search API] 🌍 Using backup globally stored searchInput');
      }
      
      if (!searchInput) {
        console.warn('[Visual Search API] No searchInput available, creating fallback');
        searchInput = window.VisualSearchUtils?.createFallbackSearchInput?.() || {
          value: '',
          dispatchEvent: () => {},
          focus: () => {}
        };
      }
      
      console.log('[Visual Search API] 📤 Preparing API request...');
      
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('shopDomainURL', CONFIG.SHOP_DOMAIN);
      
      const response = await fetch(CONFIG.EXTERNAL_API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[Visual Search API] ✅ Analysis response:', result);
      
      // Process and display results
      await processApiResponse(result, drawer, searchInput);
      
    } catch (error) {
      console.error('[Visual Search API] ❌ File analysis failed:', error);
      
      // Show user-friendly error
      if (error.message.includes('Failed to fetch')) {
        window.VisualSearchUtils?.showError?.('Connection failed. Please check your internet and try again.');
      } else if (error.message.includes('413')) {
        window.VisualSearchUtils?.showError?.('Image too large. Please use a smaller image.');
      } else {
        window.VisualSearchUtils?.showError?.('Analysis failed. Please try again with a different image.');
      }
    }
  }

  // ====================================================================
  // CROPPED IMAGE SEARCH
  // ====================================================================

  async function performCroppedImageSearch(drawer, searchInput, cropData) {
    console.log('[Visual Search API] ✂️ Performing cropped image search...');
    console.log('[Visual Search API] 📐 Crop data:', cropData);
    
    const CONFIG = getApiConfig();
    
    if (!cropData) {
      console.error('[Visual Search API] No crop data provided');
      window.VisualSearchUtils?.showError?.('No selection area found. Please crop an area first.');
      return;
    }
    
    try {
      // Get the file from the file input
      const fileInput = drawer.querySelector('#visual-search-file-input');
      if (!fileInput?.files?.[0]) {
        console.error('[Visual Search API] No file found for cropped search');
        window.VisualSearchUtils?.showError?.('No image file found. Please upload an image first.');
        return;
      }
      
      const imageFile = fileInput.files[0];
      console.log('[Visual Search API] 📁 Using file for cropped search:', imageFile.name);
      
      // Show loading state
      updateResultsHeader(drawer, 'Analyzing selection...', 0);
      showSkeletonLoaders(drawer);
      
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('shopDomainURL', CONFIG.SHOP_DOMAIN);
      
      // Add crop parameters
      formData.append('cropX', Math.round(cropData.x));
      formData.append('cropY', Math.round(cropData.y));
      formData.append('cropWidth', Math.round(cropData.width));
      formData.append('cropHeight', Math.round(cropData.height));
      
      console.log('[Visual Search API] 📤 Sending cropped search request...');
      
      const response = await fetch(CONFIG.EXTERNAL_API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[Visual Search API] ✅ Cropped search response:', result);
      
      // Process and display results
      await processApiResponse(result, drawer, searchInput);
      
    } catch (error) {
      console.error('[Visual Search API] ❌ Cropped search failed:', error);
      removeSkeletonLoaders(drawer);
      window.VisualSearchUtils?.showError?.('Selection search failed. Please try again.');
    }
  }

  // ====================================================================
  // SEARCH BY RESULT IMAGE
  // ====================================================================

  async function searchByResultImage(imageUrl, searchInput, drawer) {
    console.log('[Visual Search API] 🖼️ Starting search by result image');
    console.log('[Visual Search API] 📸 Image URL:', imageUrl);
    console.log('[Visual Search API] 🔍 Search input exists:', !!searchInput);
    console.log('[Visual Search API] 📦 Drawer exists:', !!drawer);
    
    const CONFIG = getApiConfig();
    
    if (!imageUrl || !drawer) {
      console.error('[Visual Search API] Missing required parameters for result image search');
      return;
    }
    
    try {
      // Fallback search input if needed
      if (!searchInput && window.visualSearchCurrentInput) {
        searchInput = window.visualSearchCurrentInput;
        console.log('[Visual Search API] Using globally stored searchInput');
      } else if (!searchInput && window.visualSearchCurrentSearchInput) {
        searchInput = window.visualSearchCurrentSearchInput;
        console.log('[Visual Search API] Using backup globally stored searchInput');
      }
      
      if (!searchInput) {
        console.log('[Visual Search API] Creating fallback searchInput');
        searchInput = window.VisualSearchUtils?.createFallbackSearchInput?.() || {
          value: '',
          dispatchEvent: () => {},
          focus: () => {}
        };
      }
      
      // Show loading state
      updateResultsHeader(drawer, 'Searching similar products...', 0);
      showSkeletonLoaders(drawer);
      
      console.log('[Visual Search API] 📤 Fetching image from URL...');
      
      // Fetch the image
      let imageBlob;
      try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }
        imageBlob = await imageResponse.blob();
        console.log('[Visual Search API] ✅ Image fetched successfully:', imageBlob.type, imageBlob.size);
      } catch (fetchError) {
        console.error('[Visual Search API] ❌ Failed to fetch image:', fetchError);
        throw new Error('Failed to load product image');
      }
      
      // Prepare form data
      const formData = new FormData();
      formData.append('image', imageBlob, 'search-image.jpg');
      formData.append('shopDomainURL', CONFIG.SHOP_DOMAIN);
      
      console.log('[Visual Search API] 📤 Sending search request...');
      
      const response = await fetch(CONFIG.EXTERNAL_API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[Visual Search API] ✅ Result image search response:', result);
      
      // Process and display results
      await processApiResponse(result, drawer, searchInput);
      
    } catch (error) {
      console.error('[Visual Search API] ❌ Result image search failed:', error);
      removeSkeletonLoaders(drawer);
      
      if (error.message.includes('Failed to load product image')) {
        window.VisualSearchUtils?.showError?.('Could not load the selected product image.');
      } else {
        window.VisualSearchUtils?.showError?.('Search failed. Please try again.');
      }
    }
  }

  // ====================================================================
  // PROCESS IMAGE FROM URL
  // ====================================================================

  async function processImageFromUrlWithSelection(url, searchInput, drawer) {
    console.log('[Visual Search API] 🔗 Processing image from URL with selection...');
    console.log('[Visual Search API] 📎 URL:', url);
    
    const CONFIG = getApiConfig();
    
    try {
      if (!url) {
        throw new Error('No URL provided');
      }
      
      // Validate URL
      let finalUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        finalUrl = 'https://' + url;
      }
      
      console.log('[Visual Search API] 🌐 Final URL:', finalUrl);
      
      // Show loading state
      if (drawer) {
        updateResultsHeader(drawer, 'Loading image from URL...', 0);
        showSkeletonLoaders(drawer);
      }
      
      // Fetch and validate the URL
      try {
        console.log('[Visual Search API] 📤 Fetching URL...');
        const response = await fetch(finalUrl, {
          method: 'HEAD',
          mode: 'cors'
        });
        
        console.log('[Visual Search API] 📥 URL response status:', response.status);
        console.log('[Visual Search API] 📋 Content-Type:', response.headers.get('content-type'));
        
        if (!response.ok) {
          throw new Error(`Failed to access URL: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.startsWith('image/')) {
          throw new Error('URL does not point to an image');
        }
        
      } catch (urlError) {
        console.error('[Visual Search API] ❌ URL validation failed:', urlError);
        throw new Error('Invalid or inaccessible image URL');
      }
      
      // Now process the valid image URL
      await searchByResultImage(finalUrl, searchInput, drawer);
      
    } catch (error) {
      console.error('[Visual Search API] ❌ URL processing failed:', error);
      
      if (drawer) {
        removeSkeletonLoaders(drawer);
      }
      
      if (error.message.includes('Invalid or inaccessible')) {
        window.VisualSearchUtils?.showError?.('Unable to access the image URL. Please check the URL and try again.');
      } else if (error.message.includes('not point to an image')) {
        window.VisualSearchUtils?.showError?.('The URL does not appear to be an image. Please provide a direct image URL.');
      } else {
        window.VisualSearchUtils?.showError?.('Failed to process image from URL. Please try a different URL.');
      }
    }
  }

  // ====================================================================
  // RESPONSE PROCESSING HELPERS
  // ====================================================================

  async function processApiResponse(result, drawer, searchInput) {
    console.log('[Visual Search API] 📊 Processing API response...');
    
    try {
      let products = [];
      
      // Handle different response formats
      if (Array.isArray(result)) {
        products = result;
      } else if (result && typeof result === 'object') {
        if (result.products && Array.isArray(result.products)) {
          products = result.products;
        } else if (result.detectedItems && Array.isArray(result.detectedItems)) {
          products = result.detectedItems;
        } else if (result.items && Array.isArray(result.items)) {
          products = result.items;
        }
      }
      
      console.log('[Visual Search API] 📦 Extracted products:', products.length);
      
      if (drawer) {
        // Remove loading skeletons
        removeSkeletonLoaders(drawer);
        
        // Update results header
        updateResultsHeader(drawer, `Found ${products.length} similar products`, products.length);
        
        // Display results
        displayAllResults(drawer, products, searchInput);
      }
      
      // Track usage if analytics enabled
      if (window.VisualSearchConfig?.CONFIG?.ANALYTICS_ENABLED) {
        trackAppBlockUsage('api-search', { resultCount: products.length });
      }
      
    } catch (error) {
      console.error('[Visual Search API] ❌ Response processing failed:', error);
      if (drawer) {
        removeSkeletonLoaders(drawer);
        updateResultsHeader(drawer, 'Error processing results', 0);
      }
    }
  }

  // ====================================================================
  // UI HELPER FUNCTIONS (STUBS - WILL BE IMPLEMENTED BY UI MODULE)
  // ====================================================================

  function updateResultsHeader(drawer, text, count) {
    // This will be implemented by the UI module
    console.log('[Visual Search API] 📝 Update results header:', text, count);
    
    const header = drawer?.querySelector('.visual-search-results-header');
    if (header) {
      header.innerHTML = `<h3>${text}</h3>`;
    }
  }

  function showSkeletonLoaders(drawer) {
    // This will be implemented by the UI module
    console.log('[Visual Search API] 💀 Show skeleton loaders');
    
    const container = drawer?.querySelector('.visual-search-results-grid');
    if (container) {
      container.innerHTML = Array(6).fill(0).map(() => `
        <div class="visual-search-skeleton" style="height: 120px; background: #f0f0f0; border-radius: 8px; animation: visual-search-skeleton-pulse 1.5s ease-in-out infinite;"></div>
      `).join('');
    }
  }

  function removeSkeletonLoaders(drawer) {
    // This will be implemented by the UI module
    console.log('[Visual Search API] 🧹 Remove skeleton loaders');
    
    const skeletons = drawer?.querySelectorAll('.visual-search-skeleton');
    skeletons?.forEach(el => el.remove());
  }

  function displayAllResults(drawer, products, searchInput) {
    // This will be implemented by the UI module
    console.log('[Visual Search API] 🎯 Display all results:', products.length);
    
    const container = drawer?.querySelector('.visual-search-results-grid');
    if (container && products.length > 0) {
      container.innerHTML = products.map(product => `
        <div class="visual-search-product-card">
          <img src="${product.image || product.src}" alt="${product.title || product.name}" loading="lazy">
          <div class="visual-search-product-title">${product.title || product.name || 'Product'}</div>
          <div class="visual-search-product-price">${product.price || 'Price not available'}</div>
        </div>
      `).join('');
    }
  }

  function getCropData(container) {
    // This will be implemented by the UI module
    console.log('[Visual Search API] ✂️ Get crop data from container');
    
    const cropBox = container?.querySelector('#crop-box');
    if (!cropBox) return null;
    
    const imageState = window.VisualSearchConfig?.imageState || {};
    const rect = cropBox.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    return {
      x: (rect.left - containerRect.left) / imageState.scaleX,
      y: (rect.top - containerRect.top) / imageState.scaleY,
      width: rect.width / imageState.scaleX,
      height: rect.height / imageState.scaleY
    };
  }

  function trackAppBlockUsage(action, data) {
    // Analytics tracking stub
    console.log('[Visual Search API] 📊 Track usage:', action, data);
  }

  // ====================================================================
  // GLOBAL EXPORTS
  // ====================================================================

  // Expose API functions globally for other modules
  window.VisualSearchAPI = {
    // Main API functions
    performRealTimeCropAnalysis,
    performImmediateImageAnalysis,
    performImmediateFileAnalysis,
    performCroppedImageSearch,
    searchByResultImage,
    processImageFromUrlWithSelection,
    
    // Helper functions
    processApiResponse,
    getApiConfig
  };

  console.log('[Visual Search API] ✅ API module loaded');

})();