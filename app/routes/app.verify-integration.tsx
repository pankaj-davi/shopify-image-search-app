import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Get the actual app URL from the request or environment
  const url = new URL(request.url);
  const appUrl = process.env.SHOPIFY_APP_URL || `${url.protocol}//${url.host}`;

  try {
    // Check script tags
    const scriptsResponse = await admin.graphql(`
      query {
        scriptTags(first: 50) {
          edges {
            node {
              id
              src
              displayScope
              createdAt
              updatedAt
            }
          }
        }
      }
    `);

    const scriptsData = await scriptsResponse.json();
    const allScripts = scriptsData.data.scriptTags.edges.map((edge: any) => edge.node);
    const visualSearchScripts = allScripts.filter((script: any) => 
      script.src.includes('visual-search-script.js') || 
      script.src.includes('visual-search')
    );

    // Check app installation details
    const appResponse = await admin.graphql(`
      query {
        currentAppInstallation {
          id
          app {
            title
            handle
          }
          accessScopes {
            handle
          }
        }
      }
    `);

    const appData = await appResponse.json();

    // Get shop details
    const shopResponse = await admin.graphql(`
      query {
        shop {
          id
          name
          myshopifyDomain
          email
          plan {
            displayName
            partnerDevelopment
            shopifyPlus
          }
          features {
            storefront
            eligibleForSubscriptions
          }
          primaryDomain {
            url
            sslEnabled
          }
        }
      }
    `);

    const shopData = await shopResponse.json();

    return json({
      shop: shopDomain,
      shopDetails: shopData.data.shop,
      appInstallation: appData.data.currentAppInstallation,
      allScripts,
      visualSearchScripts,
      scriptCount: allScripts.length,
      visualSearchActive: visualSearchScripts.length > 0,
      appUrl: appUrl,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Verification error:", error);
    return json({
      shop: shopDomain,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
  }
}

export default function VerifyIntegration() {
  const data = useLoaderData<typeof loader>();

  if ('error' in data) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif", padding: "20px", maxWidth: "1000px" }}>
        <h1 style={{ color: "#dc3545" }}>❌ Verification Failed</h1>
        <div style={{ 
          backgroundColor: "#f8d7da", 
          color: "#721c24", 
          padding: "15px", 
          borderRadius: "6px",
          border: "1px solid #f5c6cb"
        }}>
          <strong>Error:</strong> {data.error}
        </div>
      </div>
    );
  }

  const getStatusColor = (isGood: boolean) => isGood ? "#28a745" : "#dc3545";
  const getStatusIcon = (isGood: boolean) => isGood ? "✅" : "❌";

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "20px", maxWidth: "1000px" }}>
      {/* Shop Information */}
      <div style={{ 
        backgroundColor: "#f8f9fa", 
        padding: "20px", 
        borderRadius: "8px", 
        marginBottom: "20px",
        border: "1px solid #e9ecef"
      }}>
        <h2 style={{ color: "#495057", marginTop: "0" }}>Shop Information</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr><td style={{ padding: "5px 0", fontWeight: "bold" }}>Shop Domain:</td><td>{data.shop}</td></tr>
            <tr><td style={{ padding: "5px 0", fontWeight: "bold" }}>Shop Name:</td><td>{data.shopDetails?.name}</td></tr>
            <tr><td style={{ padding: "5px 0", fontWeight: "bold" }}>Plan:</td><td>{data.shopDetails?.plan?.displayName}</td></tr>
            <tr><td style={{ padding: "5px 0", fontWeight: "bold" }}>Primary Domain:</td><td>{data.shopDetails?.primaryDomain?.url}</td></tr>
            <tr><td style={{ padding: "5px 0", fontWeight: "bold" }}>SSL Enabled:</td><td>{data.shopDetails?.primaryDomain?.sslEnabled ? "✅ Yes" : "❌ No"}</td></tr>
          </tbody>
        </table>
      </div>

      {/* App Installation Status */}
      <div style={{ 
        backgroundColor: "#e7f3ff", 
        padding: "20px", 
        borderRadius: "8px", 
        marginBottom: "20px",
        border: "1px solid #b8daff"
      }}>
        <h2 style={{ color: "#004085", marginTop: "0" }}>App Installation Status</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr><td style={{ padding: "5px 0", fontWeight: "bold" }}>App ID:</td><td>{data.appInstallation?.id}</td></tr>
            <tr><td style={{ padding: "5px 0", fontWeight: "bold" }}>App Title:</td><td>{data.appInstallation?.app?.title}</td></tr>
            <tr><td style={{ padding: "5px 0", fontWeight: "bold" }}>App Handle:</td><td>{data.appInstallation?.app?.handle}</td></tr>
            <tr><td style={{ padding: "5px 0", fontWeight: "bold" }}>Access Scopes:</td><td>{data.appInstallation?.accessScopes?.map((scope: any) => scope.handle).join(", ")}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Visual Search Status */}
      <div style={{ 
        backgroundColor: data.visualSearchActive ? "#d4edda" : "#f8d7da",
        color: data.visualSearchActive ? "#155724" : "#721c24",
        padding: "20px", 
        borderRadius: "8px", 
        marginBottom: "20px",
        border: `1px solid ${data.visualSearchActive ? "#c3e6cb" : "#f5c6cb"}`
      }}>
        <h2 style={{ marginTop: "0" }}>
          {getStatusIcon(data.visualSearchActive)} Visual Search Status
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ padding: "5px 0", fontWeight: "bold" }}>Status:</td>
              <td style={{ color: getStatusColor(data.visualSearchActive), fontWeight: "bold" }}>
                {data.visualSearchActive ? "ACTIVE" : "NOT ACTIVE"}
              </td>
            </tr>
            <tr><td style={{ padding: "5px 0", fontWeight: "bold" }}>Scripts Found:</td><td>{data.visualSearchScripts.length}</td></tr>
            <tr><td style={{ padding: "5px 0", fontWeight: "bold" }}>Total Scripts:</td><td>{data.scriptCount}</td></tr>
            <tr><td style={{ padding: "5px 0", fontWeight: "bold" }}>App URL:</td><td>{data.appUrl}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Script Details */}
      {data.visualSearchScripts.length > 0 && (
        <div style={{ 
          backgroundColor: "#f8f9fa", 
          padding: "20px", 
          borderRadius: "8px", 
          marginBottom: "20px",
          border: "1px solid #e9ecef"
        }}>
          <h2 style={{ color: "#495057", marginTop: "0" }}>Visual Search Script Details</h2>
          {data.visualSearchScripts.map((script: any, index: number) => (
            <div key={script.id} style={{ 
              backgroundColor: "white", 
              padding: "15px", 
              borderRadius: "6px", 
              marginBottom: "10px",
              border: "1px solid #dee2e6"
            }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>Script #{index + 1}</h4>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <tbody>
                  <tr><td style={{ padding: "3px 0", fontWeight: "bold", width: "120px" }}>ID:</td><td>{script.id}</td></tr>
                  <tr><td style={{ padding: "3px 0", fontWeight: "bold" }}>Source URL:</td><td style={{ wordBreak: "break-all" }}>{script.src}</td></tr>
                  <tr><td style={{ padding: "3px 0", fontWeight: "bold" }}>Display Scope:</td><td>{script.displayScope}</td></tr>
                  <tr><td style={{ padding: "3px 0", fontWeight: "bold" }}>Created:</td><td>{new Date(script.createdAt).toLocaleString()}</td></tr>
                  <tr><td style={{ padding: "3px 0", fontWeight: "bold" }}>Updated:</td><td>{new Date(script.updatedAt).toLocaleString()}</td></tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Testing Instructions */}
      <div style={{ 
        backgroundColor: "#fff3cd", 
        padding: "20px", 
        borderRadius: "8px", 
        marginBottom: "20px",
        border: "1px solid #ffeaa7"
      }}>
        <h2 style={{ color: "#856404", marginTop: "0" }}>🧪 How to Test Visual Search</h2>
        <ol style={{ color: "#856404", paddingLeft: "20px" }}>
          <li style={{ marginBottom: "10px" }}>
            <strong>Visit your storefront:</strong> Go to{" "}
            <a href={data.shopDetails?.primaryDomain?.url} target="_blank" rel="noopener noreferrer" style={{ color: "#0066cc" }}>
              {data.shopDetails?.primaryDomain?.url}
            </a>
          </li>
          <li style={{ marginBottom: "10px" }}>
            <strong>Look for search bars:</strong> Check the header, navigation, or any search functionality
          </li>
          <li style={{ marginBottom: "10px" }}>
            <strong>Find the camera icon:</strong> You should see a small camera/image icon inside or next to search inputs
          </li>
          <li style={{ marginBottom: "10px" }}>
            <strong>Test the functionality:</strong> Click the camera icon and try uploading an image
          </li>
          <li style={{ marginBottom: "10px" }}>
            <strong>Check console:</strong> Open browser dev tools (F12) and check for any JavaScript errors
          </li>
        </ol>
      </div>

      {/* Troubleshooting */}
      <div style={{ 
        backgroundColor: "#f8d7da", 
        padding: "20px", 
        borderRadius: "8px", 
        marginBottom: "20px",
        border: "1px solid #f5c6cb"
      }}>
        <h2 style={{ color: "#721c24", marginTop: "0" }}>🔧 Troubleshooting</h2>
        <div style={{ color: "#721c24" }}>
          <h4>If visual search is not working:</h4>
          <ul style={{ paddingLeft: "20px" }}>
            <li>Check if the script is properly injected (see script details above)</li>
            <li>Verify the script URL is accessible: <a href={`${data.appUrl}/visual-search-script.js`} target="_blank" rel="noopener noreferrer" style={{ color: "#0066cc" }}>{data.appUrl}/visual-search-script.js</a></li>
            <li>Ensure your theme has search functionality</li>
            <li>Check browser console for JavaScript errors</li>
            <li>Test on different devices and browsers</li>
            <li>Verify SSL certificate is working properly</li>
          </ul>
          
          <h4>Common issues:</h4>
          <ul style={{ paddingLeft: "20px" }}>
            <li><strong>No camera icon:</strong> Theme might use custom search selectors</li>
            <li><strong>Script not loading:</strong> Check CORS settings and SSL</li>
            <li><strong>Upload fails:</strong> Verify API endpoint is working</li>
            <li><strong>Search not triggering:</strong> Form submission might need adjustment</li>
          </ul>
        </div>
      </div>

      {/* All Scripts (for debugging) */}
      {data.allScripts.length > 0 && (
        <details style={{ marginBottom: "20px" }}>
          <summary style={{ 
            cursor: "pointer", 
            padding: "10px", 
            backgroundColor: "#f8f9fa", 
            border: "1px solid #e9ecef",
            borderRadius: "6px",
            fontWeight: "bold"
          }}>
            🔍 View All Script Tags ({data.allScripts.length} total)
          </summary>
          <div style={{ 
            backgroundColor: "#f8f9fa", 
            padding: "15px", 
            borderRadius: "0 0 6px 6px",
            border: "1px solid #e9ecef",
            borderTop: "none",
            maxHeight: "400px",
            overflowY: "auto"
          }}>
            {data.allScripts.map((script: any, index: number) => (
              <div key={script.id} style={{ 
                backgroundColor: "white", 
                padding: "10px", 
                borderRadius: "4px", 
                marginBottom: "8px",
                border: "1px solid #dee2e6",
                fontSize: "12px"
              }}>
                <strong>#{index + 1}:</strong> {script.src}
                <br />
                <span style={{ color: "#666" }}>ID: {script.id} | Scope: {script.displayScope}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      <div style={{ 
        fontSize: "12px", 
        color: "#666", 
        textAlign: "center", 
        marginTop: "20px",
        padding: "10px",
        borderTop: "1px solid #e9ecef"
      }}>
        Verification completed at: {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
