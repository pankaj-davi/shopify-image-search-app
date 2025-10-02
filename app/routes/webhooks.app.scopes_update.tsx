import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { sessionStorage } from "../session-storage.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { payload, topic, shop } = await authenticate.webhook(request);
    console.log(`Received ${topic} webhook for ${shop}`);

    const current = payload.current as string[];
    if (shop && current) {
        const newScope = current.join(',');
        const updated = await sessionStorage.updateSessionScope(shop, newScope);

        if (updated) {
            console.log(`✅ Updated scopes for ${shop} to: ${newScope}`);
        } else {
            console.warn(`⚠️ Failed to update scopes for ${shop}`);
        }
    }
    return new Response();
};
