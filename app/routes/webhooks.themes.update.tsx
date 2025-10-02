import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { logWebhookEvent } from "../utils/webhookUtils.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Authenticate the webhook
    const { shop, topic, payload } = await authenticate.webhook(request);
    console.log(`🎨 Theme update webhook received from ${shop}:`, topic);

    console.log("Theme data:", {
      id: payload.id,
      name: payload.name,
      role: payload.role,
      updated_at: payload.updated_at
    });

    // Lazy load Firebase database
    const { FirebaseDatabase } = await import("../services/firebase.database");
    const firebaseDb = new FirebaseDatabase();

    // Check if this is the main theme
    if (payload.role === 'main') {
      console.log(`🔍 Main theme updated for ${shop} - checking for app block presence`);

      try {
        // Record theme update event for analytics
        await logWebhookEvent(firebaseDb, shop, 'theme_updated', payload, topic, {
          themeId: payload.id,
          themeName: payload.name,
          themeRole: payload.role,
          updatedAt: payload.updated_at,
          isMainTheme: true
        });

        console.log(`✅ Theme update event logged for ${shop}`);

      } catch (error) {
        console.error(`❌ Error processing theme update for ${shop}:`, error);
      }
    } else {
      // Log non-main theme updates as well
      await logWebhookEvent(firebaseDb, shop, 'theme_updated', payload, topic, {
        themeId: payload.id,
        themeName: payload.name,
        themeRole: payload.role,
        updatedAt: payload.updated_at,
        isMainTheme: false
      });
    }

    return new Response("Theme update processed", { status: 200 });

  } catch (error) {
    console.error("❌ Error processing theme update webhook:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
};
