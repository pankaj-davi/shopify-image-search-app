import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
// import { getDatabase } from "../services/database.interface";



export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Authenticate and parse the webhook
    const { shop, session, topic } = await authenticate.webhook(request);
    console.log("Webhook received for topic:", topic, "from shop:", shop , "with session:", session);
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