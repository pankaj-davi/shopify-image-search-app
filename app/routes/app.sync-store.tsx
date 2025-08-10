import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { fullSyncAction } from "../utils/shopifyData.server";

export async function action({ request, params, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const result = await fullSyncAction({ request, params, context });
    return json(result);
  } catch (error: any) {
    return json({ 
      success: false, 
      error: error?.message || "Sync failed"
    }, { status: 500 });
  }
}
