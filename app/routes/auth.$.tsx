import type { LoaderFunctionArgs } from "@remix-run/node";
import { getDatabase } from "../services/database.interface";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log('Loader function triggered');
const { session } = await authenticate.admin(request);
  console.log('Session retrieved:', session);
  const db = await getDatabase();
  console.log('Database instance obtained');
  await db.recordStoreEvent(session.shop, "install", {
    sessionId: session.id,
  });
  console.log('recordStoreEvent called');

  return null;
};
