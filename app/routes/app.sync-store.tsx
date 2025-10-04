import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { appDatabase } from "../services/app.database.service";

export async function action({ request, params, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { admin, session } = await authenticate.admin(request);
    const shopDomain = session.shop;

    console.log(`🚀 Sync requested for shop: ${shopDomain}`);

    // EDGE CASE: Check for existing running or failed sync
    const existingJob = await appDatabase.getLatestSyncJob(shopDomain);

    // If sync is running, return existing job
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

    // If failed, we'll resume this job (use same jobId)
    const shouldResumeJob = existingJob && existingJob.status === 'failed' && existingJob.cursor;
    if (shouldResumeJob) {
      console.log(`🔄 Resuming failed sync from ${existingJob.syncedCount}/${existingJob.totalProducts}`);
    }

    // Create job (Python will get product count)
    const jobId = shouldResumeJob ? existingJob.id : await appDatabase.createSyncJob(shopDomain, 0);

    console.log(shouldResumeJob
      ? `✅ Resuming job: ${jobId}`
      : `✅ Sync job created: ${jobId}`);

    // Invoke Python Server for background sync (no timeout limits)
    console.log(`🐍 Invoking Python Server for background sync`);

    const pythonServerUrl = process.env.PYTHON_SERVER_URL;
    const syncEndpoint = `${pythonServerUrl}/api/sync-products`;

    // Fire-and-forget HTTP call to Python server
    // Python will get product count from Shopify
    fetch(syncEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shopDomain,
        jobId,
        accessToken: session.accessToken,
        shopifyApiVersion: '2024-10'
      })
    }).catch((error: any) => {
      console.error(`❌ Python server error for job ${jobId}:`, error);
      // Error will be logged in Python server and job status updated
    });

    console.log(`✅ Python Server invoked successfully`);

    // Return immediately with jobId (totalProducts will be set by Python)
    return json({
      success: true,
      jobId,
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