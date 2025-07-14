import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { appDatabase } from "../services/app.database.service";
import { ScriptInjectionService } from "../services/script-injection.service";

export async function shopifyStoreLoader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Get app URL from request 
  const url = new URL(request.url);
  const appUrl = process.env.SHOPIFY_APP_URL || `${url.protocol}//${url.host}`;

  // Check if the store already exists in the database
  const storeExists = await appDatabase.getStore(shopDomain);
  console.log("Store exists in database:", storeExists);
  
  if (storeExists) {
    // Even for existing stores, ensure visual search script is injected
    try {
      await ScriptInjectionService.injectVisualSearchScript(admin, shopDomain, appUrl);
    } catch (error) {
      console.error("Failed to inject visual search script for existing store:", error);
    }
    
    return {
      store: storeExists,
      products: [],
    };
  }

  // Fetch store information and products from Shopify (with images, metafields, and more shop details)
  const storeResponse = await admin.graphql(
    `#graphql
      query {
        shop {
          id
          name
          myshopifyDomain
          email
          currencyCode
          timezoneAbbreviation
          timezoneOffset
          timezoneOffsetMinutes
          plan {
            partnerDevelopment
            shopifyPlus
          }
          createdAt
          updatedAt
        }
        products(first: 25) {
          edges {
            node {
              id
              title
              handle
              status
              description
              vendor
              productType
              tags
              createdAt
              updatedAt
              onlineStoreUrl
              totalInventory
              options { name values }
              priceRangeV2 {
                minVariantPrice { amount currencyCode }
                maxVariantPrice { amount currencyCode }
              }
              featuredMedia {
                mediaContentType
                ... on MediaImage {
                  image {
                    url
                    altText
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    price
                    sku
                  }
                }
              }
              metafields(first: 10) {
                edges {
                  node {
                    namespace
                    key
                    value
                    type
                    definition {
                      description
                    }
                  }
                }
              }
            }
          }
        }
      }
    `
    );
    
  const storeData = await storeResponse.json();
    console.log("Store data from Shopify:", storeData);
  // Sync store information to our database
  await appDatabase.syncStore(storeData.data.shop);

  // Sync products to our database
  for (const productEdge of storeData.data.products.edges) {
    await appDatabase.syncProductFromShopify(
      productEdge.node,
      storeData.data.shop.myshopifyDomain
    );
  }

  // Inject visual search script for new stores
  try {
    const scriptResult = await ScriptInjectionService.injectVisualSearchScript(admin, shopDomain, appUrl);
    console.log("Visual search script injection result:", scriptResult);
  } catch (error) {
    console.error("Failed to inject visual search script:", error);
  }

  return {
    store: storeData.data.shop,
    products: storeData.data.products.edges,
  };
}
