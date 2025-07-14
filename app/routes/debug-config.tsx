import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { appDatabase } from '../services/app.database.service';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop =
    url.searchParams.get('shop') || 'pixel-dress-store.myshopify.com';

  console.log(`[Debug Config] Request for shop: ${shop}`);

  try {
    const shopData = await appDatabase.getStore(shop);
    console.log(`[Debug Config] Shop data retrieved:`, shopData);

    const response = {
      timestamp: new Date().toISOString(),
      shop,
      shopData,
      themeConfig: shopData?.themeConfig || {},
      hasThemeConfig: !!shopData?.themeConfig,
      configKeys: shopData?.themeConfig
        ? Object.keys(shopData.themeConfig)
        : [],
      iconPosition: shopData?.themeConfig?.iconPosition || 'not set',
      iconOffset: shopData?.themeConfig?.iconOffset || 'not set',
    };

    console.log(`[Debug Config] Response:`, response);
    return json(response);
  } catch (error) {
    console.error(`[Debug Config] Error:`, error);
    return json({
      timestamp: new Date().toISOString(),
      shop,
      error: error instanceof Error ? error.message : 'Unknown error',
      shopData: null,
      themeConfig: {},
      hasThemeConfig: false,
      configKeys: [],
    });
  }
}
