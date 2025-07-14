import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { ScriptInjectionService } from "../services/script-injection.service";
// import { getDatabase } from "../services/database.interface";



export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Authenticate and parse the webhook
    const { shop, session, topic, admin } = await authenticate.webhook(request);
    console.log("Webhook received for topic:", topic, "from shop:", shop , "with session:", session);
    
    // Clean up visual search script on uninstall
    if (admin && shop) {
      try {
        const scriptResult = await ScriptInjectionService.removeVisualSearchScript(admin, shop);
        console.log("Visual search script cleanup result:", scriptResult);
      } catch (error) {
        console.error("Failed to remove visual search script during uninstall:", error);
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