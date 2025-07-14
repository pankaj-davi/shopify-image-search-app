import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useActionData, Form } from '@remix-run/react';
import {
  Page,
  Card,
  BlockStack,
  Text,
  Button,
  Banner,
  Box,
  InlineStack,
} from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
import { authenticate } from '../shopify.server';
import { ScriptInjectionService } from '../services/script-injection.service';

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
      (edge: any) =>
        edge.node.src.includes('visual-search-script.js') ||
        edge.node.src.includes('visual-search-unified.js')
    );

    return json({
      shop: shopDomain,
      isScriptInjected: !!visualSearchScript,
      scriptData: visualSearchScript?.node || null,
    });
  } catch (error) {
    console.error('Error checking script status:', error);

    // Check if it's a permissions error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isPermissionError =
      errorMessage.includes('Access denied') ||
      errorMessage.includes('scriptTags');

    return json({
      shop: shopDomain,
      isScriptInjected: false,
      scriptData: null,
      error: isPermissionError
        ? "Permission denied: App needs 'write_script_tags' scope. Please reinstall the app after updating permissions."
        : 'Failed to check script status',
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const formData = await request.formData();
  const action = formData.get('action');

  try {
    if (action === 'inject') {
      const result = await ScriptInjectionService.injectVisualSearchScript(
        admin,
        shopDomain
      );
      return json(result);
    } else if (action === 'remove') {
      const result = await ScriptInjectionService.removeVisualSearchScript(
        admin,
        shopDomain
      );
      return json(result);
    } else if (action === 'cleanup') {
      // Remove all old scripts and inject a fresh one
      const result = await ScriptInjectionService.injectVisualSearchScript(
        admin,
        shopDomain
      );
      return json({
        ...result,
        message: result.success
          ? 'All old scripts removed and fresh script injected successfully!'
          : result.message,
      });
    } else {
      return json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error executing action:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export default function VisualSearchSettings() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  // Handle error display safely
  const errorMessage =
    'error' in data && data.error && typeof data.error === 'string'
      ? data.error
      : null;

  return (
    <Page>
      <TitleBar title="Visual Search Settings" />

      <BlockStack gap="500">
        {errorMessage && (
          <Banner tone="critical" title="Error">
            {errorMessage}
          </Banner>
        )}

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Current Status
            </Text>

            <BlockStack gap="200">
              <Text as="p" variant="bodyMd">
                <Text as="span" fontWeight="semibold">
                  Shop:
                </Text>{' '}
                {data.shop}
              </Text>

              <InlineStack gap="200" align="start">
                <Text as="span" variant="bodyMd" fontWeight="semibold">
                  Visual Search Script:
                </Text>
                <Text
                  as="span"
                  variant="bodyMd"
                  tone={data.isScriptInjected ? 'success' : 'critical'}
                  fontWeight="semibold"
                >
                  {data.isScriptInjected ? '✅ Active' : '❌ Not Active'}
                </Text>
              </InlineStack>

              {data.scriptData && (
                <Box paddingBlockStart="300">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodySm" tone="subdued">
                      <Text as="span" fontWeight="semibold">
                        Script ID:
                      </Text>{' '}
                      {data.scriptData.id}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      <Text as="span" fontWeight="semibold">
                        Created:
                      </Text>{' '}
                      {new Date(data.scriptData.createdAt).toLocaleString()}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      <Text as="span" fontWeight="semibold">
                        Source:
                      </Text>{' '}
                      {data.scriptData.src}
                    </Text>
                  </BlockStack>
                </Box>
              )}
            </BlockStack>
          </BlockStack>
        </Card>

        {actionData && (
          <Banner
            tone={actionData.success ? 'success' : 'critical'}
            title={actionData.success ? 'Success' : 'Error'}
          >
            {'message' in actionData
              ? actionData.message
              : 'error' in actionData
                ? actionData.error
                : 'Operation completed'}
          </Banner>
        )}

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Actions
            </Text>

            <InlineStack gap="300" wrap>
              <Form method="post">
                <input type="hidden" name="action" value="inject" />
                <Button
                  submit
                  variant="primary"
                  disabled={data.isScriptInjected}
                >
                  {data.isScriptInjected
                    ? 'Already Active'
                    : 'Activate Visual Search'}
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
                  {!data.isScriptInjected
                    ? 'Not Active'
                    : 'Deactivate Visual Search'}
                </Button>
              </Form>

              <Form method="post">
                <input type="hidden" name="action" value="cleanup" />
                <Button submit variant="secondary">
                  🔧 Fix Script Issues
                </Button>
              </Form>

              <Button url="/app/preview" variant="secondary">
                🎨 Preview & Customize
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text as="h3" variant="headingMd">
              How Visual Search Works
            </Text>

            <BlockStack gap="200">
              <Box paddingInlineStart="400">
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd">
                    • Automatically adds a camera icon to all search bars in
                    your store
                  </Text>
                  <Text as="p" variant="bodyMd">
                    • Works with any theme - no manual configuration required
                  </Text>
                  <Text as="p" variant="bodyMd">
                    • Customers can click the icon to upload an image
                  </Text>
                  <Text as="p" variant="bodyMd">
                    • AI analyzes the image and generates search terms
                  </Text>
                  <Text as="p" variant="bodyMd">
                    • Automatically searches your store for matching products
                  </Text>
                  <Text as="p" variant="bodyMd">
                    • Completely invisible to customers when not in use
                  </Text>
                </BlockStack>
              </Box>

              <BlockStack gap="200">
                <Text as="h4" variant="headingSm">
                  Supported Themes:
                </Text>
                <Box paddingInlineStart="400">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd">
                      ✅ All Shopify themes (Dawn, Debut, Brooklyn, Venture,
                      etc.)
                    </Text>
                    <Text as="p" variant="bodyMd">
                      ✅ Custom themes
                    </Text>
                    <Text as="p" variant="bodyMd">
                      ✅ Third-party themes
                    </Text>
                    <Text as="p" variant="bodyMd">
                      ✅ Mobile and desktop
                    </Text>
                  </BlockStack>
                </Box>
              </BlockStack>
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
