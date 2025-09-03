/**
 * Visual Search - Simple Split Version
 * Just the original code split into logical sections, no API changes
 */

// This file just loads all the split modules in the correct order
// The functionality remains 100% identical to the original

console.log('[Visual Search] Simple split version loading...');

// All the split files will be loaded by Liquid templates in this order:
// 1. visual-search-config.js
// 2. visual-search-utils.js  
// 3. visual-search-api.js
// 4. visual-search-ui.js
// 5. visual-search-styles.css

// The last module (UI) will expose the final window.visualSearchUnified object
// exactly as the original file did.

console.log('[Visual Search] Simple split loader complete');