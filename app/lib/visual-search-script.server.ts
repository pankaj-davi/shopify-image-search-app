// This file provides the visual search script content for server-side rendering
// It reads the unified browser script and makes it available as a module export

import { readFileSync } from 'fs';
import { join } from 'path';

// Read the unified script file content - try backup file first, then fallback to original
const scriptPaths = [
  join(process.cwd(), 'public', 'visual-search-unified-backup.js'),
  join(process.cwd(), 'public', 'visual-search-unified.js'),
];

let scriptContent = '';

for (const scriptPath of scriptPaths) {
  try {
    scriptContent = readFileSync(scriptPath, 'utf-8');
    console.log(`✅ Loaded visual search script from: ${scriptPath}`);
    break;
  } catch (error) {
    console.log(`⚠️ Could not read from ${scriptPath}, trying next...`);
  }
}

if (!scriptContent) {
  console.error(
    '❌ Failed to read visual search unified script from any location'
  );
  scriptContent = `
    console.warn('Visual search unified script could not be loaded');
    (function() {
      if (typeof window === 'undefined') return;
      console.log('Visual search functionality is currently unavailable');
    })();
  `;
}

export const visualSearchScript = scriptContent;
