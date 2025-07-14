import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  // Get the actual app URL from the request or environment
  const url = new URL(request.url);
  const appUrl = process.env.SHOPIFY_APP_URL || `${url.protocol}//${url.host}`;
  
  return {
    appUrl,
    bookmarkletCode: `javascript:(function(){
      var script = document.createElement('script');
      script.src = '${appUrl}/visual-search-script.js?shop=' + (window.Shopify ? window.Shopify.shop : 'test-shop.myshopify.com');
      script.onload = function() {
        alert('Visual search script loaded! Look for camera icons in search bars.');
        if (window.injectVisualSearchIcon) {
          window.injectVisualSearchIcon();
        }
      };
      script.onerror = function() {
        alert('Failed to load visual search script. Check console for errors.');
      };
      document.head.appendChild(script);
    })();`
  };
}

export default function TestingTools() {
  const { appUrl, bookmarkletCode } = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "20px", maxWidth: "1000px" }}>
      <h1 style={{ color: "#333", marginBottom: "20px" }}>🛠️ Visual Search Testing Tools</h1>
      
      {/* Quick Tests */}
      <div style={{ 
        backgroundColor: "#f8f9fa", 
        padding: "20px", 
        borderRadius: "8px", 
        marginBottom: "20px",
        border: "1px solid #e9ecef"
      }}>
        <h2 style={{ color: "#495057", marginTop: "0" }}>Quick Tests</h2>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <a 
            href="/api/test-integration?type=script" 
            target="_blank"
            style={{
              backgroundColor: "#007bff",
              color: "white",
              padding: "10px 15px",
              textDecoration: "none",
              borderRadius: "6px",
              fontSize: "14px"
            }}
          >
            📄 Test Script Access
          </a>
          <a 
            href="/api/test-integration?type=api" 
            target="_blank"
            style={{
              backgroundColor: "#28a745",
              color: "white",
              padding: "10px 15px",
              textDecoration: "none",
              borderRadius: "6px",
              fontSize: "14px"
            }}
          >
            🔌 Test API Endpoint
          </a>
          <a 
            href="/api/test-integration?type=config" 
            target="_blank"
            style={{
              backgroundColor: "#6f42c1",
              color: "white",
              padding: "10px 15px",
              textDecoration: "none",
              borderRadius: "6px",
              fontSize: "14px"
            }}
          >
            ⚙️ Check Configuration
          </a>
        </div>
      </div>

      {/* Bookmarklet */}
      <div style={{ 
        backgroundColor: "#fff3cd", 
        padding: "20px", 
        borderRadius: "8px", 
        marginBottom: "20px",
        border: "1px solid #ffeaa7"
      }}>
        <h2 style={{ color: "#856404", marginTop: "0" }}>📌 Test Bookmarklet</h2>
        <p style={{ color: "#856404", marginBottom: "15px" }}>
          Drag this button to your bookmarks bar, then click it on ANY Shopify store to test visual search:
        </p>
        <div style={{ 
          backgroundColor: "white", 
          padding: "15px", 
          borderRadius: "6px",
          border: "1px solid #ffeaa7",
          textAlign: "center"
        }}>
          <a 
            href={bookmarkletCode}
            style={{
              backgroundColor: "#ffc107",
              color: "#212529",
              padding: "12px 20px",
              textDecoration: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              fontSize: "16px",
              display: "inline-block"
            }}
          >
            🔍 Test Visual Search
          </a>
        </div>
        <p style={{ color: "#856404", fontSize: "14px", marginTop: "10px" }}>
          <strong>How to use:</strong>
          <br />1. Drag the yellow button above to your browser's bookmarks bar
          <br />2. Visit any Shopify store (or your test store)
          <br />3. Click the bookmark to inject visual search
          <br />4. Look for camera icons in search bars
        </p>
      </div>

      {/* Manual Testing Steps */}
      <div style={{ 
        backgroundColor: "#e7f3ff", 
        padding: "20px", 
        borderRadius: "8px", 
        marginBottom: "20px",
        border: "1px solid #b8daff"
      }}>
        <h2 style={{ color: "#004085", marginTop: "0" }}>✅ Manual Testing Checklist</h2>
        <div style={{ color: "#004085" }}>
          <h4>1. Pre-Installation Testing:</h4>
          <ul style={{ paddingLeft: "20px" }}>
            <li>✅ App builds without errors</li>
            <li>✅ All environment variables are set</li>
            <li>✅ Script endpoint is accessible: <code>{appUrl}/visual-search-script.js</code></li>
            <li>✅ API endpoint responds: <code>{appUrl}/api/visual-search</code></li>
          </ul>

          <h4>2. Installation Testing:</h4>
          <ul style={{ paddingLeft: "20px" }}>
            <li>✅ App installs successfully on test store</li>
            <li>✅ Script tag appears in Shopify admin (Online Store → Themes → Actions → Edit code → Templates)</li>
            <li>✅ No errors in app logs during installation</li>
            <li>✅ Webhook endpoints are configured</li>
          </ul>

          <h4>3. Frontend Testing:</h4>
          <ul style={{ paddingLeft: "20px" }}>
            <li>✅ Camera icons appear in search bars</li>
            <li>✅ Icons are positioned correctly (not overlapping text)</li>
            <li>✅ Icons work on mobile devices</li>
            <li>✅ File picker opens when clicking camera icon</li>
            <li>✅ Image upload works (check browser network tab)</li>
            <li>✅ Search terms are generated and filled</li>
            <li>✅ Search is triggered automatically</li>
            <li>✅ Error handling works (try invalid files)</li>
          </ul>

          <h4>4. Cross-Theme Testing:</h4>
          <ul style={{ paddingLeft: "20px" }}>
            <li>✅ Test with Dawn theme</li>
            <li>✅ Test with Debut theme</li>
            <li>✅ Test with at least one custom theme</li>
            <li>✅ Test on stores with multiple search bars</li>
            <li>✅ Test on stores with AJAX/SPA navigation</li>
          </ul>

          <h4>5. Uninstallation Testing:</h4>
          <ul style={{ paddingLeft: "20px" }}>
            <li>✅ Script tags are removed when app is uninstalled</li>
            <li>✅ No orphaned scripts remain</li>
            <li>✅ Uninstall webhook fires correctly</li>
          </ul>
        </div>
      </div>

      {/* Browser Testing */}
      <div style={{ 
        backgroundColor: "#f8d7da", 
        padding: "20px", 
        borderRadius: "8px", 
        marginBottom: "20px",
        border: "1px solid #f5c6cb"
      }}>
        <h2 style={{ color: "#721c24", marginTop: "0" }}>🌐 Browser Compatibility Testing</h2>
        <div style={{ color: "#721c24" }}>
          <h4>Desktop Browsers:</h4>
          <ul style={{ paddingLeft: "20px" }}>
            <li>✅ Chrome (latest)</li>
            <li>✅ Firefox (latest)</li>
            <li>✅ Safari (latest)</li>
            <li>✅ Edge (latest)</li>
          </ul>

          <h4>Mobile Browsers:</h4>
          <ul style={{ paddingLeft: "20px" }}>
            <li>✅ Chrome Mobile</li>
            <li>✅ Safari iOS</li>
            <li>✅ Samsung Internet</li>
            <li>✅ Firefox Mobile</li>
          </ul>

          <h4>Test Cases:</h4>
          <ul style={{ paddingLeft: "20px" }}>
            <li>✅ File picker opens on mobile</li>
            <li>✅ Camera access works (mobile only)</li>
            <li>✅ Touch events work properly</li>
            <li>✅ Icons scale correctly on different screen sizes</li>
            <li>✅ No JavaScript errors in console</li>
          </ul>
        </div>
      </div>

      {/* Debugging Tools */}
      <div style={{ 
        backgroundColor: "#d1ecf1", 
        padding: "20px", 
        borderRadius: "8px", 
        marginBottom: "20px",
        border: "1px solid #bee5eb"
      }}>
        <h2 style={{ color: "#0c5460", marginTop: "0" }}>🐛 Debugging Tools</h2>
        <div style={{ color: "#0c5460" }}>
          <h4>Browser Console Commands:</h4>
          <div style={{ backgroundColor: "white", padding: "10px", borderRadius: "4px", marginBottom: "10px" }}>
            <code style={{ display: "block", marginBottom: "5px" }}>
              {`// Check if visual search is loaded`}<br />
              {`console.log(window.injectVisualSearchIcon ? 'Visual search loaded' : 'Visual search not found');`}
            </code>
          </div>
          
          <div style={{ backgroundColor: "white", padding: "10px", borderRadius: "4px", marginBottom: "10px" }}>
            <code style={{ display: "block", marginBottom: "5px" }}>
              {`// Manually trigger visual search injection`}<br />
              {`if (window.injectVisualSearchIcon) window.injectVisualSearchIcon();`}
            </code>
          </div>

          <div style={{ backgroundColor: "white", padding: "10px", borderRadius: "4px", marginBottom: "10px" }}>
            <code style={{ display: "block", marginBottom: "5px" }}>
              {`// Check for search inputs`}<br />
              {`document.querySelectorAll('input[type="search"], input[name*="search"]')`}
            </code>
          </div>

          <div style={{ backgroundColor: "white", padding: "10px", borderRadius: "4px", marginBottom: "15px" }}>
            <code style={{ display: "block", marginBottom: "5px" }}>
              {`// Check for visual search icons`}<br />
              {`document.querySelectorAll('.visual-search-icon')`}
            </code>
          </div>

          <h4>Network Tab Checks:</h4>
          <ul style={{ paddingLeft: "20px" }}>
            <li>Script loads successfully (200 status)</li>
            <li>API requests go to correct endpoint</li>
            <li>Image uploads have proper Content-Type</li>
            <li>No CORS errors</li>
          </ul>
        </div>
      </div>

      <div style={{ 
        fontSize: "12px", 
        color: "#666", 
        textAlign: "center", 
        marginTop: "20px",
        padding: "10px",
        borderTop: "1px solid #e9ecef"
      }}>
        Testing tools generated for: {appUrl}
      </div>
    </div>
  );
}
