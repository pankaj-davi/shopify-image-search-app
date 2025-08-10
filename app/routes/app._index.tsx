import { useLoaderData, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import {
  Page,
  Text,
  Card,
  BlockStack,
  InlineStack,
  Button,
  Box,
  Spinner,
  ProgressBar
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
  const [progress, setProgress] = useState(0);
  const [totalProducts, setTotalProducts] = useState(productCount);
  const [syncedProducts, setSyncedProducts] = useState(0);
  const [remainingProducts, setRemainingProducts] = useState(0);

  const isLoading = syncFetcher.state === "loading" || syncFetcher.state === "submitting";
  const syncSuccess = (syncFetcher.data as any)?.success;

  // Set total products from sync response
  useEffect(() => {
    if (syncFetcher.data && (syncFetcher.data as any).totalProducts) {
      setTotalProducts((syncFetcher.data as any).totalProducts);
    }
  }, [syncFetcher.data]);

  // Poll for progress updates during sync
  useEffect(() => {
    let interval: any;
    
    if (isLoading) {
      interval = setInterval(async () => {
        try {
          const response = await fetch('/app/sync-progress');
          const data = await response.json();
          if (data.success && data.synced_products >= 0) {
            setSyncedProducts(data.synced_products);
            
            if (data.total_products && data.total_products > 0) {
              setTotalProducts(data.total_products);
              const progressPercent = Math.round((data.synced_products / data.total_products) * 100);
              setProgress(progressPercent);
              setRemainingProducts(data.total_products - data.synced_products);
            } else if (totalProducts > 0) {
              const progressPercent = Math.round((data.synced_products / totalProducts) * 100);
              setProgress(progressPercent);
              setRemainingProducts(totalProducts - data.synced_products);
            }
          }
        } catch (error) {
          console.error('Failed to fetch progress:', error);
        }
      }, 2000); // Update every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, totalProducts]);

  // Reload page after successful sync
  useEffect(() => {
    if (syncSuccess) {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [syncSuccess]);

  const handleSync = () => {
    setProgress(0);
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
        


        {/* Syncing Progress - Enhanced with better UX */}
        {isLoading && (
          <Card>
            <Box padding="600">
              <BlockStack gap="400" align="center">
                <Box>
                  <Spinner size="large" />
                </Box>
                <BlockStack gap="200" align="center">
                  <Text as="h2" variant="headingLg" alignment="center">
                    Syncing Your Store
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                    {totalProducts > 1000 
                      ? `Processing ${totalProducts.toLocaleString()} products — this may take a few minutes`
                      : totalProducts > 0 
                      ? `Importing ${totalProducts.toLocaleString()} products into visual search`
                      : `Discovering your store products and setting up visual search`
                    }
                  </Text>
                  
                  {/* Real-time sync statistics */}
                  {syncedProducts > 0 && totalProducts > 0 && (
                    <BlockStack gap="100" align="center">
                      <Text as="p" variant="bodyMd" fontWeight="semibold" alignment="center">
                        📦 {syncedProducts.toLocaleString()} products processed
                      </Text>
                      {remainingProducts > 0 && (
                        <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                          ⏳ {remainingProducts.toLocaleString()} remaining
                        </Text>
                      )}
                    </BlockStack>
                  )}
                </BlockStack>
                
                {progress > 0 && totalProducts > 0 && (
                  <Box width="100%" maxWidth="500px">
                    <BlockStack gap="300">
                      <ProgressBar progress={progress} size="large" />
                      <InlineStack gap="400" align="space-between">
                        <Text as="p" variant="bodyMd" alignment="center">
                          {Math.round((progress / 100) * totalProducts).toLocaleString()} of {totalProducts.toLocaleString()} products
                        </Text>
                        <Text as="p" variant="bodyMd" fontWeight="semibold">
                          {progress}%
                        </Text>
                      </InlineStack>
                      
                      {/* Additional progress details */}
                      <InlineStack gap="300" align="center" wrap>
                        <Text as="p" variant="bodySm" tone="subdued">
                          🔄 Processing files in real-time
                        </Text>
                        {remainingProducts > 0 && (
                          <Text as="p" variant="bodySm" tone="subdued">
                            📋 {remainingProducts.toLocaleString()} files in queue
                          </Text>
                        )}
                      </InlineStack>
                    </BlockStack>
                  </Box>
                )}
                
                <Box padding="200" background="bg-surface-secondary" borderRadius="100">
                  <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                    💡 Tip: Keep this page open to track progress
                  </Text>
                </Box>
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
                    Your products are now ready for visual search. Redirecting to dashboard...
                  </Text>
                </BlockStack>
              </BlockStack>
            </Box>
          </Card>
        )}

        {/* Error State - Enhanced */}
        {(syncFetcher.data as any)?.error && (
          <Card>
            <Box padding="400">
              <BlockStack gap="400" align="center">
                <Text as="span" variant="headingLg">⚠️</Text>
                <BlockStack gap="200" align="center">
                  <Text as="h3" variant="headingMd" alignment="center">
                    Sync Failed
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                    {(syncFetcher.data as any).error}
                  </Text>
                </BlockStack>
                <InlineStack gap="300">
                  <Button onClick={handleSync} variant="primary">
                    Try Again
                  </Button>
                  <Button variant="secondary" url="/app/support">
                    Get Help
                  </Button>
                </InlineStack>
              </BlockStack>
            </Box>
          </Card>
        )}

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
                {needsSync ? (
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
                <Text variant="headingMd" as="p" tone={needsSync ? "subdued" : "success"}>
                  {needsSync ? "Not synced" : (productCount > 0 ? productCount.toLocaleString() : "0")}
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
            {needsSync && !isLoading && (
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
        {!needsSync && (
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
                            
                            <Button
                              url="/app/block-stats"
                              variant="secondary"
                              size="large"
                              fullWidth
                            >
                              View Analytics →
                            </Button>
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
