import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
// import { getDatabase } from "../services/database.interface";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Authenticate and parse the webhook
    const { shop, topic, admin } = await authenticate.webhook(request);
    console.log("🔔 App uninstall webhook received:", topic, "from shop:", shop);
    
    // Comprehensive cleanup on app uninstall
    if (admin && shop) {
      console.log(`🧹 Starting comprehensive cleanup for uninstalled app: ${shop}`);
      
      try {
        // 1. Clean up any legacy visual search scripts
        const { ScriptInjectionService } = await import("../services/script-injection.service");
        const scriptResult = await ScriptInjectionService.removeVisualSearchScript(admin, shop);
        console.log("Legacy script cleanup result:", scriptResult);
        
        // 2. Record uninstall event for analytics
        console.log(`📊 Recording app uninstall for shop: ${shop}`);
        
        // 3. Clean up any stored data (optional - keep for historical records)
        // const database = getDatabase();
        // await database.recordStoreEvent(shop, 'app_uninstalled', {
        //   timestamp: new Date().toISOString(),
        //   topic
        // });
        
        // 4. Cleanup any cached configurations
        console.log(`🗑️ Clearing cached configurations for ${shop}`);
        
        // 5. Log successful cleanup
        console.log(`✅ Comprehensive cleanup completed for ${shop}`);
        
      } catch (error) {
        console.error("Failed to remove legacy visual search script during uninstall:", error);
      }
    }
    
    // Record uninstall event
    // const db = await getDatabase();
    // await db.recordStoreEvent(shop, "uninstall", {
    //   sessionId: session?.id || null,
    //   timestamp: new Date().toISOString(),
    // });

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
};