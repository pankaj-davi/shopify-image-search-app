// ====================================================================
// EXTRACTED API AND NETWORK-RELATED FUNCTIONS
// ====================================================================
// This file contains all API and network-related functions extracted from
// visual-search-unified-backup-without-search-selector.js

// ====================================================================
// CONFIGURATION
// ====================================================================

// Use global API URL from config module if available
const GLOBAL_API_BASE_URL = window.VisualSearchConfig?.GLOBAL_API_BASE_URL || 'https://treaty-herein-theories-thinking.trycloudflare.com';

const CONFIG = {
  // App configuration - Dynamic values from Liquid template
  APP_URL: window.VISUAL_SEARCH_CONFIG?.appUrl || 'https://cash-customise-longitude-scope.trycloudflare.com',
  EXTERNAL_API_URL: `${GLOBAL_API_BASE_URL}/api/product-handle`,
  SHOP_DOMAIN: window.VISUAL_SEARCH_CONFIG?.shopDomain || 'pixel-dress-store.myshopify.com',
  
  // File upload settings - Static limits
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
};

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
// NOTIFICATION HELPERS
// ====================================================================
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existing = document.querySelectorAll('.visual-search-notification');
  existing.forEach(el => el.remove());
  
  const toast = document.createElement('div');
  toast.className = 'visual-search-notification';
  
  // Basic notification styles (fallback if STYLES is not available)
  const baseStyles = {
    info: 'position: fixed; top: 20px; right: 20px; background: #2196F3; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; transform: translateX(100%); transition: transform 0.3s ease; max-width: 300px; font-size: 14px;',
    success: 'position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; transform: translateX(100%); transition: transform 0.3s ease; max-width: 300px; font-size: 14px;',
    error: 'position: fixed; top: 20px; right: 20px; background: #f44336; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; transform: translateX(100%); transition: transform 0.3s ease; max-width: 300px; font-size: 14px;'
  };
  
  toast.style.cssText = (window.STYLES && window.STYLES.notification) ? window.STYLES.notification(type) : baseStyles[type] || baseStyles.info;
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
// UI HELPER FUNCTIONS
// ====================================================================
function updateResultsHeader(drawer, title, description) {
  drawer.querySelector('#results-title').textContent = title;
  drawer.querySelector('#results-count').textContent = description;
}

function clearResults(drawer) {
  const resultsGrid = drawer.querySelector('#results-grid');
  resultsGrid.innerHTML = '';
}

function createSkeletonCard() {
  const skeletonCard = document.createElement('div');
  skeletonCard.className = 'skeleton-card';
  skeletonCard.style.cssText = `
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    margin-bottom: 16px;
    height: 180px;
    position: relative;
  `;
  
  skeletonCard.innerHTML = `
    <div style="
      aspect-ratio: 1;
      width: 100%;
      height: 100px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: visual-search-skeleton-pulse 1.5s ease-in-out infinite;
      border-radius: 12px 12px 0 0;
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
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: visual-search-skeleton-pulse 1.5s ease-in-out infinite;
        border-radius: 4px;
        width: 60%;
      "></div>
    </div>
  `;
  
  return skeletonCard;
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
    helper: Math.max(0, Math.min(1, relativeHeight))
  };
}

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

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'visual-search-product-card';
  card.style.cssText = `
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    margin-bottom: 16px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    position: relative;
  `;
  
  const imageUrl = product.image || product.imageUrl || (product.images && product.images[0] && product.images[0].url) || '';
  const productName = product.name || product.title || 'Product';
  const productPrice = product.price || 'Price not available';
  
  card.innerHTML = `
    <img src="${imageUrl}" alt="${productName}" style="
      width: 100%;
      height: 140px;
      object-fit: cover;
      border-radius: 12px 12px 0 0;
      display: block;
    " onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNGNUY1RjUiLz48L3N2Zz4=';">
    <div style="padding: 12px;">
      <div style="font-size: 14px; font-weight: 500; color: #333; margin-bottom: 4px; line-height: 1.4;">${productName}</div>
      <div style="font-size: 16px; font-weight: 600; color: #008060;">${productPrice}</div>
    </div>
  `;
  
  // Add hover effects
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-2px)';
    card.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0)';
    card.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
  });
  
  // Add click handler if product has URL
  if (product.url || product.handle) {
    card.addEventListener('click', () => {
      const url = product.url || (product.handle ? `/products/${product.handle}` : '#');
      if (url !== '#') {
        window.open(url, '_blank');
      }
    });
  }
  
  return card;
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
  const initialProducts = products.slice(0, drawer._itemsPerPage || 20);
  initialProducts.forEach(product => {
      const productCard = createProductCard(product);
      resultsGrid.appendChild(productCard);
  });
}

function setupInfiniteScroll(drawer) {
  // Basic infinite scroll implementation stub
  // This would be implemented by the UI module or main script
  console.log('[Visual Search API] Infinite scroll setup (stub implementation)');
  
  // Try to use global implementation if available
  if (window.VisualSearchUI?.setupInfiniteScroll) {
    window.VisualSearchUI.setupInfiniteScroll(drawer);
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

function showLargestDetection(drawer, largestDetection) {
  // This function would show bounding box for detected items
  // Implementation depends on UI framework and styling system
  console.log('[Visual Search] Showing largest detection:', largestDetection);
}

// ====================================================================
// MAIN API FUNCTIONS
// ====================================================================

/**
 * Real-time API call when user crops or resizes
 * This function is triggered when the user adjusts the crop box
 */
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
    
    // If not found, try modal content
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

/**
 * Immediate API call when file is uploaded
 * This function is triggered immediately when a user uploads an image
 */
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

/**
 * Helper function to handle actual file analysis
 * Makes the actual API call to analyze the uploaded image
 */
async function performImmediateFileAnalysis(drawer, imageFile, searchInput) {
  // Prepare form data for immediate analysis
  const formData = new FormData();
  formData.append('file', imageFile);
  // formData.append('analyze', 'true');
  
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
  
  // Extract detection data from API response using centralized image state
  const detections = result.detections || [];
  const largestDetection = result.largest_detection || null;
  
  console.log('[Visual Search] 🎯 Detections found:', detections.length);
  console.log('[Visual Search] 📍 Largest detection:', largestDetection);
  
  // Show largest detection bounding box if available (but not when crop box is active)
  const cropBox = drawer.querySelector('#crop-box');
  if (largestDetection && largestDetection.bbox && imageState.element && !cropBox) {
    showLargestDetection(drawer, largestDetection);
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

/**
 * API call for cropped image search
 * This function analyzes a specific cropped area of the uploaded image
 */
async function performCroppedImageSearch(drawer, searchInput, cropData) {
  try {
    updateResultsHeader(drawer, 'Analyzing cropped area...', 'Detecting items in the selected area...');
    clearResults(drawer);
    showSkeletonLoaders(drawer);
    
    const formData = new FormData();
    formData.append('file', drawer._imageFile);
    // formData.append('cropData', JSON.stringify(cropData));
    // formData.append('analyze', 'true');
    
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

/**
 * Search using a result image
 * This function allows using a search result image for a new search
 */
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
    
    // Update the uploaded image display (delegate to UI module if available)
    if (window.VisualSearchUI?.showImagePreview) {
      window.VisualSearchUI.showImagePreview(drawer, fakeFile, searchInput);
    } else {
      console.log('[Visual Search API] showImagePreview not available, skipping preview update');
    }
    
    // Update UI to show that we're using a new image
    updateResultsHeader(drawer, 'New search starting...', 'Using selected result image for search');
    
    showSuccess('Image updated! Crop and adjust the area to search.');
    
  } catch (error) {
    console.error('Search by result image error:', error);
    showError('Could not use this image for search. Please try again.');
  }
}

/**
 * Process image from URL with automatic analysis
 * This function handles images loaded from URLs (like search results or pasted URLs)
 */
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
    
    // Show image preview immediately (delegate to UI module if available)
    if (window.VisualSearchUI?.showImagePreview) {
      window.VisualSearchUI.showImagePreview(drawer, fakeFile, searchInput);
    } else {
      console.log('[Visual Search API] showImagePreview not available, skipping preview update');
    }
    
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

/**
 * Track app block usage - Analytics/cleanup API call
 */
function trackAppBlockUsage(action, metadata = {}) {
  try {
    const finalUrl = `${CONFIG.APP_URL}/api/cleanup-notification`;

    fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        shop: CONFIG.SHOP_DOMAIN,
        action: `app_block_${action}`,
        timestamp: new Date().toISOString(),
        metadata: metadata
      })
    }).catch(error => {
      console.log('[Visual Search] Analytics tracking failed (non-critical):', error);
    });
  } catch (error) {
    console.log('[Visual Search] Analytics tracking error (non-critical):', error);
  }
}

// ====================================================================
// GLOBAL EXPORTS (for browser usage)
// ====================================================================

// Expose API functions globally for use by other modules
window.VisualSearchAPI = {
  // Main API functions
  performRealTimeCropAnalysis,
  performImmediateImageAnalysis,
  performImmediateFileAnalysis,
  performCroppedImageSearch,
  searchByResultImage,
  processImageFromUrlWithSelection,
  
  // Utility functions
  trackAppBlockUsage,
  getCropData,
  updateImageState,
  createFallbackSearchInput,
  
  // UI helpers
  updateResultsHeader,
  clearResults,
  showSkeletonLoaders,
  removeSkeletonLoaders,
  displayAllResults,
  showSearchResults,
  setupInfiniteScroll,
  createProductCard,
  createSkeletonCard,
  showLargestDetection,
  
  // Notification helpers
  showNotification,
  showError,
  showSuccess,
  
  // Configuration and state
  getConfig: () => CONFIG,
  getImageState: () => imageState,
  GLOBAL_API_BASE_URL
};

// Also expose configuration globally
window.VisualSearchAPIConfig = {
  CONFIG,
  imageState,
  updateImageState,
  GLOBAL_API_BASE_URL
};

// ====================================================================
// MODULE EXPORTS (for Node.js compatibility)
// ====================================================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Main API functions
    performRealTimeCropAnalysis,
    performImmediateImageAnalysis,
    performImmediateFileAnalysis,
    performCroppedImageSearch,
    searchByResultImage,
    processImageFromUrlWithSelection,
    
    // Utility functions
    trackAppBlockUsage,
    getCropData,
    updateImageState,
    createFallbackSearchInput,
    
    // UI helpers
    updateResultsHeader,
    clearResults,
    showSkeletonLoaders,
    removeSkeletonLoaders,
    displayAllResults,
    showSearchResults,
    setupInfiniteScroll,
    createProductCard,
    createSkeletonCard,
    showLargestDetection,
    
    // Notification helpers
    showNotification,
    showError,
    showSuccess,
    
    // Configuration
    CONFIG,
    imageState,
    GLOBAL_API_BASE_URL
  };
}

console.log('[Visual Search API] ✅ Extracted API functions loaded');