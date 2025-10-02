import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { appDatabase } from "../services/app.database.service";

const SHOPIFY_APP_EMBEDDINGS_URL = process.env.SHOPIFY_APP_EMBEDDINGS_URL;

export async function shopifyStoreLoader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Check if the store already exists in the database
  const storeExists = await appDatabase.getStore(shopDomain);
  console.log("Store exists in database:", storeExists);
  
  if (storeExists) {
    console.log("🔍 Store exists, checking product sync status...");
    // Check if we have any synced products and get actual count
    const storeProducts = await appDatabase.getStoreProducts(shopDomain, 1000); // Get more to count
    const hasSyncedProducts = storeProducts.length > 0;
    const actualProductCount = storeProducts.length;
    
    console.log(`📊 Found ${actualProductCount} products in database`);
    
    return {
      store: storeExists,
      products: [], // Don't load products on initial load
      isFirstTime: false,
      needsSync: !hasSyncedProducts, // Need sync if no products synced
      productCount: actualProductCount, // Return actual count
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
  
  await appDatabase.syncStore(storeData.data.shop);

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
  console.log('🚀 Starting full sync action...');
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  console.log(`📍 Shop Domain: ${shopDomain}`);

  try {
    let dbSyncStatus = {
      success: false,
      syncedCount: 0,
      totalProducts: 0
    };
    console.log('📊 Initial sync status:', dbSyncStatus);

    // Check if DB sync is needed (if previous embedding failed)
    console.log('🔍 Checking if database sync is needed...');
    const existingProducts = await appDatabase.getStoreProducts(shopDomain, 1);
    const needsDBSync = existingProducts.length === 0;
    console.log(`📌 Database sync needed: ${needsDBSync ? 'Yes' : 'No'}`);

    if (needsDBSync) {
      console.log('📥 Starting database sync...');
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
      console.log(`📦 Total products to sync: ${totalProducts}`);
      console.log('🔄 Starting batch sync process...');

      try {
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
      console.log(`💾 Saving batch of ${products.length} products...`);
      await appDatabase.saveProductsBatch(shopDomain, products);
      
      syncedCount += products.length;
      cursor = data.data.products.pageInfo.endCursor;
      console.log(`✅ Progress: ${syncedCount}/${totalProducts} products synced`);
      
      // Rate limiting - wait 50ms between batches
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Break if no more pages
      if (!data.data.products.pageInfo.hasNextPage) {
        break;
      }
    }

    dbSyncStatus = {
      success: true,
      syncedCount: syncedCount,
      totalProducts: totalProducts
    };
    console.log('✨ Database sync completed successfully:', dbSyncStatus);
      } catch (dbError: any) {
        console.error('❌ Database sync failed:', dbError);
        return {
          success: false,
          error: dbError?.message || 'Database sync failed',
          phase: 'database',
          needsDBSync: true,
          needsEmbeddingSync: true
        };
      }
    } else {
      dbSyncStatus = {
        success: true,
        syncedCount: existingProducts.length,
        totalProducts: existingProducts.length
      };
    }

    // If DB sync succeeded or wasn't needed, try embedding
    console.log('🎯 Starting embedding process...');
    try {
      console.log(`📡 Calling embedding API for shop: ${shopDomain}`);
      const formData = new FormData();
      formData.append('store_domain', shopDomain);
      console.log(`🔧 Curl equivalent: curl --location "${SHOPIFY_APP_EMBEDDINGS_URL}/sync" --form 'store_domain="${shopDomain}"'`);
      const embeddingResponse = await fetch(`${SHOPIFY_APP_EMBEDDINGS_URL}/sync`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(3000000), // 5 min timeout
      });
      console.log('📊 Embedding API Response:', {
        status: embeddingResponse.status,
        statusText: embeddingResponse.statusText,
        ok: embeddingResponse.ok
      });
      if (!embeddingResponse.ok) {
        console.warn('⚠️ Embedding API returned error status:', embeddingResponse.status);
        return {
          success: false,
          error: 'Visual search setup incomplete',
          phase: 'embedding',
          needsDBSync: false,
          needsEmbeddingSync: true,
          dbStatus: dbSyncStatus
        };
      }

      console.log('🎉 Everything succeeded - both database and embedding sync complete');
      // Everything succeeded
      return {
        success: true,
        syncedProducts: dbSyncStatus.syncedCount,
        totalProducts: dbSyncStatus.totalProducts,
        embeddingSuccess: true
      };

    } catch (embeddingError: any) {
      console.error('❌ Embedding sync error:', {
        error: embeddingError.message,
        name: embeddingError.name,
        stack: embeddingError.stack
      });
      return {
        success: false,
        error: 'Visual search setup incomplete',
        phase: 'embedding',
        needsDBSync: false,
        needsEmbeddingSync: true,
        dbStatus: dbSyncStatus
      };
    }

  } catch (error: any) {
    console.error('Full sync error:', error);
    return {
      success: false,
      error: error?.message || 'Unexpected error occurred',
      phase: 'unknown',
      needsDBSync: true,
      needsEmbeddingSync: true
    };
  }
}
