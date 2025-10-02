import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { logWebhookEvent, validateWebhookPayload } from "../utils/webhookUtils.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { shop, topic, payload, } = await authenticate.webhook(request);
    console.log("🔔 Bulk operation finished webhook received:", topic, "from shop:", shop);

    if (!validateWebhookPayload(payload, shop)) {
      return new Response("Missing required data", { status: 400 });
    }

    // Lazy load Firebase database
    const { FirebaseDatabase } = await import("../services/firebase.database");
    const firebaseDb = new FirebaseDatabase();

    console.log("Bulk operation details:", {
      id: payload.id,
      status: payload.status,
      error_code: payload.error_code,
      completed_at: payload.completed_at,
      type: payload.type,
      url: payload.url
    });

    // Log bulk operation completion event
    await logWebhookEvent(firebaseDb, shop, 'bulk_operation_finished', payload, topic, {
      operationId: payload.id,
      operationStatus: payload.status,
      operationType: payload.type,
      errorCode: payload.error_code,
      completedAt: payload.completed_at,
      resultUrl: payload.url,
      objectCount: payload.object_count || 0
    });

    // If the operation was successful and it's a product-related bulk operation, you can process the results
    if (payload.status === 'completed' && payload.url) {
      console.log(`✅ Bulk operation completed successfully for ${shop}`);

      // Optional: Download and process the bulk operation results
      // This is useful if you want to sync the imported products to your database
      // You would need to fetch the JSONL file from payload.url and process it

      // Example structure for future implementation:
      // if (admin && payload.type === 'mutation') {
      //   try {
      //     const response = await fetch(payload.url);
      //     const jsonlData = await response.text();
      //     // Process JSONL data line by line
      //     // Each line is a JSON object representing a product or operation result
      //   } catch (error) {
      //     console.error('Failed to process bulk operation results:', error);
      //   }
      // }
    } else if (payload.error_code) {
      console.error(`❌ Bulk operation failed for ${shop}:`, payload.error_code);
    }

    return new Response("Bulk operation webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("❌ Error processing bulk operation webhook:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
};
