import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { appBlockTracker } from "../services/app-block-tracking.service";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { shop, action: cleanupAction, timestamp, userAgent, url, metadata } = body;

    const USER_AGENT_TRUNCATE_LENGTH = 100;

    console.log(`🧹 Cleanup notification received:`, {
      shop,
      action: cleanupAction,
      timestamp,
      url,
      userAgent: userAgent?.substring(0, USER_AGENT_TRUNCATE_LENGTH)
    });

    // Save app block usage data to database for analytics
    if (shop) {
      try {
        await appBlockTracker.trackAppBlockUsage({
          shopDomain: shop,
          blockType: 'visual_search',
          action: cleanupAction === 'app_block_removed' ? 'removed' : 
                 cleanupAction === 'app_block_added' ? 'added' :
                 cleanupAction === 'visual_search_used' ? 'used' : 'viewed',
          url: url || null,
          userAgent: userAgent?.substring(0, 500) || null, // Longer for database
          metadata: metadata || null,
          sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
        
        console.log(`✅ App block usage tracked in database for ${shop}`);
      } catch (dbError) {
        console.error('❌ Failed to save usage data to database:', dbError);
        // Continue without failing the request
      }
    }

    // Log specific events for monitoring
    if (shop && cleanupAction === 'app_block_removed') {
      console.log(`📊 App block removed from store: ${shop} at ${url}`);
    }

    return json({ 
      success: true, 
      message: "Cleanup notification received and logged",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Error processing cleanup notification:", error);
    
    return json({ 
      success: false, 
      error: "Failed to process cleanup notification" 
    }, { 
      status: 500 
    });
  }
}

// Handle GET requests (for health checks)
export async function loader() {
  return json({ 
    service: "cleanup-notification",
    status: "active",
    timestamp: new Date().toISOString()
  });
}
