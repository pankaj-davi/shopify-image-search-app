import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { logWebhookEvent, validateWebhookPayload } from "../utils/webhookUtils.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { shop, topic, payload } = await authenticate.webhook(request);
    console.log("🔔 Shop update webhook received:", topic, "from shop:", shop);

    if (!validateWebhookPayload(payload, shop)) {
      return new Response("Missing required data", { status: 400 });
    }

    // Lazy load Firebase database
    const { FirebaseDatabase } = await import("../services/firebase.database");
    const firebaseDb = new FirebaseDatabase();

    // Log shop update event with relevant data
    await logWebhookEvent(firebaseDb, shop, 'shop_updated', payload, topic, {
      shopName: payload.name,
      shopEmail: payload.email,
      domain: payload.domain,
      myshopifyDomain: payload.myshopify_domain,
      planName: payload.plan_name,
      planDisplayName: payload.plan_display_name,
      currency: payload.currency,
      timezone: payload.timezone,
      ianaTimezone: payload.iana_timezone,
      shopOwner: payload.shop_owner,
      address1: payload.address1,
      city: payload.city,
      country: payload.country,
      countryCode: payload.country_code,
      province: payload.province,
      provinceCode: payload.province_code,
      zip: payload.zip,
      phone: payload.phone
    });

    // Update store data in Firebase
    try {
      await firebaseDb.updateStore(shop, {
        name: payload.name,
        email: payload.email,
        myshopifyDomain: payload.myshopify_domain,
        currencyCode: payload.currency,
        timezoneAbbreviation: payload.timezone,
        plan: payload.plan_display_name || payload.plan_name
      });
      console.log(`✅ Store data updated in Firebase for ${shop}`);
    } catch (error) {
      console.error(`❌ Failed to update store data in Firebase:`, error);
    }

    return new Response("Shop webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("❌ Error processing shop update webhook:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
};
