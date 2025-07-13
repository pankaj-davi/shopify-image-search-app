import {  useLoaderData } from "@remix-run/react";
import {
  Page,
  Text,
  Card,
  BlockStack,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import { shopifyStoreLoader } from "../utils/shopifyData.server";

export const loader = shopifyStoreLoader;


export default function Index() {
  const { store, products } = useLoaderData<typeof loader>();

  console.log("🏪 Store data in component:", store);
  console.log("📦 Products in component:", products);


  return (
    <Page>
      <TitleBar title="Remix app template">
      </TitleBar>
      <BlockStack gap="500">
        <Card>
          <BlockStack gap="200">
            <InlineStack align="space-between">
              <BlockStack gap="100">
                <Text as="h1" variant="headingLg">
                  Hello! Welcome to {store.name}
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Store domain: {store.myshopifyDomain}
                </Text>
              </BlockStack>
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
