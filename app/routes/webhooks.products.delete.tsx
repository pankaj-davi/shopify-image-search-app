import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { forwardWebhookToPython, validateWebhook } from "../utils/pythonWebhook.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { shop, topic, payload } = await authenticate.webhook(request);
    console.log("🔔 Product delete webhook received:", topic, "from shop:", shop);

    if (!validateWebhook(payload, shop)) {
      return new Response("Missing required data", { status: 400 });
    }

    // Forward to Python server
    await forwardWebhookToPython('delete', shop, payload.id);

    return new Response("Product webhook forwarded successfully", { status: 200 });
  } catch (error) {
    console.error("❌ Error processing product delete webhook:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
};