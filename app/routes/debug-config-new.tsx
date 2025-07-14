import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { appDatabase } from "../services/app.database.service";
import { Page, Card, BlockStack, Text, Link, Box } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

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
    <Page>
      <TitleBar title="🔧 Debug Configuration" />
      <BlockStack gap="500">
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">URLs</Text>
            <Box>
              <Text as="p"><Text as="span" fontWeight="semibold">Environment SHOPIFY_APP_URL:</Text> {data.envAppUrl || 'Not set'}</Text>
              <Text as="p"><Text as="span" fontWeight="semibold">Request URL:</Text> {data.requestAppUrl}</Text>
              <Text as="p"><Text as="span" fontWeight="semibold">Final App URL:</Text> {data.envAppUrl || data.requestAppUrl}</Text>
            </Box>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Shop Information</Text>
            <Box>
              <Text as="p"><Text as="span" fontWeight="semibold">Shop Domain:</Text> {data.shop}</Text>
              <Text as="p"><Text as="span" fontWeight="semibold">Timestamp:</Text> {data.timestamp}</Text>
            </Box>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Database Configuration</Text>
            <Box 
              background="bg-surface-secondary" 
              padding="400" 
              borderRadius="200"
              borderWidth="025"
              borderColor="border"
            >
              <pre style={{ margin: 0, fontSize: "12px", fontFamily: "monospace", overflow: "auto" }}>
                {JSON.stringify(data.shopData, null, 2)}
              </pre>
            </Box>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Test Script URL</Text>
            <Box>
              <Link 
                url={`${data.envAppUrl || data.requestAppUrl}/visual-search-unified.js?shop=${data.shop}&t=${Date.now()}`}
                external
              >
                Open Visual Search Script (New Tab)
              </Link>
            </Box>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Expected Script Configuration</Text>
            <Box 
              background="bg-surface-secondary" 
              padding="400" 
              borderRadius="200"
              borderWidth="025"
              borderColor="border"
            >
              <pre style={{ margin: 0, fontSize: "12px", fontFamily: "monospace", overflow: "auto" }}>
{`window.VISUAL_SEARCH_CONFIG = {
  appUrl: '${data.envAppUrl || data.requestAppUrl}',
  shopDomain: '${data.shop}',
  theme: ${JSON.stringify(data.shopData?.themeConfig || {}, null, 2)}
};`}
              </pre>
            </Box>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
