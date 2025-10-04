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
    console.log("🔍 Store exists, checking product sync status...");

    let actualProductCount = 0;
    let hasSyncedProducts = false;
    let ongoingJobId = null;

    // Check for latest sync job (any status for UI state restoration)
    try {
      const latestJob = await appDatabase.getLatestSyncJob(shopDomain);

      if (latestJob) {
        // Use syncedCount from sync job for accurate count (handles >1000 products)
        if (latestJob.syncedCount && latestJob.syncedCount > 0) {
          actualProductCount = latestJob.syncedCount;
          hasSyncedProducts = true;
          console.log(`📊 Using count from sync job (${latestJob.status}): ${actualProductCount}`);
        }

        // Return job if it's pending, running, or failed (to allow resume)
        if (latestJob.status === 'pending' || latestJob.status === 'running' || latestJob.status === 'failed') {
          ongoingJobId = latestJob.id;
          console.log(`🔄 Found sync job (${latestJob.status}): ${ongoingJobId}`);
        }
        // For completed jobs, show success message briefly (10 seconds)
        else if (latestJob.status === 'completed' && latestJob.completedAt) {
          const completedAt = new Date(latestJob.completedAt);
          const now = new Date();
          const secondsSinceComplete = (now.getTime() - completedAt.getTime()) / 1000;
          if (secondsSinceComplete < 10) {
            ongoingJobId = latestJob.id;
            console.log(`✅ Found recently completed job: ${ongoingJobId}`);
          }
        }
      }

      // No Firestore products - count comes from sync_jobs only
    } catch (error) {
      console.error('❌ Error checking for sync job:', error);
    }

    return {
      store: storeExists,
      products: [], // Don't load products on initial load
      isFirstTime: false,
      needsSync: !hasSyncedProducts, // Need sync if no products synced
      productCount: actualProductCount, // Return actual count in DB
      totalProductsInShopify: storeExists.totalProductsInShopify || 0, // Total in Shopify
      ongoingJobId, // Return ongoing job if exists
    };
  }

  // Fetch store information from Shopify (Python server handles product fetching)
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
      }
    `
    );
  const storeData = await storeResponse.json();

  // Get total product count from Shopify
  const countResponse = await admin.graphql(`
    query {
      productsCount {
        count
      }
    }
  `);
  const countData = await countResponse.json();
  const totalProducts = countData.data?.productsCount?.count || 0;

  console.log(`📊 Store has ${totalProducts} total products in Shopify`);

  // Sync store with total product count from Shopify
  await appDatabase.syncStore({
    ...storeData.data.shop,
    totalProductsInShopify: totalProducts // Save Shopify's total count
  });

  return {
    store: storeData.data.shop,
    products: [], // Don't return products - user will sync manually
    isFirstTime: true,
    needsSync: true,
    productCount: 0, // No products synced to DB yet
    totalProductsInShopify: totalProducts, // Total in Shopify
  };
}