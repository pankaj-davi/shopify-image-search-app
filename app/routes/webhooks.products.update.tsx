import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { transformShopifyProductToFirebase } from "../utils/productTransform.server";
import { validateWebhookPayload, logWebhookEvent, syncProductToExternalAPI } from "../utils/webhookUtils.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { shop, topic, payload } = await authenticate.webhook(request);
    console.log("🔔 Product update webhook received:", topic, "from shop:", shop);

    if (!validateWebhookPayload(payload, shop)) {
      return new Response("Missing required data", { status: 400 });
    }

    // Lazy load Firebase database to avoid module-level initialization
    const { FirebaseDatabase } = await import("../services/firebase.database");
    const firebaseDb = new FirebaseDatabase();

    // Transform Shopify product data to our ProductData format
    const productData = transformShopifyProductToFirebase(payload, shop);

    // Update existing product in Firebase
    const updateSuccess = await firebaseDb.updateProductByShopifyId(shop, payload.id.toString(), productData);

    if (!updateSuccess) {
      // Create new product if not found (fallback)
      const productId = await firebaseDb.createProduct(productData);
      console.log(`✅ Product created in Firebase (fallback): ${productId}`);
    }

    // Record the webhook event
    await logWebhookEvent(firebaseDb, shop, 'product_updated', payload, topic);

    // Sync to external API
    await syncProductToExternalAPI(shop, [payload.id.toString()], 'update');

    return new Response("Product update webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("❌ Error processing product update webhook:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
};