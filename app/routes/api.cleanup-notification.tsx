import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { shop, action: cleanupAction, timestamp, userAgent, url } = body;

    const USER_AGENT_TRUNCATE_LENGTH = 100; // Maximum length for user agent logging

    console.log(`🧹 Cleanup notification received:`, {
      shop,
      action: cleanupAction,
      timestamp,
      url,
      userAgent: userAgent?.substring(0, USER_AGENT_TRUNCATE_LENGTH) // Truncate for logging
    });

    // Log the cleanup event for analytics
    if (shop && cleanupAction === 'app_block_removed') {
      console.log(`📊 App block removed from store: ${shop} at ${url}`);
      
      // For now, just log the event - database tracking can be added later
      console.log(`✅ App block removal logged for ${shop}`);
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
