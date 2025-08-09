import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Text,
  Card,
  BlockStack,
  InlineStack,
  Button,
  Box,
  Banner
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
        <Banner tone="info">
          <Text as="p" variant="bodyMd">
            👋 Welcome to Visual Search! Choose how you'd like to add image search to your store.
          </Text>
        </Banner>

        <Card>
          <BlockStack gap="400">
            <Text as="h1" variant="headingLg">
              Welcome to {store.name}
            </Text>
            
            <InlineStack gap="400" align="start">
              <BlockStack gap="200" align="start">
                <Text variant="bodyMd" as="p">
                  <Text as="span" fontWeight="semibold">Store:</Text>
                </Text>
                <Text variant="headingMd" as="p" tone="success">
                  {store.myshopifyDomain}
                </Text>
              </BlockStack>
              
              <BlockStack gap="200" align="start">
                <Text variant="bodyMd" as="p">
                  <Text as="span" fontWeight="semibold">Products:</Text>
                </Text>
                <Text variant="headingMd" as="p" tone="success">
                  {products?.length || 0}
                </Text>
              </BlockStack>
            </InlineStack>
          </BlockStack>
        </Card>

        <InlineStack gap="400" align="start">
          {/* App Block Setup - Now the primary option */}
          <Card>
            <Box padding="500">
              <BlockStack gap="400">
                <InlineStack gap="300" align="start">
                  <Text as="span" variant="headingLg">🎨</Text>
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingMd">App Block Integration</Text>
                    <Text as="p" variant="bodyMd" fontWeight="medium" tone="success">
                      Professional integration method
                    </Text>
                  </BlockStack>
                </InlineStack>
                
                <Text as="p" variant="bodyMd">
                  Visual search through theme editor with full control over appearance and placement.
                </Text>
                
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd">✅ Works with Theme 2.0</Text>
                  <Text as="p" variant="bodyMd">✅ Custom styling options</Text>
                  <Text as="p" variant="bodyMd">✅ Precise placement control</Text>
                  <Text as="p" variant="bodyMd">✅ Native Shopify experience</Text>
                </BlockStack>
                
                <Button
                  url="/app/app-blocks"
                  variant="primary"
                  size="large"
                  fullWidth
                >
                  🎨 Set Up App Blocks
                </Button>
              </BlockStack>
            </Box>
          </Card>
        </InlineStack>

        {/* Quick Actions */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Quick Actions</Text>
            
            <InlineStack gap="300" wrap>
              <Button
                url="/app/app-blocks"
                variant="primary"
              >
                📦 Setup App Blocks
              </Button>
              <Button
                url="/app/block-stats"
                variant="secondary"
              >
                📊 View Analytics
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        <AppNavigation compact={false} />
      </BlockStack>
    </Page>
  );
}
