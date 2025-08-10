import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getSyncProgress } from "../utils/shopifyData.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);
    const shopDomain = session.shop;
    
    const progress = await getSyncProgress(shopDomain);
    return json(progress);
  } catch (error: any) {
    return json({
      success: false,
      error: error?.message || "Failed to get sync progress"
    }, { status: 500 });
  }
}
