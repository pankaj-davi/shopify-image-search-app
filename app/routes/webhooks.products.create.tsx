import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { FirebaseDatabase } from "../services/firebase.database";
import { transformShopifyProductToFirebase } from "../utils/productTransform.server";
import { validateWebhookPayload, logWebhookEvent, syncProductToExternalAPI } from "../utils/webhookUtils.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { shop, topic, payload } = await authenticate.webhook(request);
    console.log("🔔 Product create webhook received:", topic, "from shop:", shop);

    if (!validateWebhookPayload(payload, shop)) {
      return new Response("Missing required data", { status: 400 });
    }

    // Initialize Firebase database
    const firebaseDb = new FirebaseDatabase();

    // Transform Shopify product data to our ProductData format
    const productData = transformShopifyProductToFirebase(payload, shop);

    // Save product to Firebase
    const productId = await firebaseDb.createProduct(productData);
    console.log(`✅ Product created in Firebase with ID: ${productId}`);

    // Record the webhook event
    await logWebhookEvent(firebaseDb, shop, 'product_created', payload, topic);

    // Sync to external API
    await syncProductToExternalAPI(shop, [payload.id.toString()], 'create');

    return new Response("Product webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("❌ Error processing product create webhook:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
};