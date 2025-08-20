import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Text,
  Card,
  BlockStack,
  InlineStack,
  Button,
  Box,
  Spinner
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import { shopifyStoreLoader } from "../utils/shopifyData.server";
import AppNavigation from "../components/AppNavigation";

export const loader = shopifyStoreLoader;

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const { store, products, needsSync } = loaderData;
  const productCount = (loaderData as any).productCount || 0;
  
  const syncFetcher = useFetcher();

  const isLoading = syncFetcher.state === "loading" || syncFetcher.state === "submitting";
  const syncResult = syncFetcher.data as any;
  const syncSuccess = syncResult?.success;

  // Handle different failure states
  const getErrorUI = () => {
    if (!syncResult?.error) return null;

    const getErrorMessage = () => {
      switch (syncResult.phase) {
        case 'database':
          return "Failed to save products to database";
        case 'embedding':
          return "Visual search setup incomplete";
        default:
          return syncResult.error;
      }
    };

    const getRetryMessage = () => {
      switch (syncResult.phase) {
        case 'database':
          return "Retry Database Sync";
        case 'embedding':
          return "Retry Visual Search Setup";
        default:
          return "Try Again";
      }
    };
    
    return (
      <Card>
        <Box padding="400">
          <BlockStack gap="400" align="center">
            <Text as="span" variant="headingLg">
              {syncResult.phase === 'database' ? '💾' : '🔍'}
            </Text>
            <BlockStack gap="200" align="center">
              <Text as="h3" variant="headingMd" alignment="center">
                {syncResult.phase === 'database' ? 'Database Sync Failed' : 'Visual Search Setup Incomplete'}
              </Text>
              <Text as="p" variant="bodyMd" tone="critical" alignment="center">
                {getErrorMessage()}
              </Text>
              {syncResult.dbStatus?.success && (
                <Text as="p" variant="bodySm" tone="success" alignment="center">
                  ✅ {syncResult.dbStatus.syncedCount} products saved to database
                </Text>
              )}
            </BlockStack>
            <InlineStack gap="300">
              <Button 
                onClick={handleSync} 
                variant="primary"
                tone={syncResult.phase === 'database' ? "critical" : undefined}
              >
                {getRetryMessage()}
              </Button>
              <Button variant="secondary" url="/app/support">
                Get Help
              </Button>
            </InlineStack>
          </BlockStack>
        </Box>
      </Card>
    );
  };
  
  // Update local state based on sync result - no reload needed!
  const effectiveNeedsSync = syncSuccess ? false : needsSync;
  const effectiveProductCount = syncSuccess ? (syncFetcher.data as any)?.syncedProducts || productCount : productCount;

  const handleSync = () => {
    syncFetcher.submit({}, {
      method: "POST",
      action: "/app/sync-store"
    });
  };

  console.log("🏪 Store data in component:", store);
  console.log("📦 Products in component:", products);

  return (
    <Page>
      <TitleBar title="Visual Search App Dashboard" />
      <BlockStack gap="500">
        


        {/* Loading State */}
        {isLoading && (
          <Card>
            <Box padding="600">
              <BlockStack gap="400" align="center">
                <Box>
                  <Spinner size="large" />
                </Box>
                <BlockStack gap="200" align="center">
                  <Text as="h2" variant="headingLg" alignment="center">
                    {syncResult?.phase === 'embedding' 
                      ? 'Setting up visual search...'
                      : 'Syncing your products...'}
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                    Please wait while we set up your store
                  </Text>
                </BlockStack>
              </BlockStack>
            </Box>
          </Card>
        )}

        {/* Success State - More engaging */}
        {syncSuccess && !isLoading && (
          <Card>
            <Box padding="500">
              <BlockStack gap="400" align="center">
                <Box>
                  <Text as="span" variant="headingXl">🎉</Text>
                </Box>
                <BlockStack gap="200" align="center">
                  <Text as="h2" variant="headingLg" alignment="center">
                    Sync Complete!
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                    Your products are now ready for visual search!
                  </Text>
                  {(syncFetcher.data as any)?.syncedProducts && (
                    <Text as="p" variant="bodySm" tone="success" alignment="center">
                      ✅ {(syncFetcher.data as any).syncedProducts} products synced successfully
                    </Text>
                  )}
                </BlockStack>
              </BlockStack>
            </Box>
          </Card>
        )}

        {/* Error States */}
        {getErrorUI()}

        {/* Progressive Loading: Always show store info immediately */}
        <Card>
          <BlockStack gap="400">
            <InlineStack gap="300" align="space-between">
              <BlockStack gap="100">
                <Text as="h1" variant="headingLg">
                  Welcome to {store.name}
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  {store.myshopifyDomain}
                </Text>
              </BlockStack>
              
              {/* Status indicator */}
              <Box>
                {effectiveNeedsSync ? (
                  <InlineStack gap="200" align="center">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FFA500' }}></div>
                    <Text as="span" variant="bodyMd" tone="subdued">Setup Required</Text>
                  </InlineStack>
                ) : (
                  <InlineStack gap="200" align="center">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00AA00' }}></div>
                    <Text as="span" variant="bodyMd" tone="success">Active</Text>
                  </InlineStack>
                )}
              </Box>
            </InlineStack>
            
            {/* Key metrics in grid */}
            <InlineStack gap="400" align="start">
              <BlockStack gap="200" align="start">
                <Text variant="bodyMd" as="p" tone="subdued">
                  Products
                </Text>
                <Text variant="headingMd" as="p" tone={effectiveNeedsSync ? "subdued" : "success"}>
                  {effectiveNeedsSync ? "Not synced" : (effectiveProductCount > 0 ? effectiveProductCount.toLocaleString() : "0")}
                </Text>
              </BlockStack>
              
              <BlockStack gap="200" align="start">
                <Text variant="bodyMd" as="p" tone="subdued">
                  Plan
                </Text>
                <Text variant="headingMd" as="p">
                  {store.plan?.shopifyPlus ? 'Shopify Plus' : 'Standard'}
                </Text>
              </BlockStack>
            </InlineStack>

            {/* Quick setup CTA for users who need sync */}
            {effectiveNeedsSync && !isLoading && (
              <Box background="bg-surface-info" padding="400" borderRadius="200">
                <BlockStack gap="300">
                  <InlineStack gap="200" align="start">
                    <Text as="span" variant="headingMd">🚀</Text>
                    <BlockStack gap="100">
                      <Text as="h3" variant="headingMd">
                        Ready to Enable Visual Search
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Sync your store products to enable image-based search for your customers
                      </Text>
                    </BlockStack>
                  </InlineStack>
                  <Button
                    onClick={handleSync}
                    variant="primary"
                    size="large"
                    disabled={isLoading}
                  >
                    Sync Store Products →
                  </Button>
                </BlockStack>
              </Box>
            )}
          </BlockStack>
        </Card>

        {/* Integration Options - Only show after sync */}
        {!effectiveNeedsSync && (
          <BlockStack gap="400">
            {/* Getting Started Section */}
            <Card>
              <Box padding="500">
                <BlockStack gap="400">
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingLg">
                      🎯 Next Steps
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Your store is synced! Now let's add visual search to your storefront.
                    </Text>
                  </BlockStack>
                  
                  <InlineStack gap="400" wrap>
                    <Box minWidth="300px">
                      <Card>
                        <Box padding="400">
                          <BlockStack gap="300">
                            <InlineStack gap="200" align="start">
                              <Text as="span" variant="headingMd">🎨</Text>
                              <BlockStack gap="100">
                                <Text as="h3" variant="headingMd">App Blocks</Text>
                                <Text as="p" variant="bodyMd" tone="success" fontWeight="medium">
                                  Recommended
                                </Text>
                              </BlockStack>
                            </InlineStack>
                            
                            <Text as="p" variant="bodyMd">
                              Add visual search through your theme editor with full customization control.
                            </Text>
                            
                            <BlockStack gap="100">
                              <Text as="p" variant="bodySm">✅ Theme 2.0 compatible</Text>
                              <Text as="p" variant="bodySm">✅ Drag & drop placement</Text>
                              <Text as="p" variant="bodySm">✅ Custom styling</Text>
                              <Text as="p" variant="bodySm">✅ No code required</Text>
                            </BlockStack>
                            
                            <Button
                              url="/app/app-blocks"
                              variant="primary"
                              size="large"
                              fullWidth
                            >
                              Set Up App Blocks →
                            </Button>
                          </BlockStack>
                        </Box>
                      </Card>
                    </Box>

                    <Box minWidth="300px">
                      <Card>
                        <Box padding="400">
                          <BlockStack gap="300">
                            <InlineStack gap="200" align="start">
                              <Text as="span" variant="headingMd">📊</Text>
                              <BlockStack gap="100">
                                <Text as="h3" variant="headingMd">Analytics</Text>
                                <Text as="p" variant="bodyMd" tone="subdued">
                                  Optional
                                </Text>
                              </BlockStack>
                            </InlineStack>
                            
                            <Text as="p" variant="bodyMd">
                              Track how customers use visual search and optimize performance.
                            </Text>
                            
                            <BlockStack gap="100">
                              <Text as="p" variant="bodySm">📈 Search analytics</Text>
                              <Text as="p" variant="bodySm">🎯 Conversion tracking</Text>
                            <Text as="p" variant="bodySm">🔍 Popular searches</Text>
                              <Text as="p" variant="bodySm">📱 Mobile insights</Text>
                            </BlockStack>
                            
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Analytics coming soon
                            </Text>
                          </BlockStack>
                        </Box>
                      </Card>
                    </Box>
                  </InlineStack>
                </BlockStack>
              </Box>
            </Card>
          </BlockStack>
        )}

        {!needsSync && <AppNavigation compact={false} />}
      </BlockStack>
    </Page>
  );
}
