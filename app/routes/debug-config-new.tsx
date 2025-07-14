import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { appDatabase } from "../services/app.database.service";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  const url = new URL(request.url);
  const requestAppUrl = `${url.protocol}//${url.host}`;
  const envAppUrl = process.env.SHOPIFY_APP_URL;
  
  console.log(`[Debug Config] Request for shop: ${session.shop}`);
  console.log(`[Debug Config] Environment URL: ${envAppUrl}`);
  console.log(`[Debug Config] Request URL: ${requestAppUrl}`);
  
  // Get current shop data from database
  const shopData = await appDatabase.getStore(session.shop);
  console.log(`[Debug Config] Shop data:`, shopData);
  
  return json({
    shop: session.shop,
    envAppUrl,
    requestAppUrl,
    shopData,
    timestamp: new Date().toISOString()
  });
}

export default function DebugConfig() {
  const data = useLoaderData<typeof loader>();
  
  return (
    <div style={{ fontFamily: "monospace", padding: "20px", backgroundColor: "#f5f5f5" }}>
      <h1>🔧 Debug Configuration</h1>
      
      <div style={{ marginBottom: "20px" }}>
        <h2>URLs</h2>
        <p><strong>Environment SHOPIFY_APP_URL:</strong> {data.envAppUrl || 'Not set'}</p>
        <p><strong>Request URL:</strong> {data.requestAppUrl}</p>
        <p><strong>Final App URL:</strong> {data.envAppUrl || data.requestAppUrl}</p>
      </div>
      
      <div style={{ marginBottom: "20px" }}>
        <h2>Shop Information</h2>
        <p><strong>Shop Domain:</strong> {data.shop}</p>
        <p><strong>Timestamp:</strong> {data.timestamp}</p>
      </div>
      
      <div style={{ marginBottom: "20px" }}>
        <h2>Database Configuration</h2>
        <pre style={{ backgroundColor: "white", padding: "10px", border: "1px solid #ccc", overflow: "auto" }}>
          {JSON.stringify(data.shopData, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: "20px" }}>
        <h2>Test Script URL</h2>
        <p>
          <a 
            href={`${data.envAppUrl || data.requestAppUrl}/visual-search-unified.js?shop=${data.shop}&t=${Date.now()}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "blue", textDecoration: "underline" }}
          >
            Open Visual Search Script (New Tab)
          </a>
        </p>
      </div>
      
      <div>
        <h2>Expected Script Configuration</h2>
        <pre style={{ backgroundColor: "white", padding: "10px", border: "1px solid #ccc", overflow: "auto" }}>
{`window.VISUAL_SEARCH_CONFIG = {
  appUrl: '${data.envAppUrl || data.requestAppUrl}',
  shopDomain: '${data.shop}',
  theme: ${JSON.stringify(data.shopData?.themeConfig || {}, null, 2)}
};`}
        </pre>
      </div>
    </div>
  );
}
