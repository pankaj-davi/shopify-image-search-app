import { FirebaseDatabase } from "../services/firebase.database";

export async function logWebhookEvent(
  firebaseDb: FirebaseDatabase,
  shopDomain: string,
  eventType: string,
  payload: any,
  topic: string
) {
  try {
    await firebaseDb.recordStoreEvent(shopDomain, eventType, {
      productId: payload.id,
      productTitle: payload.title || 'Unknown',
      timestamp: new Date().toISOString(),
      webhookTopic: topic
    });
  } catch (error) {
    console.error(`❌ Failed to log webhook event ${eventType}:`, error);
  }
}

export async function syncProductToExternalAPI(shopDomain: string, productIds: string[], action: 'create' | 'update' | 'delete'): Promise<void> {
  try {
    console.log(`🔄 Syncing products to external API: ${action} - ${productIds.join(', ')}`);

    const response = await fetch(`${process.env.SHOPIFY_APP_EMBEDDINGS_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shopDomain,
        productIds,
        action
      }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(`❌ External API sync failed: ${response.status} ${response.statusText}`);
    } else {
      console.log(`✅ External API sync successful for shop: ${shopDomain}, action: ${action}`);
    }
  } catch (error) {
    console.error(`❌ Error calling external API sync:`, error);
  }
}

export function validateWebhookPayload(payload: any, shop: string | undefined): boolean {
  if (!payload || !shop) {
    console.error("❌ Missing payload or shop data");
    return false;
  }
  return true;
}