import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { appDatabase } from "../services/app.database.service";
import { runBackgroundSync } from "../utils/sync.worker.server";

export async function action({ request, params, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { admin, session } = await authenticate.admin(request);
    const shopDomain = session.shop;

    console.log(`🚀 Sync requested for shop: ${shopDomain}`);

    // EDGE CASE: Check for existing running sync
    const existingJob = await appDatabase.getLatestSyncJob(shopDomain);
    if (existingJob && (existingJob.status === 'pending' || existingJob.status === 'running')) {
      console.log(`⚠️ Sync already in progress: ${existingJob.id}`);
      return json({
        success: true,
        jobId: existingJob.id,
        totalProducts: existingJob.totalProducts,
        message: "Sync already in progress",
        alreadyRunning: true
      });
    }

    // Get total product count quickly
    const countResponse = await admin.graphql(`
      query {
        productsCount {
          count
        }
      }
    `);
    const countData = await countResponse.json();

    // EDGE CASE: Handle GraphQL errors
    if (countData.errors) {
      throw new Error(`Shopify API error: ${JSON.stringify(countData.errors)}`);
    }

    const totalProducts = countData.data?.productsCount?.count || 0;

    // EDGE CASE: No products to sync
    if (totalProducts === 0) {
      return json({
        success: true,
        jobId: null,
        totalProducts: 0,
        message: "No products to sync"
      });
    }

    // Create sync job in Firebase
    const jobId = await appDatabase.createSyncJob(shopDomain, totalProducts);

    console.log(`✅ Sync job created: ${jobId}`);

    // Start background sync (fire and forget - continues even if client disconnects)
    runBackgroundSync({ admin, shopDomain, jobId }).catch((error) => {
      console.error(`❌ Background sync error for job ${jobId}:`, error);
      // Error is already logged in job status, no need to throw
    });

    // Return immediately with jobId
    return json({
      success: true,
      jobId,
      totalProducts,
      message: "Sync started in background"
    });

  } catch (error: any) {
    console.error("❌ Error starting sync:", error);
    return json({
      success: false,
      error: error?.message || "Failed to start sync"
    }, { status: 500 });
  }
}