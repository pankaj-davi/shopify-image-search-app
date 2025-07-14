import type { LoaderFunctionArgs } from "@remix-run/node";
import { visualSearchScript } from "../lib/visual-search-script.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "";
  
  // Get the actual app URL from the request or environment
  const appUrl = process.env.SHOPIFY_APP_URL || `${url.protocol}//${url.host}`;

  // Configure the script with shop-specific settings
  const configuredScript = `
    window.VISUAL_SEARCH_CONFIG = {
      appUrl: '${appUrl}',
      shopDomain: '${shop}'
    };
    
    ${visualSearchScript}
  `;

  return new Response(configuredScript, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type"
    },
  });
}
