import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Banner,
  Box
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export async function loader({ request }: LoaderFunctionArgs) {
  // Get the actual app URL from the request or environment
  const url = new URL(request.url);
  const appUrl = process.env.SHOPIFY_APP_URL || `${url.protocol}//${url.host}`;
  
  return {
    appUrl,
    bookmarkletCode: `javascript:(function(){
      var script = document.createElement('script');
      script.src = '${appUrl}/visual-search-script.js?shop=' + (window.Shopify ? window.Shopify.shop : 'test-shop.myshopify.com');
      script.onload = function() {
        alert('Visual search script loaded! Look for camera icons in search bars.');
        if (window.injectVisualSearchIcon) {
          window.injectVisualSearchIcon();
        }
      };
      script.onerror = function() {
        alert('Failed to load visual search script. Check console for errors.');
      };
      document.head.appendChild(script);
    })();`
  };
}

export default function TestingTools() {
  const { appUrl, bookmarkletCode } = useLoaderData<typeof loader>();

  return (
    <Page>
      <TitleBar title="Visual Search Testing Tools" />
      
      <BlockStack gap="500">
        {/* Quick Tests */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Quick Tests</Text>
            <InlineStack gap="300" wrap>
              <Button
                url="/api/test-integration?type=script"
                external
                variant="secondary"
                icon="📄"
              >
                Test Script Access
              </Button>
              <Button
                url="/api/test-integration?type=api"
                external
                variant="secondary"
                icon="🔌"
              >
                Test API Endpoint
              </Button>
              <Button
                url="/api/test-integration?type=config"
                external
                variant="secondary"
                icon="⚙️"
              >
                Check Configuration
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Bookmarklet */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">📌 Test Bookmarklet</Text>
            <Banner tone="warning">
              <Text as="p" variant="bodyMd">
                Drag this button to your bookmarks bar, then click it on ANY Shopify store to test visual search:
              </Text>
            </Banner>
            <Box 
              background="bg-surface-secondary" 
              padding="400" 
              borderRadius="200"
            >
              <InlineStack align="center">
                <Button
                  url={bookmarkletCode}
                  variant="primary"
                  size="large"
                >
                  🔍 Test Visual Search
                </Button>
              </InlineStack>
            </Box>
            <Text as="p" variant="bodyMd" tone="subdued">
              <Text as="span" fontWeight="semibold">How to use:</Text><br />
              1. Drag the button above to your browser's bookmarks bar<br />
              2. Visit any Shopify store (or your test store)<br />
              3. Click the bookmark to inject visual search<br />
              4. Look for camera icons in search bars
            </Text>
          </BlockStack>
        </Card>

        {/* Manual Testing Steps */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">✅ Manual Testing Checklist</Text>
            
            <BlockStack gap="300">
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">1. Pre-Installation Testing:</Text>
                <Box paddingInlineStart="400">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd">✅ App builds without errors</Text>
                    <Text as="p" variant="bodyMd">✅ All environment variables are set</Text>
                    <Text as="p" variant="bodyMd">✅ Script endpoint is accessible: <code>{appUrl}/visual-search-script.js</code></Text>
                    <Text as="p" variant="bodyMd">✅ API endpoint responds: <code>{appUrl}/api/visual-search</code></Text>
                  </BlockStack>
                </Box>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">2. Installation Testing:</Text>
                <Box paddingInlineStart="400">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd">✅ App installs successfully on test store</Text>
                    <Text as="p" variant="bodyMd">✅ Script tag appears in Shopify admin (Online Store → Themes → Actions → Edit code → Templates)</Text>
                    <Text as="p" variant="bodyMd">✅ No errors in app logs during installation</Text>
                    <Text as="p" variant="bodyMd">✅ Webhook endpoints are configured</Text>
                  </BlockStack>
                </Box>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">3. Frontend Testing:</Text>
                <Box paddingInlineStart="400">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd">✅ Camera icons appear in search bars</Text>
            <li>✅ Icons are positioned correctly (not overlapping text)</li>
                    <Text as="p" variant="bodyMd">✅ Icons work on mobile devices</Text>
                    <Text as="p" variant="bodyMd">✅ File picker opens when clicking camera icon</Text>
                    <Text as="p" variant="bodyMd">✅ Image upload works (check browser network tab)</Text>
                    <Text as="p" variant="bodyMd">✅ Search terms are generated and filled</Text>
                    <Text as="p" variant="bodyMd">✅ Search is triggered automatically</Text>
                    <Text as="p" variant="bodyMd">✅ Error handling works (try invalid files)</Text>
                  </BlockStack>
                </Box>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">4. Cross-Theme Testing:</Text>
                <Box paddingInlineStart="400">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd">✅ Test with Dawn theme</Text>
                    <Text as="p" variant="bodyMd">✅ Test with Debut theme</Text>
                    <Text as="p" variant="bodyMd">✅ Test with at least one custom theme</Text>
                    <Text as="p" variant="bodyMd">✅ Test on stores with multiple search bars</Text>
                    <Text as="p" variant="bodyMd">✅ Test on stores with AJAX/SPA navigation</Text>
                  </BlockStack>
                </Box>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">5. Uninstallation Testing:</Text>
                <Box paddingInlineStart="400">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd">✅ Script tags are removed when app is uninstalled</Text>
                    <Text as="p" variant="bodyMd">✅ No orphaned scripts remain</Text>
                    <Text as="p" variant="bodyMd">✅ Uninstall webhook fires correctly</Text>
                  </BlockStack>
                </Box>
              </BlockStack>
            </BlockStack>
          </BlockStack>
        </Card>

        {/* Browser Testing */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">🌐 Browser Compatibility Testing</Text>
            
            <BlockStack gap="300">
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">Desktop Browsers:</Text>
                <Box paddingInlineStart="400">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd">✅ Chrome (latest)</Text>
                    <Text as="p" variant="bodyMd">✅ Firefox (latest)</Text>
                    <Text as="p" variant="bodyMd">✅ Safari (latest)</Text>
                    <Text as="p" variant="bodyMd">✅ Edge (latest)</Text>
                  </BlockStack>
                </Box>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">Mobile Browsers:</Text>
                <Box paddingInlineStart="400">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd">✅ Chrome Mobile</Text>
                    <Text as="p" variant="bodyMd">✅ Safari iOS</Text>
                    <Text as="p" variant="bodyMd">✅ Samsung Internet</Text>
                    <Text as="p" variant="bodyMd">✅ Firefox Mobile</Text>
                  </BlockStack>
                </Box>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">Test Cases:</Text>
                <Box paddingInlineStart="400">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd">✅ File picker opens on mobile</Text>
                    <Text as="p" variant="bodyMd">✅ Camera access works (mobile only)</Text>
                    <Text as="p" variant="bodyMd">✅ Touch events work properly</Text>
                    <Text as="p" variant="bodyMd">✅ Icons scale correctly on different screen sizes</Text>
                    <Text as="p" variant="bodyMd">✅ No JavaScript errors in console</Text>
                  </BlockStack>
                </Box>
              </BlockStack>
            </BlockStack>
          </BlockStack>
        </Card>

        {/* Debugging Tools */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">🐛 Debugging Tools</Text>
            
            <BlockStack gap="300">
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">Browser Console Commands:</Text>
                
                <Box 
                  background="bg-surface-secondary" 
                  padding="300" 
                  borderRadius="200"
                >
                  <Text as="p" variant="bodyMd">
                    <code>console.log(window.injectVisualSearchIcon ? 'Visual search loaded' : 'Visual search not found');</code>
                  </Text>
                </Box>

                <Box 
                  background="bg-surface-secondary" 
                  padding="300" 
                  borderRadius="200"
                >
                  <Text as="p" variant="bodyMd">
                    <code>if (window.injectVisualSearchIcon) window.injectVisualSearchIcon();</code>
                  </Text>
                </Box>

                <Box 
                  background="bg-surface-secondary" 
                  padding="300" 
                  borderRadius="200"
                >
                  <Text as="p" variant="bodyMd">
                    <code>document.querySelectorAll('input[type="search"], input[name*="search"]')</code>
                  </Text>
                </Box>

                <Box 
                  background="bg-surface-secondary" 
                  padding="300" 
                  borderRadius="200"
                >
                  <Text as="p" variant="bodyMd">
                    <code>document.querySelectorAll('.visual-search-icon')</code>
                  </Text>
                </Box>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">Network Tab Checks:</Text>
                <Box paddingInlineStart="400">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd">Script loads successfully (200 status)</Text>
                    <Text as="p" variant="bodyMd">API requests go to correct endpoint</Text>
                    <Text as="p" variant="bodyMd">Image uploads have proper Content-Type</Text>
                    <Text as="p" variant="bodyMd">No CORS errors</Text>
                  </BlockStack>
                </Box>
              </BlockStack>
            </BlockStack>
          </BlockStack>
        </Card>

        <Box borderBlockStartWidth="025" borderColor="border" paddingBlockStart="300">
          <Text as="p" variant="bodySm" tone="subdued" alignment="center">
            Testing tools generated for: {appUrl}
          </Text>
        </Box>
      </BlockStack>
    </Page>
  );
}
