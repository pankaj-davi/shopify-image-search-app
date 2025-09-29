import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { appBlockTracker } from "../services/app-block-tracking.service";

// CORS headers for cross-origin requests
const getCorsHeaders = () => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400"
});

// Handle OPTIONS preflight requests
export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: getCorsHeaders()
    });
  }
  
  return json({ 
    service: "cleanup-notification",
    status: "active",
    timestamp: new Date().toISOString()
  }, {
    headers: getCorsHeaders()
  });
}

export async function action({ request }: ActionFunctionArgs) {
  // Handle OPTIONS preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: getCorsHeaders()
    });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { 
      status: 405,
      headers: getCorsHeaders()
    });
  }

  try {
    const body = await request.json();
    const { shop, timestamp, userAgent, url, metadata , action } = body;

    // Save app block usage data to database for analytics
    if (shop) {
      try {
        // Parse metadata if it's a string
        let parsedMetadata = metadata;
        if (typeof metadata === 'string') {
          try {
            parsedMetadata = JSON.parse(metadata);
          } catch (e) {
            console.log('Could not parse metadata JSON:', e);
            parsedMetadata = { raw: metadata };
          }
        }

        await appBlockTracker.trackAppBlockUsage({
          shopDomain: shop,
          action: action || 'unknown',
          url: url || null,
          userAgent: userAgent || null,
          metadata: parsedMetadata || null,
          timestamp: timestamp || new Date().toISOString(),
        });
        
        console.log(`✅ App block usage tracked in database for ${shop}`);
      } catch (dbError) {
        console.error('❌ Failed to save usage data to database:', dbError);
        // Continue without failing the request
      }
    }

    return json({ 
      success: true, 
      message: "Cleanup notification received and logged",
      timestamp: new Date().toISOString()
    }, {
      headers: getCorsHeaders()
    });

  } catch (error) {
    console.error("❌ Error processing cleanup notification:", error);
    
    return json({ 
      success: false, 
      error: "Failed to process cleanup notification" 
    }, { 
      status: 500,
      headers: getCorsHeaders()
    });
  }
}
