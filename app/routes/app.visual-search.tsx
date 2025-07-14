import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { ScriptInjectionService } from "../services/script-injection.service";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Check if visual search script is currently injected
  try {
    const scriptsResponse = await admin.graphql(`
      query {
        scriptTags(first: 10) {
          edges {
            node {
              id
              src
              displayScope
              createdAt
            }
          }
        }
      }
    `);

    const scriptsData = await scriptsResponse.json();
    const visualSearchScript = scriptsData.data.scriptTags.edges.find(
      (edge: any) => edge.node.src.includes('visual-search-script.js') || 
                    edge.node.src.includes('visual-search-unified.js')
    );

    return json({
      shop: shopDomain,
      isScriptInjected: !!visualSearchScript,
      scriptData: visualSearchScript?.node || null
    });
  } catch (error) {
    console.error("Error checking script status:", error);
    
    // Check if it's a permissions error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isPermissionError = errorMessage.includes("Access denied") || 
                             errorMessage.includes("scriptTags");
    
    return json({
      shop: shopDomain,
      isScriptInjected: false,
      scriptData: null,
      error: isPermissionError 
        ? "Permission denied: App needs 'write_script_tags' scope. Please reinstall the app after updating permissions."
        : "Failed to check script status"
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const formData = await request.formData();
  const action = formData.get("action");

  try {
    if (action === "inject") {
      const result = await ScriptInjectionService.injectVisualSearchScript(admin, shopDomain);
      return json(result);
    } else if (action === "remove") {
      const result = await ScriptInjectionService.removeVisualSearchScript(admin, shopDomain);
      return json(result);
    } else if (action === "cleanup") {
      // Remove all old scripts and inject a fresh one
      const result = await ScriptInjectionService.injectVisualSearchScript(admin, shopDomain);
      return json({
        ...result,
        message: result.success 
          ? "All old scripts removed and fresh script injected successfully!" 
          : result.message
      });
    } else {
      return json({ success: false, error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error executing action:", error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

export default function VisualSearchSettings() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  // Handle error display safely
  const errorMessage = ('error' in data) && data.error && typeof data.error === 'string' ? data.error : null;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4", padding: "20px", maxWidth: "800px" }}>
      <h1 style={{ color: "#333", margin: "0 0 20px 0" }}>Visual Search Settings</h1>
      
      {errorMessage && (
          <div style={{ 
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: "15px",
            borderRadius: "6px",
            marginBottom: "20px",
            border: "1px solid #f5c6cb"
          }}>
            <strong>❌ Error:</strong> {errorMessage}
          </div>
        )}
      
      <div style={{ 
        backgroundColor: "#f8f9fa", 
        padding: "20px", 
        borderRadius: "8px", 
        marginBottom: "20px",
        border: "1px solid #e9ecef"
      }}>
        <h2 style={{ color: "#495057", marginTop: "0" }}>Current Status</h2>
        <p><strong>Shop:</strong> {data.shop}</p>
        <p>
          <strong>Visual Search Script:</strong>{" "}
          <span style={{ 
            color: data.isScriptInjected ? "#28a745" : "#dc3545",
            fontWeight: "bold"
          }}>
            {data.isScriptInjected ? "✅ Active" : "❌ Not Active"}
          </span>
        </p>
        
        {data.scriptData && (
          <div style={{ marginTop: "10px", fontSize: "14px", color: "#6c757d" }}>
            <p><strong>Script ID:</strong> {data.scriptData.id}</p>
            <p><strong>Created:</strong> {new Date(data.scriptData.createdAt).toLocaleString()}</p>
            <p><strong>Source:</strong> {data.scriptData.src}</p>
          </div>
        )}
      </div>

      {actionData && (
        <div style={{ 
          backgroundColor: actionData.success ? "#d4edda" : "#f8d7da",
          color: actionData.success ? "#155724" : "#721c24",
          padding: "15px",
          borderRadius: "6px",
          marginBottom: "20px",
          border: `1px solid ${actionData.success ? "#c3e6cb" : "#f5c6cb"}`
        }}>
          {actionData.success ? "✅" : "❌"} {
            ('message' in actionData) ? actionData.message : 
            ('error' in actionData) ? actionData.error : 
            'Operation completed'
          }
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", marginBottom: "30px", flexWrap: "wrap" }}>
        <Form method="post">
          <input type="hidden" name="action" value="inject" />
          <button
            type="submit"
            disabled={data.isScriptInjected}
            style={{
              backgroundColor: data.isScriptInjected ? "#6c757d" : "#007bff",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              cursor: data.isScriptInjected ? "not-allowed" : "pointer",
              fontWeight: "500"
            }}
          >
            {data.isScriptInjected ? "Already Active" : "Activate Visual Search"}
          </button>
        </Form>

        <Form method="post">
          <input type="hidden" name="action" value="remove" />
          <button
            type="submit"
            disabled={!data.isScriptInjected}
            style={{
              backgroundColor: !data.isScriptInjected ? "#6c757d" : "#dc3545",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              cursor: !data.isScriptInjected ? "not-allowed" : "pointer",
              fontWeight: "500"
            }}
          >
            {!data.isScriptInjected ? "Not Active" : "Deactivate Visual Search"}
          </button>
        </Form>

        <Form method="post">
          <input type="hidden" name="action" value="cleanup" />
          <button
            type="submit"
            style={{
              backgroundColor: "#ffc107",
              color: "#212529",
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
            🔧 Fix Script Issues
          </button>
        </Form>

        <a
          href="/app/preview"
          style={{
            backgroundColor: "#17a2b8",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "500",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px"
          }}
        >
          🎨 Preview & Customize
        </a>
      </div>

      <div style={{ 
        backgroundColor: "#e7f3ff", 
        padding: "20px", 
        borderRadius: "8px", 
        border: "1px solid #b8daff"
      }}>
        <h3 style={{ color: "#004085", marginTop: "0" }}>How Visual Search Works</h3>
        <ul style={{ color: "#004085", paddingLeft: "20px" }}>
          <li>Automatically adds a camera icon to all search bars in your store</li>
          <li>Works with any theme - no manual configuration required</li>
          <li>Customers can click the icon to upload an image</li>
          <li>AI analyzes the image and generates search terms</li>
          <li>Automatically searches your store for matching products</li>
          <li>Completely invisible to customers when not in use</li>
        </ul>
        
        <h4 style={{ color: "#004085", marginTop: "20px" }}>Supported Themes:</h4>
        <p style={{ color: "#004085", margin: "5px 0" }}>
          ✅ All Shopify themes (Dawn, Debut, Brooklyn, Venture, etc.)<br/>
          ✅ Custom themes<br/>
          ✅ Third-party themes<br/>
          ✅ Mobile and desktop
        </p>
      </div>
    </div>
  );
}
