import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { 
  Page, 
  Card, 
  BlockStack, 
  Text, 
  Button, 
  Banner,
  Box,
  InlineStack
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { ScriptInjectionService } from "../services/script-injection.service";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Check if visual search script is currently injected
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
      shop: shopDomain,
      isScriptInjected: !!visualSearchScript,
      scriptData: visualSearchScript?.node || null
    });
  } catch (error) {
    console.error("Error checking script status:", error);
    
    // Check if it's a permissions error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isPermissionError = errorMessage.includes("Access denied") || 
                             errorMessage.includes("scriptTags");
    
    return json({
      shop: shopDomain,
      isScriptInjected: false,
      scriptData: null,
      error: isPermissionError 
        ? "Permission denied: App needs 'write_script_tags' scope. Please reinstall the app after updating permissions."
        : "Failed to check script status"
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const formData = await request.formData();
  const action = formData.get("action");

  try {
    if (action === "inject") {
      const result = await ScriptInjectionService.injectVisualSearchScript(admin, shopDomain);
      return json(result);
    } else if (action === "remove") {
      const result = await ScriptInjectionService.removeVisualSearchScript(admin, shopDomain);
      return json(result);
    } else if (action === "cleanup") {
      // Remove all old scripts and inject a fresh one
      const result = await ScriptInjectionService.injectVisualSearchScript(admin, shopDomain);
      return json({
        ...result,
        message: result.success 
          ? "All old scripts removed and fresh script injected successfully!" 
          : result.message
      });
    } else {
      return json({ success: false, error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error executing action:", error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

export default function VisualSearchSettings() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  // Handle error display safely
  const errorMessage = ('error' in data) && data.error && typeof data.error === 'string' ? data.error : null;

  return (
    <Page>
      <TitleBar title="Visual Search Settings" />
      
      <BlockStack gap="500">
        {/* Integration Choice Banner */}
        <Banner tone="info" title="🎯 Two Ways to Add Visual Search">
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd">
              You have complete control over how visual search appears in your store:
            </Text>
            <InlineStack gap="400" align="start">
              <Text as="p" variant="bodyMd">
                <Text as="span" fontWeight="semibold">⚡ Automatic:</Text> Instant activation, works with any theme
              </Text>
              <Text as="p" variant="bodyMd">
                <Text as="span" fontWeight="semibold">🎨 App Block:</Text> Custom styling through theme editor
              </Text>
            </InlineStack>
          </BlockStack>
        </Banner>

        {errorMessage && (
          <Banner tone="critical" title="Error">
            {errorMessage}
          </Banner>
        )}
      
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">🎯 Choose How to Add Visual Search</Text>
            
            <Text as="p" variant="bodyMd">
              Pick the setup method that works best for your store. Both are great - it just depends on your preferences!
            </Text>
            
            <InlineStack gap="400" align="start">
              <Box background="bg-surface-secondary" padding="400" borderRadius="200" minWidth="300px">
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">⚡ Quick Setup (Recommended)</Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Works with ANY theme. One-click setup - visual search appears automatically in all search bars.
                  </Text>
                  <InlineStack gap="200" align="start">
                    <Text as="span" variant="bodyMd" fontWeight="semibold">Status:</Text>
                    <Text 
                      as="span" 
                      variant="bodyMd" 
                      tone={data.isScriptInjected ? "success" : "critical"}
                      fontWeight="semibold"
                    >
                      {data.isScriptInjected ? "✅ Active" : "❌ Not active"}
                    </Text>
                  </InlineStack>
                </BlockStack>
              </Box>
              
              <Box background="bg-surface-info" padding="400" borderRadius="200" minWidth="300px">
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">🎨 Advanced Setup</Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Add through theme editor for custom colors and exact placement. Modern themes only.
                  </Text>
                  <InlineStack gap="200" align="start">
                    <Text as="span" variant="bodyMd" fontWeight="semibold">Status:</Text>
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      🎯 Available
                    </Text>
                  </InlineStack>
                </BlockStack>
              </Box>
            </InlineStack>
            
            {data.scriptData && (
              <Box paddingBlockStart="300">
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">
                    <Text as="span" fontWeight="semibold">Script ID:</Text> {data.scriptData.id}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    <Text as="span" fontWeight="semibold">Active since:</Text> {new Date(data.scriptData.createdAt).toLocaleString()}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    <Text as="span" fontWeight="semibold">Source:</Text> {data.scriptData.src}
                  </Text>
                </BlockStack>
              </Box>
            )}
          </BlockStack>
        </Card>

        {actionData && (
          <Banner 
            tone={actionData.success ? "success" : "critical"} 
            title={actionData.success ? "Success" : "Error"}
          >
            {('message' in actionData) ? actionData.message : 
             ('error' in actionData) ? actionData.error : 
             'Operation completed'}
          </Banner>
        )}

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">⚡ Automatic Script Injection</Text>
            
            <Text as="p" variant="bodyMd">
              Automatically inject visual search into ALL search bars across your store. 
              Works with any theme (1.0 and 2.0) and requires no configuration.
            </Text>
            
            <InlineStack gap="300" wrap>
              <Form method="post">
                <input type="hidden" name="action" value="inject" />
                <Button
                  submit
                  variant="primary"
                  disabled={data.isScriptInjected}
                >
                  {data.isScriptInjected ? "✅ Already Active" : "🚀 Enable Automatic"}
                </Button>
              </Form>

              <Form method="post">
                <input type="hidden" name="action" value="remove" />
                <Button
                  submit
                  variant="primary"
                  tone="critical"
                  disabled={!data.isScriptInjected}
                >
                  {!data.isScriptInjected ? "❌ Not Active" : "🛑 Disable Automatic"}
                </Button>
              </Form>

              <Form method="post">
                <input type="hidden" name="action" value="cleanup" />
                <Button
                  submit
                  variant="secondary"
                >
                  🔧 Fix Script Issues
                </Button>
              </Form>
            </InlineStack>
            
            <Box background="bg-surface-secondary" padding="400" borderRadius="200">
              <BlockStack gap="200">
                <Text as="h4" variant="headingSm">✅ Automatic Benefits:</Text>
                <Text as="p" variant="bodyMd">
                  • Works with ALL themes (Dawn, Debut, Brooklyn, custom themes)<br/>
                  • No merchant configuration required<br/>
                  • Instant activation across entire store<br/>
                  • Universal compatibility
                </Text>
              </BlockStack>
            </Box>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">🎨 App Block Integration (Theme 2.0)</Text>
            
            <Text as="p" variant="bodyMd">
              Add visual search through the theme editor for precise placement control. 
              Perfect for merchants who want to customize appearance and positioning.
            </Text>
            
            <InlineStack gap="300" wrap>
              <Button
                url="/app/app-blocks"
                variant="primary"
              >
                📖 App Block Guide
              </Button>

              <Button
                url="/app/preview"
                variant="secondary"
              >
                � Preview & Customize
              </Button>
            </InlineStack>
            
            <Box background="bg-surface-info" padding="400" borderRadius="200">
              <BlockStack gap="200">
                <Text as="h4" variant="headingSm">�🎯 App Block Benefits:</Text>
                <Text as="p" variant="bodyMd">
                  • Precise placement control through theme editor<br/>
                  • Custom colors and styling options<br/>
                  • Native Shopify admin experience<br/>
                  • Theme 2.0 stores only (Dawn, Craft, Sense, etc.)
                </Text>
              </BlockStack>
            </Box>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text as="h3" variant="headingMd">❓ Which Method Should I Choose?</Text>
            
            <BlockStack gap="300">
              <Box background="bg-surface-success" padding="400" borderRadius="200">
                <BlockStack gap="200">
                  <Text as="h4" variant="headingSm">🚀 Choose Automatic Script If:</Text>
                  <Text as="p" variant="bodyMd">
                    • You want instant setup with no configuration<br/>
                    • You have a Theme 1.0 store (Debut, Brooklyn, Venture)<br/>
                    • You want universal compatibility<br/>
                    • You prefer "set it and forget it" approach
                  </Text>
                </BlockStack>
              </Box>
              
              <Box background="bg-surface-info" padding="400" borderRadius="200">
                <BlockStack gap="200">
                  <Text as="h4" variant="headingSm">🎨 Choose App Block If:</Text>
                  <Text as="p" variant="bodyMd">
                    • You have a Theme 2.0 store (Dawn, Craft, Sense)<br/>
                    • You want precise control over placement<br/>
                    • You want to customize colors and styling<br/>
                    • You prefer using the theme editor interface
                  </Text>
                </BlockStack>
              </Box>
              
              <Box background="bg-surface-warning" padding="400" borderRadius="200">
                <BlockStack gap="200">
                  <Text as="h4" variant="headingSm">💡 Can I Use Both?</Text>
                  <Text as="p" variant="bodyMd">
                    Yes! You can use both methods simultaneously. Many merchants start with automatic 
                    injection for immediate functionality, then add app blocks for specific pages or 
                    custom styling.
                  </Text>
                </BlockStack>
              </Box>
            </BlockStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text as="h3" variant="headingMd">How Visual Search Works</Text>
            
            <BlockStack gap="200">
              <Box paddingInlineStart="400">
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd">• Adds a camera icon to search bars in your store</Text>
                  <Text as="p" variant="bodyMd">• Customers can click the icon to upload an image</Text>
                  <Text as="p" variant="bodyMd">• AI analyzes the image and generates search terms</Text>
                  <Text as="p" variant="bodyMd">• Automatically searches your store for matching products</Text>
                  <Text as="p" variant="bodyMd">• Completely invisible to customers when not in use</Text>
                </BlockStack>
              </Box>
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
