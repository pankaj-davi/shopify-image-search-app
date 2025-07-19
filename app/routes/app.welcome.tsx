import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { 
  Page, 
  Card, 
  BlockStack, 
  Text, 
  Button,
  Box,
  InlineStack,
  Banner,
  Divider
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  
  // Check if visual search script is already injected
  try {
    const scriptsResponse = await admin.graphql(`
      query {
        scriptTags(first: 10) {
          edges {
            node {
              id
              src
              displayScope
              createdAt
            }
          }
        }
      }
    `);

    const scriptsData = await scriptsResponse.json();
    const visualSearchScript = scriptsData.data.scriptTags.edges.find(
      (edge: any) => edge.node.src.includes('visual-search-script.js') || 
                    edge.node.src.includes('visual-search-unified.js')
    );

    return json({
      shop: session.shop,
      isScriptActive: !!visualSearchScript,
      isNewInstall: !visualSearchScript
    });
  } catch (error) {
    console.error("Error checking script status:", error);
    return json({
      shop: session.shop,
      isScriptActive: false,
      isNewInstall: true
    });
  }
}

export default function WelcomePage() {
  const data = useLoaderData<typeof loader>();

  return (
    <Page>
      <TitleBar title="Welcome to Visual Search" />
      
      <BlockStack gap="500">
        {data.isNewInstall && (
          <Banner tone="info">
            <Text as="p" variant="bodyMd">
              🎉 Welcome! Choose how you'd like to add visual search to your store.
            </Text>
          </Banner>
        )}

        <Card>
          <BlockStack gap="400">
            <Text as="h1" variant="headingLg">Choose Your Visual Search Setup</Text>
            
            <Text as="p" variant="bodyMd">
              Visual search allows your customers to upload images and find similar products in your store. 
              Choose the setup method that works best for your store:
            </Text>
          </BlockStack>
        </Card>

        <InlineStack gap="400" align="start">
          {/* Automatic Script Option */}
          <Card>
            <Box padding="500">
              <BlockStack gap="400">
                <InlineStack gap="300" align="start">
                  <Text as="span" variant="headingLg">⚡</Text>
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingMd">Automatic Setup</Text>
                    <Text as="p" variant="bodyMd" fontWeight="medium" tone="success">
                      Recommended for most stores
                    </Text>
                  </BlockStack>
                </InlineStack>
                
                <Text as="p" variant="bodyLg">
                  Visual search appears automatically in all search bars across your store.
                </Text>
                
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">✅ Benefits:</Text>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd">• Works with ALL themes (1.0 and 2.0)</Text>
                    <Text as="p" variant="bodyMd">• No configuration required</Text>
                    <Text as="p" variant="bodyMd">• Instant activation</Text>
                    <Text as="p" variant="bodyMd">• Universal compatibility</Text>
                  </BlockStack>
                </BlockStack>
                
                <Divider />
                
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">Perfect for:</Text>
                  <Text as="p" variant="bodyMd">
                    • Theme 1.0 stores (Debut, Brooklyn, Venture)<br/>
                    • Merchants who want instant setup<br/>
                    • "Set it and forget it" approach
                  </Text>
                </BlockStack>
                
                <Button
                  url="/app/visual-search"
                  variant="primary"
                  size="large"
                  fullWidth
                >
                  🚀 Set Up Automatic
                </Button>
              </BlockStack>
            </Box>
          </Card>

          {/* App Block Option */}
          <Card>
            <Box padding="500">
              <BlockStack gap="400">
                <InlineStack gap="300" align="start">
                  <Text as="span" variant="headingLg">🎨</Text>
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingMd">App Block Setup</Text>
                    <Text as="p" variant="bodyMd" fontWeight="medium">
                      Theme 2.0 stores only
                    </Text>
                  </BlockStack>
                </InlineStack>
                
                <Text as="p" variant="bodyLg">
                  Add visual search through the theme editor with full control over appearance.
                </Text>
                
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">🎯 Benefits:</Text>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd">• Precise placement control</Text>
                    <Text as="p" variant="bodyMd">• Custom colors and styling</Text>
                    <Text as="p" variant="bodyMd">• Native theme editor experience</Text>
                    <Text as="p" variant="bodyMd">• Professional integration</Text>
                  </BlockStack>
                </BlockStack>
                
                <Divider />
                
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">Perfect for:</Text>
                  <Text as="p" variant="bodyMd">
                    • Theme 2.0 stores (Dawn, Craft, Sense)<br/>
                    • Merchants who want design control<br/>
                    • Custom brand styling needs
                  </Text>
                </BlockStack>
                
                <Button
                  url="/app/app-blocks"
                  variant="primary"
                  size="large"
                  fullWidth
                >
                  🎨 Set Up App Block
                </Button>
              </BlockStack>
            </Box>
          </Card>
        </InlineStack>

        {/* Both Options */}
        <Card>
          <Box padding="500">
            <BlockStack gap="400">
              <InlineStack gap="300" align="start">
                <Text as="span" variant="headingLg">🔄</Text>
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd">Use Both Methods</Text>
                  <Text as="p" variant="bodyMd" fontWeight="medium">
                    Maximum flexibility
                  </Text>
                </BlockStack>
              </InlineStack>
              
              <Text as="p" variant="bodyLg">
                You can use both automatic injection and app blocks simultaneously. Many merchants 
                start with automatic for instant functionality, then add app blocks for specific 
                pages or custom styling.
              </Text>
              
              <InlineStack gap="300">
                <Button
                  url="/app/visual-search"
                  variant="secondary"
                >
                  ⚡ Automatic Setup
                </Button>
                <Button
                  url="/app/app-blocks"
                  variant="secondary"
                >
                  🎨 App Block Guide
                </Button>
              </InlineStack>
            </BlockStack>
          </Box>
        </Card>

        {/* Current Status */}
        {!data.isNewInstall && (
          <Card>
            <Box padding="500">
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Current Status</Text>
                
                <InlineStack gap="200" align="start">
                  <Text as="span" variant="bodyMd" fontWeight="semibold">Automatic Script:</Text>
                  <Text 
                    as="span" 
                    variant="bodyMd" 
                    tone={data.isScriptActive ? "success" : "subdued"}
                  >
                    {data.isScriptActive ? "✅ Active" : "❌ Inactive"}
                  </Text>
                </InlineStack>
                
                <InlineStack gap="200" align="start">
                  <Text as="span" variant="bodyMd" fontWeight="semibold">App Block:</Text>
                  <Text as="span" variant="bodyMd">
                    🎯 Available for Theme 2.0
                  </Text>
                </InlineStack>
                
                <InlineStack gap="300">
                  <Button
                    url="/app/visual-search"
                    variant="primary"
                  >
                    ⚙️ Manage Settings
                  </Button>
                  <Button
                    url="/app/preview"
                    variant="secondary"
                  >
                    🎨 Preview & Customize
                  </Button>
                </InlineStack>
              </BlockStack>
            </Box>
          </Card>
        )}

        {/* Quick Links */}
        <Card>
          <Box padding="500">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Quick Links</Text>
              
              <InlineStack gap="300" wrap>
                <Button
                  url="/app/preview"
                  variant="secondary"
                >
                  🎨 Preview & Customize
                </Button>
                <Button
                  url="/app/testing-tools"
                  variant="secondary"
                >
                  🧪 Testing Tools
                </Button>
                <Button
                  url="/app/additional"
                  variant="secondary"
                >
                  📊 Analytics
                </Button>
              </InlineStack>
            </BlockStack>
          </Box>
        </Card>
      </BlockStack>
    </Page>
  );
}
