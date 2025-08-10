import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { appBlockTracker } from "../services/app-block-tracking.service";

interface BlockStats {
  totalUsage: number;
  byAction: Record<string, number>;
  dailyUsage: Array<any>;
  lastUsed: string | null;
}

interface SearchStats {
  totalSearches: number;
  successfulSearches: number;
  bySearchType: Record<string, number>;
  averageResults: number;
  dailySearches: Array<any>;
}

interface LoaderData {
  shop: string;
  days: number;
  blockStats: BlockStats;
  searchStats: SearchStats;
  timestamp: string;
}

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  
  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get("days") || "30");

  try {
    const [blockStats, searchStats] = await Promise.all([
      appBlockTracker.getAppBlockStats(shop, days),
      appBlockTracker.getVisualSearchStats(shop, days)
    ]);

    return json<LoaderData>({
      shop,
      days,
      blockStats: blockStats as BlockStats,
      searchStats: searchStats as SearchStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to load app block stats:", error);
    throw new Response("Failed to load stats", { status: 500 });
  }
}

export default function AppBlockStats() {
  const { shop, days, blockStats, searchStats } = useLoaderData<LoaderData>();

  return (
    <div style={{ padding: "20px", fontFamily: "system-ui" }}>
      <h1>📊 App Block Analytics for {shop}</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        Last {days} days | Updated: {new Date().toLocaleString()}
      </p>

      {/* App Block Usage Stats */}
      <div style={{ 
        background: "#f8f9fa", 
        padding: "20px", 
        borderRadius: "8px", 
        marginBottom: "20px" 
      }}>
        <h2 style={{ marginTop: 0 }}>🧩 App Block Usage</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
          <div style={{ background: "white", padding: "15px", borderRadius: "6px", border: "1px solid #e9ecef" }}>
            <h3 style={{ margin: 0, fontSize: "14px", color: "#666" }}>Total Events</h3>
            <p style={{ margin: "5px 0 0", fontSize: "24px", fontWeight: "bold", color: "#007bff" }}>
              {blockStats.totalUsage}
            </p>
          </div>
          <div style={{ background: "white", padding: "15px", borderRadius: "6px", border: "1px solid #e9ecef" }}>
            <h3 style={{ margin: 0, fontSize: "14px", color: "#666" }}>Last Used</h3>
            <p style={{ margin: "5px 0 0", fontSize: "14px", color: "#333" }}>
              {blockStats.lastUsed ? new Date(blockStats.lastUsed).toLocaleString() : "Never"}
            </p>
          </div>
        </div>

        <h3 style={{ marginTop: "20px", marginBottom: "10px" }}>Events by Action</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
          {Object.entries(blockStats.byAction || {}).map(([action, count]) => (
            <div key={action} style={{ 
              background: "white", 
              padding: "10px", 
              borderRadius: "6px", 
              border: "1px solid #e9ecef",
              textAlign: "center" 
            }}>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#28a745" }}>{count as number}</div>
              <div style={{ fontSize: "12px", color: "#666", textTransform: "capitalize" }}>
                {action.replace(/_/g, " ")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Search Stats */}
      <div style={{ 
        background: "#f8f9fa", 
        padding: "20px", 
        borderRadius: "8px", 
        marginBottom: "20px" 
      }}>
        <h2 style={{ marginTop: 0 }}>🔍 Visual Search Usage</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
          <div style={{ background: "white", padding: "15px", borderRadius: "6px", border: "1px solid #e9ecef" }}>
            <h3 style={{ margin: 0, fontSize: "14px", color: "#666" }}>Total Searches</h3>
            <p style={{ margin: "5px 0 0", fontSize: "24px", fontWeight: "bold", color: "#e60023" }}>
              {searchStats.totalSearches}
            </p>
          </div>
          <div style={{ background: "white", padding: "15px", borderRadius: "6px", border: "1px solid #e9ecef" }}>
            <h3 style={{ margin: 0, fontSize: "14px", color: "#666" }}>Successful Searches</h3>
            <p style={{ margin: "5px 0 0", fontSize: "24px", fontWeight: "bold", color: "#28a745" }}>
              {searchStats.successfulSearches}
            </p>
          </div>
          <div style={{ background: "white", padding: "15px", borderRadius: "6px", border: "1px solid #e9ecef" }}>
            <h3 style={{ margin: 0, fontSize: "14px", color: "#666" }}>Success Rate</h3>
            <p style={{ margin: "5px 0 0", fontSize: "24px", fontWeight: "bold", color: "#fd7e14" }}>
              {searchStats.totalSearches > 0 
                ? Math.round((searchStats.successfulSearches / searchStats.totalSearches) * 100)
                : 0}%
            </p>
          </div>
          <div style={{ background: "white", padding: "15px", borderRadius: "6px", border: "1px solid #e9ecef" }}>
            <h3 style={{ margin: 0, fontSize: "14px", color: "#666" }}>Avg Results</h3>
            <p style={{ margin: "5px 0 0", fontSize: "24px", fontWeight: "bold", color: "#6f42c1" }}>
              {Math.round(searchStats.averageResults * 10) / 10}
            </p>
          </div>
        </div>

        <h3 style={{ marginTop: "20px", marginBottom: "10px" }}>Search Types</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
          {Object.entries(searchStats.bySearchType || {}).map(([type, count]) => (
            <div key={type} style={{ 
              background: "white", 
              padding: "10px", 
              borderRadius: "6px", 
              border: "1px solid #e9ecef",
              textAlign: "center" 
            }}>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#17a2b8" }}>{count as number}</div>
              <div style={{ fontSize: "12px", color: "#666", textTransform: "capitalize" }}>
                {type.replace(/_/g, " ")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
