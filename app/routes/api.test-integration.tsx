import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const testType = url.searchParams.get('type') || 'script';

  // Get the actual app URL from the request or environment
  const appUrl = process.env.SHOPIFY_APP_URL || `${url.protocol}//${url.host}`;

  try {
    switch (testType) {
      case 'script':
        // Test if the visual search script is accessible
        const scriptUrl = `${appUrl}/visual-search-script.js`;

        try {
          const scriptResponse = await fetch(scriptUrl);
          const scriptContent = await scriptResponse.text();

          return json({
            test: 'Script Accessibility',
            success: scriptResponse.ok,
            status: scriptResponse.status,
            contentLength: scriptContent.length,
            hasVisualSearchCode: scriptContent.includes(
              'injectVisualSearchIcon'
            ),
            scriptUrl,
            timestamp: new Date().toISOString(),
          });
        } catch (fetchError) {
          return json({
            test: 'Script Accessibility',
            success: false,
            error:
              fetchError instanceof Error ? fetchError.message : 'Fetch failed',
            scriptUrl,
            timestamp: new Date().toISOString(),
          });
        }

      case 'api':
        // Test the visual search API endpoint
        const testImageData =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

        // Create a small test image file
        const testFile = new File(
          [
            Uint8Array.from(atob(testImageData.split(',')[1]), c =>
              c.charCodeAt(0)
            ),
          ],
          'test.png',
          { type: 'image/png' }
        );

        const formData = new FormData();
        formData.append('image', testFile);
        formData.append('shop', 'test-shop.myshopify.com');

        try {
          const apiResponse = await fetch(`${appUrl}/api/visual-search`, {
            method: 'POST',
            body: formData,
          });

          const apiResult = await apiResponse.json();

          return json({
            test: 'API Endpoint',
            success: apiResponse.ok,
            status: apiResponse.status,
            response: apiResult,
            timestamp: new Date().toISOString(),
          });
        } catch (apiError) {
          return json({
            test: 'API Endpoint',
            success: false,
            error:
              apiError instanceof Error ? apiError.message : 'API test failed',
            timestamp: new Date().toISOString(),
          });
        }

      case 'config':
        // Test configuration
        return json({
          test: 'Configuration',
          success: true,
          config: {
            appUrl: process.env.SHOPIFY_APP_URL || 'Not set',
            nodeEnv: process.env.NODE_ENV || 'Not set',
            shopifyApiVersion: process.env.SHOPIFY_API_VERSION || 'Not set',
            hasRequiredEnvVars: !!(
              process.env.SHOPIFY_API_KEY && process.env.SHOPIFY_API_SECRET
            ),
          },
          timestamp: new Date().toISOString(),
        });

      default:
        return json({
          test: 'Unknown',
          success: false,
          error: 'Invalid test type',
          availableTests: ['script', 'api', 'config'],
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    return json(
      {
        test: testType,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
