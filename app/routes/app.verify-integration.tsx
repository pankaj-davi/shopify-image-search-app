import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import {
  Page,
  Card,
  BlockStack,
  Text,
  Banner,
  Box,
  DataTable,
} from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
import { authenticate } from '../shopify.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Get the actual app URL from the request or environment
  const url = new URL(request.url);
  const appUrl = process.env.SHOPIFY_APP_URL || `${url.protocol}//${url.host}`;

  try {
    // Check script tags
    const scriptsResponse = await admin.graphql(`
      query {
        scriptTags(first: 50) {
          edges {
            node {
              id
              src
              displayScope
              createdAt
              updatedAt
            }
          }
        }
      }
    `);

    const scriptsData = await scriptsResponse.json();
    const allScripts = scriptsData.data.scriptTags.edges.map(
      (edge: any) => edge.node
    );
    const visualSearchScripts = allScripts.filter(
      (script: any) =>
        script.src.includes('visual-search-script.js') ||
        script.src.includes('visual-search')
    );

    // Check app installation details
    const appResponse = await admin.graphql(`
      query {
        currentAppInstallation {
          id
          app {
            title
            handle
          }
          accessScopes {
            handle
          }
        }
      }
    `);

    const appData = await appResponse.json();

    // Get shop details
    const shopResponse = await admin.graphql(`
      query {
        shop {
          id
          name
          myshopifyDomain
          email
          plan {
            displayName
            partnerDevelopment
            shopifyPlus
          }
          features {
            storefront
            eligibleForSubscriptions
          }
          primaryDomain {
            url
            sslEnabled
          }
        }
      }
    `);

    const shopData = await shopResponse.json();

    return json({
      shop: shopDomain,
      shopDetails: shopData.data.shop,
      appInstallation: appData.data.currentAppInstallation,
      allScripts,
      visualSearchScripts,
      scriptCount: allScripts.length,
      visualSearchActive: visualSearchScripts.length > 0,
      appUrl: appUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Verification error:', error);
    return json({
      shop: shopDomain,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}

export default function VerifyIntegration() {
  const data = useLoaderData<typeof loader>();

  if ('error' in data) {
    return (
      <Page title="Verification Failed">
        <TitleBar title="Visual Search Integration - Verification Failed" />
        <BlockStack gap="400">
          <Banner title="❌ Verification Failed" tone="critical">
            <Text as="p">
              <strong>Error:</strong> {data.error}
            </Text>
          </Banner>
        </BlockStack>
      </Page>
    );
  }

  const getStatusIcon = (isGood: boolean) => (isGood ? '✅' : '❌');

  return (
    <Page title="Visual Search Integration Verification">
      <TitleBar title="Visual Search Integration - Verification Report" />
      <BlockStack gap="400">
        {/* Shop Information */}
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h2">
              Shop Information
            </Text>
            <Box>
              <DataTable
                columnContentTypes={['text', 'text']}
                headings={['Property', 'Value']}
                rows={[
                  ['Shop Domain', data.shop],
                  ['Shop Name', data.shopDetails?.name || 'N/A'],
                  ['Plan', data.shopDetails?.plan?.displayName || 'N/A'],
                  [
                    'Primary Domain',
                    data.shopDetails?.primaryDomain?.url || 'N/A',
                  ],
                  [
                    'SSL Enabled',
                    data.shopDetails?.primaryDomain?.sslEnabled
                      ? '✅ Yes'
                      : '❌ No',
                  ],
                ]}
              />
            </Box>
          </BlockStack>
        </Card>

        {/* App Installation Status */}
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h2">
              App Installation Status
            </Text>
            <Box>
              <DataTable
                columnContentTypes={['text', 'text']}
                headings={['Property', 'Value']}
                rows={[
                  ['App ID', data.appInstallation?.id || 'N/A'],
                  ['App Title', data.appInstallation?.app?.title || 'N/A'],
                  ['App Handle', data.appInstallation?.app?.handle || 'N/A'],
                  [
                    'Access Scopes',
                    data.appInstallation?.accessScopes
                      ?.map((scope: any) => scope.handle)
                      .join(', ') || 'N/A',
                  ],
                ]}
              />
            </Box>
          </BlockStack>
        </Card>

        {/* Visual Search Status */}
        <Banner
          title={`${getStatusIcon(data.visualSearchActive)} Visual Search Status`}
          tone={data.visualSearchActive ? 'success' : 'critical'}
        >
          <BlockStack gap="200">
            <Text as="p">
              <strong>Status:</strong>{' '}
              {data.visualSearchActive ? 'ACTIVE' : 'NOT ACTIVE'}
            </Text>
            <Text as="p">
              <strong>Scripts Found:</strong> {data.visualSearchScripts.length}
            </Text>
            <Text as="p">
              <strong>Total Scripts:</strong> {data.scriptCount}
            </Text>
            <Text as="p">
              <strong>App URL:</strong> {data.appUrl}
            </Text>
          </BlockStack>
        </Banner>

        {/* Script Details */}
        {data.visualSearchScripts.length > 0 && (
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Visual Search Script Details
              </Text>
              {data.visualSearchScripts.map((script: any, index: number) => (
                <Card key={script.id} background="bg-surface-secondary">
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h4">
                      Script #{index + 1}
                    </Text>
                    <Box>
                      <DataTable
                        columnContentTypes={['text', 'text']}
                        headings={['Property', 'Value']}
                        rows={[
                          ['ID', script.id],
                          ['Source URL', script.src],
                          ['Display Scope', script.displayScope],
                          [
                            'Created',
                            new Date(script.createdAt).toLocaleString(),
                          ],
                          [
                            'Updated',
                            new Date(script.updatedAt).toLocaleString(),
                          ],
                        ]}
                      />
                    </Box>
                  </BlockStack>
                </Card>
              ))}
            </BlockStack>
          </Card>
        )}

        {/* Testing Instructions */}
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h2">
              🧪 How to Test Visual Search
            </Text>
            <ol>
              <li>
                <Text as="span">
                  <strong>Visit your storefront:</strong> Go to{' '}
                  <a
                    href={data.shopDetails?.primaryDomain?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {data.shopDetails?.primaryDomain?.url}
                  </a>
                </Text>
              </li>
              <li>
                <Text as="span">
                  <strong>Look for search bars:</strong> Check the header,
                  navigation, or any search functionality
                </Text>
              </li>
              <li>
                <Text as="span">
                  <strong>Find the camera icon:</strong> You should see a small
                  camera/image icon inside or next to search inputs
                </Text>
              </li>
              <li>
                <Text as="span">
                  <strong>Test the functionality:</strong> Click the camera icon
                  and try uploading an image
                </Text>
              </li>
              <li>
                <Text as="span">
                  <strong>Check console:</strong> Open browser dev tools (F12)
                  and check for any JavaScript errors
                </Text>
              </li>
            </ol>
          </BlockStack>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h2">
              🔧 Troubleshooting
            </Text>

            <BlockStack gap="300">
              <Text variant="headingSm" as="h4">
                If visual search is not working:
              </Text>
              <ul>
                <li>
                  <Text as="span">
                    Check if the script is properly injected (see script details
                    above)
                  </Text>
                </li>
                <li>
                  <Text as="span">
                    Verify the script URL is accessible:{' '}
                    <a
                      href={`${data.appUrl}/visual-search-script.js`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {data.appUrl}/visual-search-script.js
                    </a>
                  </Text>
                </li>
                <li>
                  <Text as="span">
                    Ensure your theme has search functionality
                  </Text>
                </li>
                <li>
                  <Text as="span">
                    Check browser console for JavaScript errors
                  </Text>
                </li>
                <li>
                  <Text as="span">Test on different devices and browsers</Text>
                </li>
                <li>
                  <Text as="span">
                    Verify SSL certificate is working properly
                  </Text>
                </li>
              </ul>
            </BlockStack>

            <BlockStack gap="300">
              <Text variant="headingSm" as="h4">
                Common issues:
              </Text>
              <ul>
                <li>
                  <Text as="span">
                    <strong>No camera icon:</strong> Theme might use custom
                    search selectors
                  </Text>
                </li>
                <li>
                  <Text as="span">
                    <strong>Script not loading:</strong> Check CORS settings and
                    SSL
                  </Text>
                </li>
                <li>
                  <Text as="span">
                    <strong>Upload fails:</strong> Verify API endpoint is
                    working
                  </Text>
                </li>
                <li>
                  <Text as="span">
                    <strong>Search not triggering:</strong> Form submission
                    might need adjustment
                  </Text>
                </li>
              </ul>
            </BlockStack>
          </BlockStack>
        </Card>

        {/* All Scripts (for debugging) */}
        {data.allScripts.length > 0 && (
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">
                🔍 View All Script Tags ({data.allScripts.length} total)
              </Text>
              <Box
                background="bg-surface-secondary"
                padding="400"
                borderRadius="200"
              >
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <BlockStack gap="200">
                    {data.allScripts.map((script: any, index: number) => (
                      <Box
                        key={script.id}
                        background="bg-surface"
                        padding="300"
                        borderRadius="150"
                        borderWidth="025"
                        borderColor="border"
                      >
                        <Text variant="bodySm" as="p">
                          <strong>#{index + 1}:</strong> {script.src}
                          <br />
                          <Text as="span" tone="subdued">
                            ID: {script.id} | Scope: {script.displayScope}
                          </Text>
                        </Text>
                      </Box>
                    ))}
                  </BlockStack>
                </div>
              </Box>
            </BlockStack>
          </Card>
        )}

        {/* Footer */}
        <Box
          borderWidth="025"
          borderColor="border"
          borderBlockStartWidth="025"
          padding="400"
        >
          <Text variant="bodySm" as="p" alignment="center" tone="subdued">
            Verification completed at:{' '}
            {new Date(data.timestamp).toLocaleString()}
          </Text>
        </Box>
      </BlockStack>
    </Page>
  );
}
