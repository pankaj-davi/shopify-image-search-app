import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { validateWebhookPayload, logWebhookEvent, syncProductToExternalAPI } from "../utils/webhookUtils.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { shop, topic, payload } = await authenticate.webhook(request);
    console.log("🔔 Product delete webhook received:", topic, "from shop:", shop);

    if (!validateWebhookPayload(payload, shop)) {
      return new Response("Missing required data", { status: 400 });
    }

    // Lazy load Firebase database to avoid module-level initialization
    const { FirebaseDatabase } = await import("../services/firebase.database");
    const firebaseDb = new FirebaseDatabase();

    // Delete the product from Firebase
    const deleteSuccess = await firebaseDb.deleteProductByShopifyId(shop, payload.id.toString());
    console.log(payload , "payloadpayloadpayloadpayloadpayloadpayloadpayloadpayload")
    if (!deleteSuccess) {
      console.log(`⚠️ Product not found in Firebase for deletion: ${payload.id}`);
    }

    // Record the webhook event
    await logWebhookEvent(firebaseDb, shop, 'product_deleted', payload, topic);

    // Sync to external API
    await syncProductToExternalAPI(shop, [payload.id.toString()], 'delete');

    return new Response("Product delete webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("❌ Error processing product delete webhook:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
};