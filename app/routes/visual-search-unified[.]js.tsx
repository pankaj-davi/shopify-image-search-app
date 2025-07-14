import type { LoaderFunctionArgs } from '@remix-run/node';
import { visualSearchScript } from '../lib/visual-search-script.server';
import { appDatabase } from '../services/app.database.service';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop') || '';
  const timestamp = url.searchParams.get('t') || Date.now().toString();

  // Get the actual app URL from the request or environment - prioritize the request URL
  const requestAppUrl = `${url.protocol}//${url.host}`;
  const appUrl = process.env.SHOPIFY_APP_URL || requestAppUrl;

  console.log(
    `[Script Serving] Loading script for shop: ${shop}, timestamp: ${timestamp}`
  );
  console.log(
    `[Script Serving] App URL from env: ${process.env.SHOPIFY_APP_URL}`
  );
  console.log(`[Script Serving] App URL from request: ${requestAppUrl}`);
  console.log(`[Script Serving] Final App URL: ${appUrl}`);

  // Get theme configuration for this shop from database
  let themeConfig = {};
  try {
    const shopData = await appDatabase.getStore(shop);
    console.log(`[Script Serving] Raw shop data:`, shopData);
    if (shopData && shopData.themeConfig) {
      themeConfig = shopData.themeConfig;
      console.log(`[Script Serving] Loaded theme config:`, themeConfig);
    } else {
      console.log(
        `[Script Serving] No theme config found for shop: ${shop}. ShopData exists: ${!!shopData}, Has themeConfig: ${!!(shopData && shopData.themeConfig)}`
      );
    }
  } catch (error) {
    console.error('Failed to load theme config for shop:', shop, error);
  }

  // Configure the script with shop-specific settings and theme
  const configuredScript = `
    // Visual Search Script - Generated at ${new Date().toISOString()}
    // Shop: ${shop}
    // Config: ${JSON.stringify(themeConfig)}
    
    window.VISUAL_SEARCH_CONFIG = {
      appUrl: '${appUrl}',
      shopDomain: '${shop}',
      theme: ${JSON.stringify(themeConfig)}
    };
    
    ${visualSearchScript}
  `;

  return new Response(configuredScript, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0', // Aggressive no-cache
      Pragma: 'no-cache',
      Expires: '0',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      ETag: `"${timestamp}"`, // Use timestamp as ETag for cache busting
    },
  });
}
