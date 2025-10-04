import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { appDatabase } from "../services/app.database.service";

export async function loader({ params }: LoaderFunctionArgs) {
  const { jobId } = params;

  if (!jobId) {
    return json({ error: "Job ID is required" }, { status: 400 });
  }

  try {
    const job = await appDatabase.getSyncJob(jobId);

    if (!job) {
      return json({ error: "Job not found" }, { status: 404 });
    }

    return json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        syncedCount: job.syncedCount,
        totalProducts: job.totalProducts,
        error: job.error,
        createdAt: job.createdAt,
        completedAt: job.completedAt
      }
    });
  } catch (error: any) {
    console.error("❌ Error fetching sync status:", error);
    return json({
      success: false,
      error: error?.message || "Failed to fetch sync status"
    }, { status: 500 });
  }
}
