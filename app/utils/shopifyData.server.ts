import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { appDatabase } from "../services/app.database.service";

export async function shopifyStoreLoader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Check if the store already exists in the database
  const storeExists = await appDatabase.getStore(shopDomain);
  console.log("Store exists in database:", storeExists);
  
  if (storeExists) {
    // Check if we have any synced products
    const syncProgress = await appDatabase.getSyncProgress(shopDomain);
    const hasSyncedProducts = syncProgress.synced_products > 0;
    
    return {
      store: storeExists,
      products: [], // Don't load products on initial load
      isFirstTime: false,
      needsSync: !hasSyncedProducts, // Need sync if no products synced
      productCount: syncProgress.synced_products || 0,
    };
  }

  // Fetch store information and products from Shopify (with images, metafields, and more shop details)
  const storeResponse = await admin.graphql(
    `#graphql
      query {
        shop {
          # Basic Info (existing)
          id
          name
          myshopifyDomain
          email
          currencyCode
          timezoneAbbreviation
          timezoneOffset
          timezoneOffsetMinutes
          createdAt
          updatedAt
          
          # Plan Details (enhanced)
          plan {
            partnerDevelopment
            shopifyPlus
          }
          
          # Store Details (NEW)
          description
          url
          primaryDomain {
            host
            sslEnabled
            url
          }
          
          # Contact & Communication (NEW)
          contactEmail
          
          # Location & Settings (NEW)
          ianaTimezone
          weightUnit
          unitSystem
          enabledPresentmentCurrencies
          
          # Address Information (NEW)
          billingAddress {
            address1
            address2
            city
            company
            country
            countryCodeV2
            phone
            province
            provinceCode
            zip
          }
          
          # Store Configuration (NEW)
          checkoutApiSupported
          setupRequired
          taxesIncluded
          taxShipping
          marketingSmsConsentEnabledAtCheckout
          transactionalSmsDisabled
          
          # Store Features (NEW)
          features {
            avalaraAvatax
            branding
            captcha
            eligibleForSubscriptions
            giftCards
            reports
            sellsSubscriptions
            showMetrics
            storefront
          }
          
          # Resource Limits (NEW)
          resourceLimits {
            locationLimit
            maxProductOptions
            maxProductVariants
            redirectLimitReached
          }
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
              media(first: 10) {
                edges {
                  node {
                    mediaContentType
                    ... on MediaImage {
                      image {
                        url
                        altText
                        width
                        height
                      }
                    }
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    price
                    sku
                    title
                    availableForSale
                    image {
                      url
                      altText
                      width
                      height
                    }
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
  
  // Enhanced logging to show all captured store details
  console.log("📊 COMPLETE STORE DATA CAPTURED:");
  console.log("🏪 Basic Info:", {
    name: storeData.data.shop.name,
    domain: storeData.data.shop.myshopifyDomain,
    email: storeData.data.shop.email,
    currency: storeData.data.shop.currencyCode
  });
  
  console.log("📍 Store Location & Contact:", {
    contactEmail: storeData.data.shop.contactEmail,
    timezone: storeData.data.shop.ianaTimezone,
    address: storeData.data.shop.billingAddress
  });
  
  console.log("💎 Plan & Features:", {
    plan: storeData.data.shop.plan,
    features: storeData.data.shop.features,
    limits: storeData.data.shop.resourceLimits
  });
  
  console.log("🎨 Store Configuration:", {
    description: storeData.data.shop.description,
    url: storeData.data.shop.url,
    primaryDomain: storeData.data.shop.primaryDomain,
    taxSettings: {
      taxesIncluded: storeData.data.shop.taxesIncluded,
      taxShipping: storeData.data.shop.taxShipping
    }
  });
  
  console.log("⚙️ Store Capabilities:", {
    checkoutApiSupported: storeData.data.shop.checkoutApiSupported,
    weightUnit: storeData.data.shop.weightUnit,
    unitSystem: storeData.data.shop.unitSystem,
    currencies: storeData.data.shop.enabledPresentmentCurrencies
  });
  
  console.log("📦 Products Summary:", {
    totalProducts: storeData.data.products.edges.length,
    firstProduct: storeData.data.products.edges[0]?.node.title
  });

  // Only save store details, not products - let user decide when to sync
  await appDatabase.syncStore(storeData.data.shop);

  // Visual search now uses App Blocks integration for Theme 2.0 stores
  // Theme configuration saved for use with app blocks
  // Use /app/app-blocks for Theme 2.0 integration and configuration

  return {
    store: storeData.data.shop,
    products: [], // Don't return products - user will sync manually
    isFirstTime: true,
    needsSync: true,
    productCount: 0, // No products synced yet
  };
}

// Action function for full sync
export async function fullSyncAction({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  try {
    // Get total product count first
    const countResponse = await admin.graphql(`
      query {
        productsCount {
          count
        }
      }
    `);
    const countData = await countResponse.json();
    const totalProducts = countData.data.productsCount.count;

    // Sync products in batches of 250
    const batchSize = 250;
    let cursor: string | null = null;
    let syncedCount = 0;

    while (syncedCount < totalProducts) {
      const query: string = cursor 
        ? `query {
            products(first: ${batchSize}, after: "${cursor}") {
              pageInfo {
                hasNextPage
                endCursor
              }
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
                  media(first: 10) {
                    edges {
                      node {
                        mediaContentType
                        ... on MediaImage {
                          image {
                            url
                            altText
                            width
                            height
                          }
                        }
                      }
                    }
                  }
                  variants(first: 10) {
                    edges {
                      node {
                        id
                        price
                        sku
                        title
                        availableForSale
                        image {
                          url
                          altText
                          width
                          height
                        }
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
          }`
        : `query {
            products(first: ${batchSize}) {
              pageInfo {
                hasNextPage
                endCursor
              }
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
                  media(first: 10) {
                    edges {
                      node {
                        mediaContentType
                        ... on MediaImage {
                          image {
                            url
                            altText
                            width
                            height
                          }
                        }
                      }
                    }
                  }
                  variants(first: 10) {
                    edges {
                      node {
                        id
                        price
                        sku
                        title
                        availableForSale
                        image {
                          url
                          altText
                          width
                          height
                        }
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
          }`;

      const response: any = await admin.graphql(query);
      const data: any = await response.json();
      
      const products = data.data.products.edges.map((edge: any) => edge.node);
      
      // Save products batch
      await appDatabase.saveProductsBatch(shopDomain, products);
      
      syncedCount += products.length;
      cursor = data.data.products.pageInfo.endCursor;
      
      // Rate limiting - wait 50ms between batches
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Break if no more pages
      if (!data.data.products.pageInfo.hasNextPage) {
        break;
      }
    }

    return { success: true, syncedProducts: syncedCount, totalProducts };
  } catch (error: any) {
    console.error('Full sync error:', error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

// Function to get sync progress
export async function getSyncProgress(shopDomain: string) {
  try {
    const progress = await appDatabase.getSyncProgress(shopDomain);
    return { success: true, ...progress };
  } catch (error: any) {
    console.error('Get sync progress error:', error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}
