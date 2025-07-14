export class ScriptInjectionService {
  private static readonly SCRIPT_TAG_DISPLAY_SCOPE = "ALL";

  /**
   * Get the app URL dynamically
   */
  private static getAppUrl(): string {
    // Use environment variable first, then fall back to current Cloudflare tunnel
    return process.env.SHOPIFY_APP_URL || "https://dna-dts-teams-niger.trycloudflare.com";
  }

  /**
   * Remove all visual search scripts from a Shopify store
   */
  static async removeAllVisualSearchScripts(admin: any, shopDomain: string) {
    try {
      console.log(`[Script Cleanup] Removing all visual search scripts for shop: ${shopDomain}`);
      
      // Find all visual search scripts (including old ones with different URLs)
      const existingScripts = await admin.graphql(`
        query {
          scriptTags(first: 50) {
            edges {
              node {
                id
                src
                displayScope
              }
            }
          }
        }
      `);

      const existingScriptData = await existingScripts.json();
      const visualSearchScripts = existingScriptData.data.scriptTags.edges.filter(
        (edge: any) => edge.node.src.includes('/visual-search-script.js') || 
                      edge.node.src.includes('/visual-search-unified.js')
      );

      console.log(`[Script Cleanup] Found ${visualSearchScripts.length} visual search scripts to remove`);

      if (visualSearchScripts.length === 0) {
        return { success: true, message: "No visual search scripts found to remove" };
      }

      // Remove all visual search scripts
      const removePromises = visualSearchScripts.map(async (script: any) => {
        console.log(`[Script Cleanup] Removing script: ${script.node.src}`);
        
        const deleteScriptMutation = await admin.graphql(`
          mutation scriptTagDelete($id: ID!) {
            scriptTagDelete(id: $id) {
              deletedScriptTagId
              userErrors {
                field
                message
              }
            }
          }
        `, {
          variables: {
            id: script.node.id
          }
        });

        return await deleteScriptMutation.json();
      });

      const deleteResults = await Promise.all(removePromises);
      const errors = deleteResults.filter(result => 
        result.data.scriptTagDelete.userErrors.length > 0
      );

      if (errors.length > 0) {
        console.error("[Script Cleanup] Errors removing scripts:", errors);
        return { 
          success: false, 
          error: "Some scripts could not be removed"
        };
      }

      console.log(`[Script Cleanup] Successfully removed ${visualSearchScripts.length} visual search scripts`);
      return { 
        success: true, 
        message: `Removed ${visualSearchScripts.length} old visual search scripts`
      };

    } catch (error) {
      console.error("[Script Cleanup] Error removing visual search scripts:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  /**
   * Inject visual search script into a Shopify store
   */
  static async injectVisualSearchScript(admin: any, shopDomain: string, appUrl?: string) {
    try {
      // First, remove all existing visual search scripts
      const cleanupResult = await this.removeAllVisualSearchScripts(admin, shopDomain);
      if (!cleanupResult.success) {
        console.error("[Script Injection] Failed to cleanup old scripts:", cleanupResult.error);
        // Continue anyway - try to inject new script
      } else {
        console.log("[Script Injection] Cleanup completed:", cleanupResult.message);
      }

      // Build script URL with shop parameter and cache-busting timestamp
      const timestamp = Date.now();
      const finalAppUrl = appUrl || this.getAppUrl();
      const scriptTagSrc = `${finalAppUrl}/visual-search-unified.js?shop=${encodeURIComponent(shopDomain)}&t=${timestamp}`;

      console.log(`[Script Injection] Injecting new script for shop: ${shopDomain}`);
      console.log(`[Script Injection] Using App URL: ${finalAppUrl}`);
      console.log(`[Script Injection] Script URL: ${scriptTagSrc}`);

      // Create new script tag
      const createScriptMutation = await admin.graphql(`
        mutation scriptTagCreate($input: ScriptTagInput!) {
          scriptTagCreate(input: $input) {
            scriptTag {
              id
              src
              displayScope
            }
            userErrors {
              field
              message
            }
          }
        }
      `, {
        variables: {
          input: {
            src: scriptTagSrc,
            displayScope: this.SCRIPT_TAG_DISPLAY_SCOPE
          }
        }
      });

      const result = await createScriptMutation.json();
      
      if (result.data.scriptTagCreate.userErrors.length > 0) {
        const errorMessages = result.data.scriptTagCreate.userErrors
          .map((error: any) => `${error.field}: ${error.message}`)
          .join(', ');
        console.error("Error creating script tag:", result.data.scriptTagCreate.userErrors);
        return { 
          success: false, 
          error: `Script injection failed: ${errorMessages}`
        };
      }

      console.log(`Visual search script injected successfully for shop: ${shopDomain}`);
      return { 
        success: true, 
        message: "Visual search script successfully activated! The camera icon will now appear in all search bars on your store.",
        scriptTag: result.data.scriptTagCreate.scriptTag 
      };

    } catch (error) {
      console.error("Error injecting visual search script:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  /**
   * Remove visual search script from a Shopify store
   */
  static async removeVisualSearchScript(admin: any, shopDomain: string) {
    try {
      // Find the script to remove
      const existingScripts = await admin.graphql(`
        query {
          scriptTags(first: 10) {
            edges {
              node {
                id
                src
                displayScope
              }
            }
          }
        }
      `);

      const existingScriptData = await existingScripts.json();
      const scriptToRemove = existingScriptData.data.scriptTags.edges.find(
        (edge: any) => edge.node.src.includes('/visual-search-script.js') || 
                      edge.node.src.includes('/visual-search-unified.js')
      );

      if (!scriptToRemove) {
        console.log(`No visual search script found for shop: ${shopDomain}`);
        return { success: true, message: "No script to remove" };
      }

      // Delete the script tag
      const deleteScriptMutation = await admin.graphql(`
        mutation scriptTagDelete($id: ID!) {
          scriptTagDelete(id: $id) {
            deletedScriptTagId
            userErrors {
              field
              message
            }
          }
        }
      `, {
        variables: {
          id: scriptToRemove.node.id
        }
      });

      const result = await deleteScriptMutation.json();
      
      if (result.data.scriptTagDelete.userErrors.length > 0) {
        console.error("Error deleting script tag:", result.data.scriptTagDelete.userErrors);
        return { 
          success: false, 
          error: result.data.scriptTagDelete.userErrors 
        };
      }

      console.log(`Visual search script removed successfully for shop: ${shopDomain}`);
      return { 
        success: true, 
        deletedId: result.data.scriptTagDelete.deletedScriptTagId 
      };

    } catch (error) {
      console.error("Error removing visual search script:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  /**
   * Generate the visual search script content
   */
  static generateVisualSearchScript(appUrl: string, shopDomain: string) {
    return `
(function() {
  // Universal Visual Search Icon Injection
  const APP_URL = '${appUrl}';
  const SHOP_DOMAIN = '${shopDomain}';
  
  function injectVisualSearchIcon() {
    // Find ALL search inputs regardless of theme
    const searchSelectors = [
      'input[type="search"]',
      'input[name*="search"]',
      'input[placeholder*="search" i]',
      'input[class*="search"]',
      'input[id*="search"]',
      '[role="searchbox"]',
      '.search-input',
      '#search',
      '.header-search input'
    ];
    
    const searchInputs = document.querySelectorAll(searchSelectors.join(','));
    
    searchInputs.forEach(input => {
      // Skip if already injected
      if (input.closest('.search-container')?.querySelector('.visual-search-icon')) return;
      if (input.dataset.visualSearchInjected) return;

      // Mark as injected
      input.dataset.visualSearchInjected = 'true';

      // Make parent container relative
      const container = input.closest('form, div, .search-form, .search-wrapper') || input.parentElement;
      if (!container) return;
      
      const containerStyle = getComputedStyle(container);
      if (containerStyle.position === 'static') {
        container.style.position = 'relative';
      }

      // Add padding to prevent text overlap
      const currentPadding = parseInt(getComputedStyle(input).paddingRight) || 0;
      input.style.paddingRight = (Math.max(currentPadding, 40)) + 'px';

      // Create and inject icon
      const icon = createVisualSearchIcon(input);
      container.appendChild(icon);
    });
  }

  // Create icon element
  function createVisualSearchIcon(input) {
    const icon = document.createElement('div');
    icon.className = 'visual-search-icon';
    icon.setAttribute('aria-label', 'Visual Search');
    icon.setAttribute('role', 'button');
    icon.setAttribute('tabindex', '0');
    
    icon.style.cssText = \`
      position: absolute;
      top: 50%;
      right: 10px;
      transform: translateY(-50%);
      width: 24px;
      height: 24px;
      background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 21-4.35-4.35"/></svg>') no-repeat center center / contain;
      cursor: pointer;
      z-index: 10;
      opacity: 0.7;
      transition: opacity 0.2s ease;
      pointer-events: auto;
    \`;
    
    // Hover effect
    icon.addEventListener('mouseenter', () => {
      icon.style.opacity = '1';
    });
    
    icon.addEventListener('mouseleave', () => {
      icon.style.opacity = '0.7';
    });
    
    // Click handler
    const handleClick = () => {
      openVisualSearch(input);
    };
    
    icon.addEventListener('click', handleClick);
    icon.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    });
    
    return icon;
  }

  // Open visual search interface
  function openVisualSearch(searchInput) {
    // Create file input for image upload
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        // Show loading state
        showLoadingState(searchInput);
        
        // Upload and process image
        const formData = new FormData();
        formData.append('image', file);
        formData.append('shop', SHOP_DOMAIN);
        
        const response = await fetch(\`\${APP_URL}/api/visual-search\`, {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.success && result.searchQuery) {
          // Fill search input with generated query
          searchInput.value = result.searchQuery;
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          
          // Trigger search
          const form = searchInput.closest('form');
          if (form) {
            form.dispatchEvent(new Event('submit', { bubbles: true }));
          }
        } else {
          showError('Could not process image. Please try again.');
        }
      } catch (error) {
        console.error('Visual search error:', error);
        showError('Something went wrong. Please try again.');
      } finally {
        hideLoadingState(searchInput);
      }
    });
    
    // Trigger file selection
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  }
  
  function showLoadingState(input) {
    const icon = input.parentElement?.querySelector('.visual-search-icon');
    if (icon) {
      icon.style.opacity = '0.5';
      icon.style.pointerEvents = 'none';
    }
  }
  
  function hideLoadingState(input) {
    const icon = input.parentElement?.querySelector('.visual-search-icon');
    if (icon) {
      icon.style.opacity = '0.7';
      icon.style.pointerEvents = 'auto';
    }
  }
  
  function showError(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.style.cssText = \`
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
    \`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  // Auto-inject when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectVisualSearchIcon);
  } else {
    injectVisualSearchIcon();
  }

  // Handle dynamic content (AJAX loads)
  let observer;
  function startObserver() {
    if (observer) observer.disconnect();
    
    observer = new MutationObserver((mutations) => {
      let shouldReinject = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (let node of mutation.addedNodes) {
            if (node.nodeType === 1) { // Element node
              const hasSearchInput = node.matches && node.matches('input[type="search"], input[name*="search"]') ||
                                   node.querySelector && node.querySelector('input[type="search"], input[name*="search"]');
              if (hasSearchInput) {
                shouldReinject = true;
                break;
              }
            }
          }
        }
      });
      
      if (shouldReinject) {
        setTimeout(injectVisualSearchIcon, 100);
      }
    });
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: false,
      characterData: false
    });
  }
  
  startObserver();
  
  // Reinject on page transitions (SPA handling)
  let currentUrl = location.href;
  setInterval(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      setTimeout(injectVisualSearchIcon, 500);
    }
  }, 1000);
})();
`;
  }
}
