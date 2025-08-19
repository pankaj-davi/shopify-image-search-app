import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { 
  Page, 
  Card, 
  BlockStack, 
  Text, 
  Button,
  Box,
  InlineStack,
  Banner,
  Divider,
  List
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  return json({
    shop: session.shop,
    appUrl: process.env.SHOPIFY_APP_URL 
  });
}

export default function AppBlockPage() {
  const appBlockCode = `{%- comment -%}
  Visual Search App Block for Shopify Theme 2.0
  This block is automatically available in your theme editor
{%- endcomment -%}

<div class="visual-search-app-block" {{ block.shopify_attributes }}>
  <script>
    window.VISUAL_SEARCH_CONFIG = {
      appUrl: '{{ app.url }}',
      shopDomain: '{{ shop.permanent_domain }}',
      theme: {
        iconColor: '{{ block.settings.icon_color | default: "#5f6368" }}',
        iconColorHover: '{{ block.settings.icon_color_hover | default: "#202124" }}',
        primaryColor: '{{ block.settings.primary_color | default: "#4285f4" }}',
        iconPosition: '{{ block.settings.icon_position | default: "right" }}',
        iconOffset: {{ block.settings.icon_offset | default: 8 }},
        iconSizeMultiplier: {{ block.settings.icon_size | default: 1.0 }}
      }
    };
  </script>
  <script src="{{ app.url }}/visual-search-unified.js?shop={{ shop.permanent_domain }}&t={{ 'now' | date: '%s' }}" async></script>
</div>`;

  return (
    <Page>
      <TitleBar title="App Block Integration" />
      
      <BlockStack gap="500">
        <Banner tone="info">
          <Text as="p" variant="bodyMd">
            Advanced setup gives you complete control over visual search placement and styling through Shopify's theme editor.
          </Text>
        </Banner>

        {/* What Are App Blocks */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">🎯 What is Advanced Setup?</Text>
            
            <Text as="p" variant="bodyMd">
              Advanced setup lets you add visual search exactly where you want it in your store, 
              with custom colors that perfectly match your brand. Perfect for design-focused stores!
            </Text>
            
            <Box background="bg-surface-secondary" padding="400" borderRadius="200">
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">Why Choose Advanced Setup:</Text>
                <List>
                  <List.Item>🎨 **Custom Colors** - Match your exact brand colors</List.Item>
                  <List.Item>📍 **Precise Control** - Choose exactly where visual search appears</List.Item>
                  <List.Item>⚡ **Better Performance** - Faster loading for your customers</List.Item>
                  <List.Item>🔧 **Easy to Use** - Built into Shopify's familiar theme editor</List.Item>
                </List>
              </BlockStack>
            </Box>
          </BlockStack>
        </Card>

        {/* Current Status */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">📊 Your Integration Options</Text>
            
            <InlineStack gap="400" align="space-between">
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">⚡ Quick Setup</Text>
                <Text as="p" variant="bodyMd" tone="success">✅ Available</Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Works with any theme - one click setup
                </Text>
              </BlockStack>
              
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">🎨 Advanced Setup</Text>
                <Text as="p" variant="bodyMd" tone="caution">⚠️ Modern themes only</Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Dawn, Craft, Sense, Studio themes
                </Text>
              </BlockStack>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* How Merchants Add App Blocks */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">🛠️ How to Add Advanced Setup</Text>
            
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">Step 1: Open Your Theme Editor</Text>
              <Box paddingInlineStart="400">
                <List>
                  <List.Item>Go to **Online Store → Themes**</List.Item>
                  <List.Item>Click **"Customize"** on your active theme</List.Item>
                  <List.Item>Look for the **"Apps"** section in the sidebar</List.Item>
                </List>
              </Box>
            </BlockStack>
            
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">Step 2: Add Visual Search</Text>
              <Box paddingInlineStart="400">
                <List>
                  <List.Item>Click the **"+"** button to add content</List.Item>
                  <List.Item>Choose **"Apps"** from the menu</List.Item>
                  <List.Item>Find **"🔍 Visual Search"** and click it</List.Item>
                </List>
              </Box>
            </BlockStack>
            
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">Step 3: Customize Your Design</Text>
              <Box paddingInlineStart="400">
                <List>
                  <List.Item>**📸 Camera Colors** - Match your brand perfectly</List.Item>
                  <List.Item>**🔵 Button Colors** - Coordinate with your theme</List.Item>
                  <List.Item>**📍 Position** - Left or right side of search bars</List.Item>
                  <List.Item>**📏 Size** - Make it bigger or smaller as needed</List.Item>
                </List>
              </Box>
            </BlockStack>
            
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">Step 4: Save and Test</Text>
              <Box paddingInlineStart="400">
                <List>
                  <List.Item>Click **"Save"** to apply changes</List.Item>
                  <List.Item>Preview the storefront</List.Item>
                  <List.Item>Visual search icons will appear in search bars</List.Item>
                </List>
              </Box>
            </BlockStack>
          </BlockStack>
        </Card>

        {/* Theme Compatibility */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">🎨 Which Themes Support Advanced Setup?</Text>
            
            <InlineStack gap="400" align="space-between">
              <Box background="bg-surface-success" padding="400" borderRadius="200">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">✅ Modern Themes</Text>
                  <Text as="p" variant="bodyMd">Dawn, Craft, Sense, Studio, Refresh, etc.</Text>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">Advanced setup available</Text>
                </BlockStack>
              </Box>
              
              <Box background="bg-surface-warning" padding="400" borderRadius="200">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">⚠️ Older Themes</Text>
                  <Text as="p" variant="bodyMd">Debut, Brooklyn, Venture, etc.</Text>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">Quick setup only</Text>
                </BlockStack>
              </Box>
            </InlineStack>
            
            <Box background="bg-surface-info" padding="300" borderRadius="200">
              <Text as="p" variant="bodyMd">
                💡 **Not sure which theme you have?** Check Online Store → Themes. 
                If you see "Customize" options with lots of settings, you likely have a modern theme!
              </Text>
            </Box>
          </BlockStack>
        </Card>

        {/* Developer Section */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">👨‍💻 Developer Information</Text>
            
            <Text as="p" variant="bodyMd">
              The app block file is automatically created at <Text as="span" fontWeight="semibold">blocks/visual-search.liquid</Text> in your app structure.
            </Text>
            
            <Box background="bg-surface-secondary" padding="400" borderRadius="200">
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">App Block Features:</Text>
                <List>
                  <List.Item>🎨 Customizable colors and positioning</List.Item>
                  <List.Item>📱 Responsive design for all devices</List.Item>
                  <List.Item>⚡ Uses the same unified visual search script</List.Item>
                  <List.Item>🔧 Native Shopify schema configuration</List.Item>
                </List>
              </BlockStack>
            </Box>
            
            <Divider />
            
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">App Block Code:</Text>
              <Box 
                background="bg-surface-secondary" 
                padding="400" 
                borderRadius="200"
                borderWidth="025"
                borderColor="border"
              >
                <div style={{ maxHeight: "300px", overflow: "auto" }}>
                  <pre style={{ 
                    fontSize: "11px", 
                    fontFamily: "monospace", 
                    margin: 0, 
                    lineHeight: "1.4",
                    whiteSpace: "pre-wrap"
                  }}>
                    {appBlockCode}
                  </pre>
                </div>
              </Box>
              
              <Button 
                variant="secondary" 
                onClick={() => {
                  navigator.clipboard.writeText(appBlockCode).then(() => {
                    console.log('App block code copied to clipboard');
                  });
                }}
              >
                📋 Copy App Block Code
              </Button>
            </BlockStack>
          </BlockStack>
        </Card>

        {/* Next Steps */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">🚀 Next Steps</Text>
            
            <BlockStack gap="300">
              <Text as="p" variant="bodyMd">
                App blocks provide the recommended integration method for Theme 2.0 stores, offering precise control over placement and styling.
              </Text>
              
              <Box background="bg-surface-info" padding="400" borderRadius="200">
                <List>
                  <List.Item>**Use app blocks** for professional Theme 2.0 integration</List.Item>
                  <List.Item>**Add app blocks** for Theme 2.0 stores that want more control</List.Item>
                  <List.Item>**Let merchants choose** based on their needs and theme version</List.Item>
                </List>
              </Box>
            </BlockStack>
            
            <InlineStack gap="300">
              <Button url="/app/visual-search" variant="primary">
                ← Back to Settings
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
