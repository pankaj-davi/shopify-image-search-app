/**
 * Visual Search UI Components Module
 * Contains all UI components, drawer creation, and visual interactions
 */
(function() {
  'use strict';

  // ====================================================================
  // HTML TEMPLATES
  // ====================================================================

  const DRAWER_TEMPLATE = `
    <div class="visual-search-drawer" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 2147483647;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      color: #333;
      opacity: 0;
      animation: fadeIn 0.3s ease forwards;
    ">
      <div class="visual-search-modal" style="
        background: white;
        border-radius: 16px;
        width: 90vw;
        max-width: 900px;
        height: 85vh;
        max-height: 600px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        display: flex;
        flex-direction: column;
        position: relative;
        transform: scale(0.9);
        animation: slideIn 0.3s ease forwards 0.1s;
      ">
        
        <!-- Header -->
        <div style="
          padding: 20px 24px 16px;
          border-bottom: 1px solid #e9e9e9;
          position: relative;
        ">
          <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #333;">Visual Search</h2>
          <p style="margin: 0; color: #666; font-size: 15px;">Upload an image or take a photo to find similar products</p>
          
          <!-- Close button -->
          <button id="close-drawer-x" style="
            position: absolute;
            top: 16px;
            right: 20px;
            background: none;
            border: none;
            font-size: 24px;
            color: #666;
            cursor: pointer;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
          " onmouseover="this.style.background='#f5f5f5'; this.style.color='#333';" onmouseout="this.style.background='none'; this.style.color='#666';">
            ×
          </button>
        </div>
        
        <!-- Content Area -->
        <div class="visual-search-modal-content" style="
          flex: 1;
          display: flex;
          overflow: hidden;
        ">
          
          <!-- Left Panel - Upload/Image Area -->
          <div class="visual-search-left-panel" style="
            flex: 1;
            padding: 24px;
            border-right: 1px solid #e9e9e9;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
          ">
            
            <!-- Upload Section -->
            <div id="upload-section" class="visual-search-section">
              
              <!-- Main Upload Area -->
              <div class="visual-search-main-upload" style="
                border: 2px dashed #ddd;
                border-radius: 16px;
                padding: 40px 20px;
                text-align: center;
                margin-bottom: 20px;
                transition: all 0.2s ease;
                cursor: pointer;
                position: relative;
                overflow: hidden;
              " onclick="document.getElementById('visual-search-file-input').click();">
                
                <div class="visual-search-upload-icon" style="
                  width: 64px;
                  height: 64px;
                  margin: 0 auto 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  background: #f8f9fa;
                  border-radius: 50%;
                ">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #666;">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </div>
                
                <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #333;">
                  Drop your image here
                </h3>
                <p style="margin: 0 0 24px 0; color: #666; font-size: 16px; max-width: 280px; margin-left: auto; margin-right: auto;">
                  or click to browse files from your device
                </p>
                
                <button style="
                  background: #008060;
                  color: white;
                  border: none;
                  padding: 14px 32px;
                  border-radius: 12px;
                  font-size: 15px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: all 0.2s ease;
                " onmouseover="this.style.background='#006b52';" onmouseout="this.style.background='#008060';">
                  Choose Image
                </button>
                
                <input type="file" id="visual-search-file-input" accept="image/*" style="display: none;">
              </div>
              
              <!-- Alternative Options -->
              <div class="visual-search-alt-buttons" style="
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 24px;
              ">
                
                <button id="camera-button" class="visual-search-alt-button" style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 12px;
                  padding: 16px;
                  border: 1px solid #e9e9e9;
                  background: white;
                  border-radius: 12px;
                  font-size: 14px;
                  color: #333;
                  cursor: pointer;
                  transition: all 0.2s ease;
                " onmouseover="this.style.background='#f8f9fa'; this.style.borderColor='#ddd';" onmouseout="this.style.background='white'; this.style.borderColor='#e9e9e9';">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                  Take Photo
                </button>
                
                <button id="url-button" class="visual-search-alt-button" style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 12px;
                  padding: 16px;
                  border: 1px solid #e9e9e9;
                  background: white;
                  border-radius: 12px;
                  font-size: 14px;
                  color: #333;
                  cursor: pointer;
                  transition: all 0.2s ease;
                " onmouseover="this.style.background='#f8f9fa'; this.style.borderColor='#ddd';" onmouseout="this.style.background='white'; this.style.borderColor='#e9e9e9';">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path>
                  </svg>
                  Use Image URL
                </button>
                
              </div>
              
            </div>
            
            <!-- Image Preview Section (Hidden initially) -->
            <div id="image-preview-section" class="visual-search-section" style="display: none;">
              
              <div id="image-selection-container" style="
                position: relative;
                background: #f8f9fa;
                border-radius: 12px;
                overflow: hidden;
                margin-bottom: 16px;
                min-height: 200px;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <img id="uploaded-image" style="
                  max-width: 100%;
                  max-height: 300px;
                  object-fit: contain;
                  border-radius: 8px;
                " />
              </div>
              
              <!-- Action Buttons -->
              <div class="visual-search-actions">
                <button id="analyze-full-button" style="
                  background: #008060;
                  color: white;
                  border: none;
                  padding: 14px 20px;
                  border-radius: 10px;
                  font-size: 14px;
                  font-weight: 500;
                  cursor: pointer;
                  margin-right: 12px;
                  margin-bottom: 8px;
                  transition: all 0.2s ease;
                " onmouseover="this.style.background='#006b52';" onmouseout="this.style.background='#008060';">
                  🔍 Analyze Full Image
                </button>
                
                <button id="crop-tool-button" style="
                  background: white;
                  color: #333;
                  border: 1px solid #e9e9e9;
                  padding: 14px 20px;
                  border-radius: 10px;
                  font-size: 14px;
                  font-weight: 500;
                  cursor: pointer;
                  margin-bottom: 8px;
                  transition: all 0.2s ease;
                " onmouseover="this.style.background='#f8f9fa'; this.style.borderColor='#ddd';" onmouseout="this.style.background='white'; this.style.borderColor='#e9e9e9';">
                  ✂️ Crop Selection
                </button>
              </div>
              
            </div>
            
          </div>
          
          <!-- Right Panel - Results Area -->
          <div class="visual-search-right-panel" style="
            flex: 2;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          ">
            
            <!-- Results Header -->
            <div class="visual-search-results-header" style="
              padding: 20px 24px 16px;
              border-bottom: 1px solid #f0f0f0;
              flex-shrink: 0;
            ">
              <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">
                Upload an image to get started
              </h3>
            </div>
            
            <!-- Results Container -->
            <div class="visual-search-results-container" style="
              flex: 1;
              overflow-y: auto;
              padding: 20px 24px;
            ">
              
              <!-- Results Grid -->
              <div class="visual-search-results-grid" style="
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
                grid-auto-rows: max-content;
              ">
                
                <!-- Empty State -->
                <div class="visual-search-empty-state" style="
                  grid-column: 1 / -1;
                  text-align: center;
                  padding: 60px 20px;
                  color: #999;
                ">
                  <div class="visual-search-empty-icon" style="
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8f9fa;
                    border-radius: 50%;
                  ">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: #ccc;">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21,15 16,10 5,21"></polyline>
                    </svg>
                  </div>
                  <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 500; color: #666;">
                    No results yet
                  </h3>
                  <p style="margin: 0; font-size: 14px; color: #999; max-width: 300px; margin-left: auto; margin-right: auto;">
                    Upload an image to find visually similar products
                  </p>
                </div>
                
              </div>
              
            </div>
            
          </div>
          
        </div>
        
      </div>
      
      <!-- Mobile Expand Button (Hidden by default) -->
      <button id="mobile-expand-toggle" style="display: none; position: fixed; bottom: 20px; right: 20px; background: #008060; color: white; border: none; border-radius: 50%; width: 56px; height: 56px; font-size: 24px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 2147483648;">
        ↗️
      </button>
      
    </div>

    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideIn {
        from { transform: scale(0.9) translateY(20px); opacity: 0; }
        to { transform: scale(1) translateY(0); opacity: 1; }
      }
      
      .visual-search-main-upload:hover {
        border-color: #008060 !important;
        background: #f8fff8 !important;
      }
      
      .visual-search-main-upload:active {
        transform: scale(0.99);
      }
    </style>
  `;

  // ====================================================================
  // DRAWER MANAGEMENT
  // ====================================================================

  async function openVisualSearchDrawer(searchInput) {
    console.log('[Visual Search UI] 🚀 Opening visual search drawer...');
    
    // Remove any existing drawer
    const existingDrawer = document.querySelector('.visual-search-drawer');
    if (existingDrawer) {
      console.log('[Visual Search UI] 🗑️ Removing existing drawer');
      existingDrawer.remove();
    }
    
    try {
      // Create drawer element
      const drawerDiv = document.createElement('div');
      drawerDiv.innerHTML = DRAWER_TEMPLATE;
      const drawer = drawerDiv.firstElementChild;
      
      // Append to body
      document.body.appendChild(drawer);
      console.log('[Visual Search UI] ✅ Drawer created and appended');
      
      // Apply theme colors if available
      await applyThemeColorsToDrawer(drawer);
      
      // Setup event listeners
      setupDrawerEventListeners(drawer, searchInput);
      
      // Initialize mobile functionality
      initializeMobileExpand(drawer);
      
      // Focus management
      drawer.focus();
      
      console.log('[Visual Search UI] 🎯 Drawer setup complete');
      return drawer;
      
    } catch (error) {
      console.error('[Visual Search UI] ❌ Failed to open drawer:', error);
      window.VisualSearchUtils?.showError?.('Failed to open visual search. Please try again.');
      return null;
    }
  }

  function setupDrawerEventListeners(drawer, searchInput) {
    console.log('[Visual Search UI] 🎧 Setting up event listeners...');
    
    // Close button
    const closeButton = drawer.querySelector('#close-drawer-x');
    if (closeButton) {
      closeButton.addEventListener('click', () => closeDrawer(drawer));
    }
    
    // Click outside to close
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) {
        closeDrawer(drawer);
      }
    });
    
    // Escape key to close
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeDrawer(drawer);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    // File input
    const fileInput = drawer.querySelector('#visual-search-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => handleFileSelection(e, drawer, searchInput));
    }
    
    // Camera button (mobile)
    const cameraButton = drawer.querySelector('#camera-button');
    if (cameraButton && window.VisualSearchUtils?.isMobileDevice?.()) {
      cameraButton.addEventListener('click', () => {
        if (fileInput) {
          fileInput.setAttribute('capture', 'environment');
          fileInput.click();
        }
      });
    }
    
    // URL button
    const urlButton = drawer.querySelector('#url-button');
    if (urlButton) {
      urlButton.addEventListener('click', () => openUrlInputDialog(drawer, searchInput));
    }
    
    // Drag and drop
    const uploadArea = drawer.querySelector('.visual-search-main-upload');
    if (uploadArea) {
      setupDragAndDrop(uploadArea, drawer, searchInput);
    }
    
    // Action buttons
    setupActionButtons(drawer, searchInput);
  }

  function closeDrawer(drawer) {
    console.log('[Visual Search UI] 🚪 Closing drawer...');
    
    if (drawer) {
      drawer.style.opacity = '0';
      drawer.style.transform = 'scale(0.95)';
      
      setTimeout(() => {
        if (drawer.parentNode) {
          drawer.parentNode.removeChild(drawer);
        }
        console.log('[Visual Search UI] ✅ Drawer closed and removed');
      }, 200);
    }
  }

  // ====================================================================
  // FILE HANDLING
  // ====================================================================

  async function handleFileSelection(event, drawer, searchInput) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('[Visual Search UI] 📁 File selected:', file.name, file.type, file.size);
    
    // Validate file
    const validation = window.VisualSearchUtils?.validateImageFile?.(file) || { valid: true };
    if (!validation.valid) {
      window.VisualSearchUtils?.showError?.(validation.error || 'Invalid file');
      return;
    }
    
    // Show image preview
    await showImagePreview(drawer, file, searchInput);
    
    // Trigger immediate analysis if API module is available
    if (window.VisualSearchAPI?.performImmediateImageAnalysis) {
      await window.VisualSearchAPI.performImmediateImageAnalysis(drawer, file, searchInput);
    }
  }

  async function showImagePreview(drawer, file, searchInput) {
    console.log('[Visual Search UI] 🖼️ Showing image preview...');
    
    try {
      // Create image URL
      const imageUrl = window.VisualSearchUtils?.createImageURL?.(file) || URL.createObjectURL(file);
      
      // Update image state
      const uploadedImage = drawer.querySelector('#uploaded-image');
      if (uploadedImage) {
        uploadedImage.src = imageUrl;
        uploadedImage.onload = () => {
          if (window.VisualSearchConfig?.updateImageState) {
            window.VisualSearchConfig.updateImageState(uploadedImage);
          }
        };
      }
      
      // Switch to preview section
      const uploadSection = drawer.querySelector('#upload-section');
      const previewSection = drawer.querySelector('#image-preview-section');
      
      if (uploadSection && previewSection) {
        uploadSection.style.display = 'none';
        previewSection.style.display = 'block';
        console.log('[Visual Search UI] 🔄 Switched to preview section');
      }
      
      // Update results header
      const resultsHeader = drawer.querySelector('.visual-search-results-header h3');
      if (resultsHeader) {
        resultsHeader.textContent = 'Analyzing image...';
      }
      
    } catch (error) {
      console.error('[Visual Search UI] ❌ Failed to show image preview:', error);
      window.VisualSearchUtils?.showError?.('Failed to preview image. Please try again.');
    }
  }

  function setupActionButtons(drawer, searchInput) {
    // Analyze full image button
    const analyzeButton = drawer.querySelector('#analyze-full-button');
    if (analyzeButton) {
      analyzeButton.addEventListener('click', async () => {
        const fileInput = drawer.querySelector('#visual-search-file-input');
        const file = fileInput?.files?.[0];
        
        if (file && window.VisualSearchAPI?.performImmediateImageAnalysis) {
          await window.VisualSearchAPI.performImmediateImageAnalysis(drawer, file, searchInput);
        }
      });
    }
    
    // Crop tool button
    const cropButton = drawer.querySelector('#crop-tool-button');
    if (cropButton) {
      cropButton.addEventListener('click', () => {
        const imageContainer = drawer.querySelector('#image-selection-container');
        const uploadedImage = drawer.querySelector('#uploaded-image');
        
        if (imageContainer && uploadedImage) {
          addCropBox(imageContainer, uploadedImage);
        }
      });
    }
  }

  // ====================================================================
  // DRAG AND DROP
  // ====================================================================

  function setupDragAndDrop(uploadArea, drawer, searchInput) {
    console.log('[Visual Search UI] 🎯 Setting up drag and drop...');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => highlight(uploadArea), false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => unhighlight(uploadArea), false);
    });
    
    uploadArea.addEventListener('drop', (e) => handleDrop(e, drawer, searchInput), false);
  }

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight(uploadArea) {
    uploadArea.style.borderColor = '#008060';
    uploadArea.style.background = '#f0fff0';
  }

  function unhighlight(uploadArea) {
    uploadArea.style.borderColor = '#ddd';
    uploadArea.style.background = 'transparent';
  }

  function handleDrop(e, drawer, searchInput) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
      const file = files[0];
      console.log('[Visual Search UI] 📥 File dropped:', file.name);
      
      // Simulate file input change
      const fileInput = drawer.querySelector('#visual-search-file-input');
      if (fileInput) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        
        // Trigger file selection handler
        handleFileSelection({ target: { files: [file] } }, drawer, searchInput);
      }
    }
  }

  // ====================================================================
  // CROP BOX FUNCTIONALITY
  // ====================================================================

  function addCropBox(container, img) {
    console.log('[Visual Search UI] ✂️ Adding crop box...');
    
    // Remove existing crop box
    const existingCropBox = container.querySelector('#crop-box');
    if (existingCropBox) {
      existingCropBox.remove();
    }
    
    // Create crop box
    const cropBox = document.createElement('div');
    cropBox.id = 'crop-box';
    cropBox.className = 'crop-box';
    cropBox.style.cssText = `
      position: absolute;
      border: 3px solid #008060;
      cursor: grab;
      box-sizing: border-box;
      touch-action: none;
      background: rgba(0, 128, 96, 0.1);
      border-radius: 8px;
      box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.3);
      min-width: 50px;
      min-height: 50px;
      width: 150px;
      height: 150px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    `;
    
    container.appendChild(cropBox);
    
    // Add resize handles
    addResizeHandles(cropBox);
    
    // Setup interaction
    setupCropBoxInteraction(cropBox, container);
    
    console.log('[Visual Search UI] ✅ Crop box added');
  }

  function addResizeHandles(cropBox) {
    // Corner handles
    const corners = ['nw', 'ne', 'sw', 'se'];
    corners.forEach(corner => {
      const handle = document.createElement('div');
      handle.className = `resize-handle-corner`;
      handle.dataset.position = corner;
      handle.style.cssText = `
        position: absolute;
        width: 12px;
        height: 12px;
        background: #008060;
        border: 2px solid white;
        border-radius: 50%;
        cursor: ${corner === 'nw' || corner === 'se' ? 'nw-resize' : 'ne-resize'};
      `;
      
      // Position corners
      switch(corner) {
        case 'nw': handle.style.top = '-6px'; handle.style.left = '-6px'; break;
        case 'ne': handle.style.top = '-6px'; handle.style.right = '-6px'; break;
        case 'sw': handle.style.bottom = '-6px'; handle.style.left = '-6px'; break;
        case 'se': handle.style.bottom = '-6px'; handle.style.right = '-6px'; break;
      }
      
      cropBox.appendChild(handle);
    });
  }

  function setupCropBoxInteraction(cropBox, container) {
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startLeft, startTop, startWidth, startHeight;
    let resizeHandle = null;
    
    function getEventXY(e) {
      return {
        x: e.type.includes('touch') ? e.touches[0].clientX : e.clientX,
        y: e.type.includes('touch') ? e.touches[0].clientY : e.clientY
      };
    }
    
    function constrainToContainer(left, top, width, height) {
      const containerRect = container.getBoundingClientRect();
      const maxLeft = containerRect.width - width;
      const maxTop = containerRect.height - height;
      
      return {
        left: Math.max(0, Math.min(left, maxLeft)),
        top: Math.max(0, Math.min(top, maxTop)),
        width: Math.max(50, Math.min(width, containerRect.width)),
        height: Math.max(50, Math.min(height, containerRect.height))
      };
    }
    
    function startDrag(e) {
      if (e.target.classList.contains('resize-handle-corner')) {
        isResizing = true;
        resizeHandle = e.target.dataset.position;
      } else {
        isDragging = true;
        cropBox.style.cursor = 'grabbing';
      }
      
      const pos = getEventXY(e);
      const rect = cropBox.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      startX = pos.x;
      startY = pos.y;
      startLeft = rect.left - containerRect.left;
      startTop = rect.top - containerRect.top;
      startWidth = rect.width;
      startHeight = rect.height;
      
      e.preventDefault();
    }
    
    function drag(e) {
      if (!isDragging && !isResizing) return;
      
      const pos = getEventXY(e);
      const deltaX = pos.x - startX;
      const deltaY = pos.y - startY;
      
      if (isDragging) {
        const constrained = constrainToContainer(
          startLeft + deltaX,
          startTop + deltaY,
          startWidth,
          startHeight
        );
        
        cropBox.style.left = constrained.left + 'px';
        cropBox.style.top = constrained.top + 'px';
        
      } else if (isResizing && resizeHandle) {
        let newLeft = startLeft, newTop = startTop;
        let newWidth = startWidth, newHeight = startHeight;
        
        switch(resizeHandle) {
          case 'se':
            newWidth = startWidth + deltaX;
            newHeight = startHeight + deltaY;
            break;
          case 'sw':
            newWidth = startWidth - deltaX;
            newHeight = startHeight + deltaY;
            newLeft = startLeft + deltaX;
            break;
          case 'ne':
            newWidth = startWidth + deltaX;
            newHeight = startHeight - deltaY;
            newTop = startTop + deltaY;
            break;
          case 'nw':
            newWidth = startWidth - deltaX;
            newHeight = startHeight - deltaY;
            newLeft = startLeft + deltaX;
            newTop = startTop + deltaY;
            break;
        }
        
        const constrained = constrainToContainer(newLeft, newTop, newWidth, newHeight);
        
        cropBox.style.left = constrained.left + 'px';
        cropBox.style.top = constrained.top + 'px';
        cropBox.style.width = constrained.width + 'px';
        cropBox.style.height = constrained.height + 'px';
      }
      
      e.preventDefault();
    }
    
    function stopDrag() {
      isDragging = false;
      isResizing = false;
      resizeHandle = null;
      cropBox.style.cursor = 'grab';
      
      // Trigger crop analysis if API is available
      if (window.VisualSearchAPI?.performRealTimeCropAnalysis) {
        window.VisualSearchAPI.performRealTimeCropAnalysis(container);
      }
    }
    
    // Event listeners
    cropBox.addEventListener('mousedown', startDrag);
    cropBox.addEventListener('touchstart', startDrag, { passive: false });
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
    
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
  }

  // ====================================================================
  // MOBILE EXPAND FUNCTIONALITY
  // ====================================================================

  function initializeMobileExpand(drawer) {
    if (!window.VisualSearchUtils?.isMobileDevice?.()) return;
    
    console.log('[Visual Search UI] 📱 Initializing mobile expand functionality...');
    
    const expandButton = drawer.querySelector('#mobile-expand-toggle');
    const modalContent = drawer.querySelector('.visual-search-modal-content');
    const leftPanel = drawer.querySelector('.visual-search-left-panel');
    const rightPanel = drawer.querySelector('.visual-search-right-panel');
    
    if (!expandButton || !modalContent) return;
    
    let isExpanded = false;
    
    const toggleExpanded = () => {
      isExpanded = !isExpanded;
      
      if (isExpanded) {
        // Show only results
        leftPanel.style.display = 'none';
        rightPanel.style.flex = '1';
        rightPanel.style.maxHeight = '100vh';
        expandButton.innerHTML = '↙️';
        modalContent.classList.add('mobile-results-expanded');
      } else {
        // Show both panels
        leftPanel.style.display = 'flex';
        rightPanel.style.flex = '2';
        rightPanel.style.maxHeight = '35vh';
        expandButton.innerHTML = '↗️';
        modalContent.classList.remove('mobile-results-expanded');
      }
    };
    
    expandButton.addEventListener('click', toggleExpanded);
    
    // Show expand button when results are present
    const observer = new MutationObserver(() => {
      const hasResults = drawer.querySelectorAll('.visual-search-product-card').length > 0;
      expandButton.style.display = hasResults ? 'flex' : 'none';
    });
    
    observer.observe(drawer.querySelector('.visual-search-results-grid'), {
      childList: true,
      subtree: true
    });
  }

  // ====================================================================
  // THEME APPLICATION
  // ====================================================================

  async function applyThemeColorsToDrawer(drawer) {
    console.log('[Visual Search UI] 🎨 Applying theme colors to drawer...');
    
    try {
      // Get theme configuration
      const themeResult = window.VisualSearchUtils?.getThemeConfigFromAppBlocks?.() || { config: {}, source: 'default' };
      const themeConfig = themeResult.config;
      
      if (Object.keys(themeConfig).length === 0) {
        console.log('[Visual Search UI] ⚠️ No theme configuration found, using defaults');
        return;
      }
      
      // Apply colors to buttons
      const primaryButtons = drawer.querySelectorAll('[style*="background: #008060"], [style*="background:#008060"]');
      primaryButtons.forEach(button => {
        if (themeConfig.primaryColor) {
          button.style.background = themeConfig.primaryColor;
        }
      });
      
      // Apply icon colors
      const icons = drawer.querySelectorAll('svg');
      icons.forEach(icon => {
        if (themeConfig.iconColor && icon.style.color !== 'white') {
          icon.style.color = themeConfig.iconColor;
        }
      });
      
      console.log('[Visual Search UI] ✅ Theme colors applied:', themeConfig);
      
    } catch (error) {
      console.error('[Visual Search UI] ❌ Failed to apply theme colors:', error);
    }
  }

  // ====================================================================
  // URL INPUT DIALOG
  // ====================================================================

  function openUrlInputDialog(drawer, searchInput) {
    console.log('[Visual Search UI] 🔗 Opening URL input dialog...');
    
    const urlDialog = document.createElement('div');
    urlDialog.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483650;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          background: white;
          padding: 24px;
          border-radius: 12px;
          max-width: 400px;
          width: 90vw;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        ">
          <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Enter Image URL</h3>
          <input type="url" id="url-input" placeholder="https://example.com/image.jpg" style="
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            margin-bottom: 16px;
            box-sizing: border-box;
          ">
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button id="url-cancel" style="
              padding: 10px 20px;
              border: 1px solid #ddd;
              background: white;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
            ">Cancel</button>
            <button id="url-submit" style="
              padding: 10px 20px;
              background: #008060;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
            ">Load Image</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(urlDialog);
    
    const input = urlDialog.querySelector('#url-input');
    const cancelBtn = urlDialog.querySelector('#url-cancel');
    const submitBtn = urlDialog.querySelector('#url-submit');
    
    input.focus();
    
    const closeDialog = () => {
      if (urlDialog.parentNode) {
        urlDialog.parentNode.removeChild(urlDialog);
      }
    };
    
    cancelBtn.addEventListener('click', closeDialog);
    
    submitBtn.addEventListener('click', async () => {
      const url = input.value.trim();
      if (url && window.VisualSearchAPI?.processImageFromUrlWithSelection) {
        closeDialog();
        await window.VisualSearchAPI.processImageFromUrlWithSelection(url, searchInput, drawer);
      }
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        submitBtn.click();
      } else if (e.key === 'Escape') {
        closeDialog();
      }
    });
    
    // Close on backdrop click
    urlDialog.addEventListener('click', (e) => {
      if (e.target === urlDialog) {
        closeDialog();
      }
    });
  }

  // ====================================================================
  // RESULTS DISPLAY
  // ====================================================================

  function updateResultsHeader(drawer, text, count) {
    const header = drawer?.querySelector('.visual-search-results-header h3');
    if (header) {
      header.textContent = text;
    }
  }

  function showSkeletonLoaders(drawer) {
    const resultsGrid = drawer?.querySelector('.visual-search-results-grid');
    if (!resultsGrid) return;
    
    // Clear existing content
    resultsGrid.innerHTML = '';
    
    // Add skeleton cards
    for (let i = 0; i < 6; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'visual-search-skeleton';
      skeleton.style.cssText = `
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: visual-search-skeleton-pulse 1.5s ease-in-out infinite;
        height: 160px;
        border-radius: 8px;
      `;
      resultsGrid.appendChild(skeleton);
    }
  }

  function removeSkeletonLoaders(drawer) {
    const skeletons = drawer?.querySelectorAll('.visual-search-skeleton');
    skeletons?.forEach(skeleton => skeleton.remove());
  }

  function displayAllResults(drawer, products, searchInput) {
    const resultsGrid = drawer?.querySelector('.visual-search-results-grid');
    if (!resultsGrid || !products.length) return;
    
    // Clear existing content
    resultsGrid.innerHTML = '';
    
    // Create product cards
    products.forEach(product => {
      const card = createProductCard(product);
      resultsGrid.appendChild(card);
    });
    
    console.log('[Visual Search UI] 🎯 Displayed', products.length, 'products');
  }

  function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'visual-search-product-card';
    card.style.cssText = `
      border-radius: 12px;
      overflow: hidden;
      background: white;
      border: 1px solid #e9e9e9;
      transition: all 0.2s ease;
      cursor: pointer;
    `;
    
    card.innerHTML = `
      <img src="${product.image || product.src || product.image_url}" 
           alt="${product.title || product.name || 'Product'}" 
           style="width: 100%; height: 120px; object-fit: cover;"
           loading="lazy">
      <div style="padding: 12px;">
        <div class="visual-search-product-title" style="
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 4px;
          color: #333;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        ">${product.title || product.name || 'Product'}</div>
        <div class="visual-search-product-price" style="
          font-size: 14px;
          font-weight: 600;
          color: #008060;
        ">${product.price || 'Price not available'}</div>
      </div>
    `;
    
    // Add click handler to open product
    card.addEventListener('click', () => {
      if (product.url || product.handle) {
        const productUrl = product.url || `${window.location.origin}/products/${product.handle}`;
        window.open(productUrl, '_blank');
      }
    });
    
    // Add hover effects
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'none';
    });
    
    return card;
  }

  // ====================================================================
  // GLOBAL EXPORTS
  // ====================================================================

  // Keep the same global structure - expose functions directly like original
  // Don't change the API at all
  
  console.log('[Visual Search UI] ✅ UI module loaded');

})();