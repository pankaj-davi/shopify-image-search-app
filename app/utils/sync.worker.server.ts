import { appDatabase } from "../services/app.database.service";

interface SyncWorkerParams {
  admin: any;
  shopDomain: string;
  jobId: string;
}

/**
 * Background sync worker that continues even if client disconnects
 * Processes products in chunks and updates job status in Firebase
 */
export async function runBackgroundSync({ admin, shopDomain, jobId }: SyncWorkerParams) {
  console.log(`🚀 Background sync worker started for job: ${jobId}`);

  try {
    // Update job status to running
    await appDatabase.updateSyncJob(jobId, {
      status: 'running',
      startedAt: new Date().toISOString()
    });

    // Get total product count
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

    // Update total count
    await appDatabase.updateSyncJob(jobId, {
      totalProducts
    });

    // Sync in chunks
    const batchSize = 50;
    let cursor: string | null = null;
    let syncedCount = 0;

    while (syncedCount < totalProducts) {
      console.log(`🔄 Fetching batch (synced: ${syncedCount}/${totalProducts})...`);

      const query = cursor
        ? `query {
            products(first: ${batchSize}, after: "${cursor}") {
              pageInfo { hasNextPage endCursor }
              edges {
                node {
                  id title handle status description vendor productType tags
                  createdAt updatedAt onlineStoreUrl totalInventory
                  options { name values }
                  priceRangeV2 {
                    minVariantPrice { amount currencyCode }
                    maxVariantPrice { amount currencyCode }
                  }
                  featuredMedia {
                    mediaContentType
                    ... on MediaImage {
                      image { url altText }
                    }
                  }
                  media(first: 10) {
                    edges {
                      node {
                        mediaContentType
                        ... on MediaImage {
                          image { url altText width height }
                        }
                      }
                    }
                  }
                  variants(first: 10) {
                    edges {
                      node {
                        id price sku title availableForSale
                        image { url altText width height }
                      }
                    }
                  }
                  metafields(first: 10) {
                    edges {
                      node {
                        namespace key value type
                        definition { description }
                      }
                    }
                  }
                }
              }
            }
          }`
        : `query {
            products(first: ${batchSize}) {
              pageInfo { hasNextPage endCursor }
              edges {
                node {
                  id title handle status description vendor productType tags
                  createdAt updatedAt onlineStoreUrl totalInventory
                  options { name values }
                  priceRangeV2 {
                    minVariantPrice { amount currencyCode }
                    maxVariantPrice { amount currencyCode }
                  }
                  featuredMedia {
                    mediaContentType
                    ... on MediaImage {
                      image { url altText }
                    }
                  }
                  media(first: 10) {
                    edges {
                      node {
                        mediaContentType
                        ... on MediaImage {
                          image { url altText width height }
                        }
                      }
                    }
                  }
                  variants(first: 10) {
                    edges {
                      node {
                        id price sku title availableForSale
                        image { url altText width height }
                      }
                    }
                  }
                  metafields(first: 10) {
                    edges {
                      node {
                        namespace key value type
                        definition { description }
                      }
                    }
                  }
                }
              }
            }
          }`;

      const response = await admin.graphql(query);
      const data = await response.json();

      // EDGE CASE: Handle GraphQL errors
      if (data.errors) {
        throw new Error(`Shopify API error: ${JSON.stringify(data.errors)}`);
      }

      // EDGE CASE: Handle missing data
      if (!data.data || !data.data.products || !data.data.products.edges) {
        throw new Error('Invalid response from Shopify API');
      }

      const products = data.data.products.edges.map((edge: any) => edge.node);

      // EDGE CASE: Handle empty batch (shouldn't happen but defensive)
      if (products.length === 0 && syncedCount < totalProducts) {
        console.warn('⚠️ Received empty batch, stopping sync');
        break;
      }

      // Save batch to Firebase
      console.log(`💾 Saving batch of ${products.length} products...`);
      await appDatabase.saveProductsBatch(shopDomain, products);

      syncedCount += products.length;
      cursor = data.data.products.pageInfo.endCursor;
      const progress = Math.round((syncedCount / totalProducts) * 100);

      // Update job progress
      await appDatabase.updateSyncJob(jobId, {
        syncedCount,
        progress,
        cursor // Save cursor for resumability
      });

      console.log(`✅ Progress: ${syncedCount}/${totalProducts} (${progress}%)`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

      // Break if no more pages
      if (!data.data.products.pageInfo.hasNextPage) {
        break;
      }
    }

    console.log(`🎯 Product sync completed. Starting embeddings...`);

    // Trigger embedding sync
    let embeddingSuccess = false;
    try {
      const formData = new FormData();
      formData.append('store_domain', shopDomain);

      const embeddingResponse = await fetch(`${process.env.SHOPIFY_APP_EMBEDDINGS_URL}/sync`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      embeddingSuccess = embeddingResponse.ok;

      if (!embeddingSuccess) {
        console.warn(`⚠️ Embedding failed: ${embeddingResponse.statusText}`);
      } else {
        console.log(`✨ Embeddings completed successfully`);
      }
    } catch (embeddingError: any) {
      console.warn(`⚠️ Embedding error (non-fatal): ${embeddingError.message}`);
    }

    // Mark job as completed
    await appDatabase.updateSyncJob(jobId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      progress: 100,
      embeddingSuccess
    });

    console.log(`🎉 Background sync completed successfully for job: ${jobId}`);

    return {
      success: true,
      syncedProducts: syncedCount,
      totalProducts,
      embeddingSuccess
    };

  } catch (error: any) {
    console.error(`❌ Background sync failed for job ${jobId}:`, error);

    // Mark job as failed
    await appDatabase.updateSyncJob(jobId, {
      status: 'failed',
      error: error.message,
      completedAt: new Date().toISOString()
    });

    throw error;
  }
}
