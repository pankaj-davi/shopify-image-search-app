import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Authenticate the webhook
    const { shop, topic } = await authenticate.webhook(request);
    console.log(`🎨 Theme update webhook received from ${shop}:`, topic);
    
    // Parse the webhook payload
    const themeData = await request.json();
    console.log("Theme data:", {
      id: themeData.id,
      name: themeData.name,
      role: themeData.role,
      updated_at: themeData.updated_at
    });
    
    // Check if this is the main theme
    if (themeData.role === 'main') {
      console.log(`🔍 Main theme updated for ${shop} - checking for app block presence`);
      
      try {
        // Record theme update event for analytics
        console.log(`📝 Recording theme update event for analytics`);
        
        // Optional: Check if visual search app blocks are still present
        // This would require making API calls to Shopify to analyze theme files
        // For now, we rely on the client-side cleanup monitoring
        
        // You could implement theme file analysis here:
        // const themeFiles = await shopify.rest.Asset.all({
        //   session,
        //   theme_id: themeData.id,
        // });
        // 
        // const hasVisualSearchBlocks = themeFiles.some(file => 
        //   file.key.includes('visual-search') || 
        //   (file.value && file.value.includes('data-visual-search-trigger'))
        // );
        
        // Record in database for tracking
        try {
          const { appDatabase } = await import("../services/app.database.service");
          
          // Record the theme update event
          const themeUpdateEvent = {
            shop,
            themeId: themeData.id,
            themeName: themeData.name,
            themeRole: themeData.role,
            updatedAt: themeData.updated_at,
            webhookTimestamp: new Date().toISOString()
          };
          
          console.log(`📊 Theme update event logged:`, themeUpdateEvent);
          
          // Optional: Update store with latest theme info
          // await appDatabase.updateStore(shop, { 
          //   lastThemeUpdate: themeUpdateEvent 
          // });
          
        } catch (dbError) {
          console.error(`❌ Database error recording theme update:`, dbError);
        }
        
      } catch (error) {
        console.error(`❌ Error processing theme update for ${shop}:`, error);
      }
    }
    
    return new Response("Theme update processed", { status: 200 });
    
  } catch (error) {
    console.error("❌ Error processing theme update webhook:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
};
