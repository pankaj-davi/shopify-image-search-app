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
import AppNavigation from "../components/AppNavigation";

export const loader = shopifyStoreLoader;

export default function Index() {
  const { store, products } = useLoaderData<typeof loader>();

  console.log("🏪 Store data in component:", store);
  console.log("📦 Products in component:", products);

  return (
    <Page>
      <TitleBar title="Visual Search App Dashboard" />
      <BlockStack gap="500">
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Welcome to {store.name}
              </Text>
              <Text variant="bodyMd" as="p" tone="subdued">
                Store domain: {store.myshopifyDomain}
              </Text>
              <InlineStack gap="500" align="start">
                <BlockStack gap="200" align="start">
                  <Text variant="bodyMd" as="p">
                    <Text as="span" fontWeight="semibold">Products:</Text>
                  </Text>
                  <Text variant="headingLg" as="p" tone="success">
                    {products?.length || 0}
                  </Text>
                </BlockStack>
                <BlockStack gap="200" align="start">
                  <Text variant="bodyMd" as="p">
                    <Text as="span" fontWeight="semibold">Status:</Text>
                  </Text>
                  <Text variant="headingLg" as="p" tone="success">
                    ✅ Active
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>
          </Card>

          <AppNavigation compact={false} />
        </BlockStack>
      </Page>
  );
}
