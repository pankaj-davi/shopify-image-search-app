import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { appDatabase } from "../services/app.database.service";

export async function shopifyStoreLoader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Check if the store already exists in the database
  const storeExists = await appDatabase.getStore(shopDomain);
  console.log("Store exists in database:", storeExists);
  
  if (storeExists) {
    // Script injection is now optional - merchants can choose automatic or app blocks
    // Visual search script injection moved to manual control via /app/visual-search
    
    // Get store with associated products for better data consistency
    const storeWithProducts = await appDatabase.getStoreWithProducts(shopDomain, 25);
    
    return {
      store: storeWithProducts?.store || storeExists,
      products: storeWithProducts?.products?.map((product: any) => ({ node: product })) || [],
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

  // Use the enhanced atomic sync method for better consistency and performance
  await appDatabase.syncStoreWithProducts(
    storeData.data.shop,
    storeData.data.products.edges.map((edge: any) => edge.node)
  );

  // Script injection is now optional - merchants can choose automatic or app blocks
  // Visual search script injection moved to manual control via /app/visual-search
  // Use /app/visual-search to enable automatic injection or /app/app-blocks for manual integration

  return {
    store: storeData.data.shop,
    products: storeData.data.products.edges,
  };
}
