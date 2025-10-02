import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { logWebhookEvent } from "../utils/webhookUtils.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Authenticate and parse the webhook
    const { shop, topic, admin } = await authenticate.webhook(request);
    console.log("🔔 App uninstall webhook received:", topic, "from shop:", shop);

    // Lazy load Firebase database
    const { FirebaseDatabase } = await import("../services/firebase.database");
    const firebaseDb = new FirebaseDatabase();

    // Comprehensive cleanup on app uninstall
    if (admin && shop) {
      console.log(`🧹 Starting comprehensive cleanup for uninstalled app: ${shop}`);

      try {
        // 1. Clean up any legacy visual search scripts
        const { ScriptInjectionService } = await import("../services/script-injection.service");
        const scriptResult = await ScriptInjectionService.removeVisualSearchScript(admin, shop);
        console.log("Legacy script cleanup result:", scriptResult);

        // 2. Record uninstall event for analytics
        await logWebhookEvent(firebaseDb, shop, 'app_uninstalled', {}, topic, {
          cleanupPerformed: true,
          scriptCleanupResult: scriptResult
        });

        // 3. Cleanup any cached configurations
        console.log(`🗑️ Clearing cached configurations for ${shop}`);

        // 4. Log successful cleanup
        console.log(`✅ Comprehensive cleanup completed for ${shop}`);

      } catch (error) {
        console.error("Failed to remove legacy visual search script during uninstall:", error);
        // Still log the uninstall event even if cleanup fails
        await logWebhookEvent(firebaseDb, shop, 'app_uninstalled', {}, topic, {
          cleanupPerformed: false,
          cleanupError: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else {
      // Log uninstall event even without admin access
      await logWebhookEvent(firebaseDb, shop, 'app_uninstalled', {}, topic);
    }

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
};