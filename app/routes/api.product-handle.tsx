import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { 
  callVisualSearchAPI, 
  type VisualSearchResponse,
} from "../utils/visual-search.server";
import { fetchProductDetailsWithAuth} from "../utils/product-details.server";


// CORS headers helper
function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, shopDomainURL",
  };
}

// Handle preflight OPTIONS request
export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: getCorsHeaders(),
    });
  }
  
  // For non-OPTIONS requests, return method not allowed
  return json({ error: "Method not allowed" }, { 
    status: 405,
    headers: getCorsHeaders(),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Get shop domain from header (sent by frontend)
    const shopDomain = request.headers.get("shopDomainURL");
    

    // Parse form data to get the uploaded image
    const formData = await request.formData();
    console.log("FormData entries:");
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes, ${value.type})` : value);
    }
    
    const imageFile = formData.get("file") as File;

    if (!imageFile) {
      return json<any>({
        result: false,
        products: [],
        error: "No image file provided"
      }, { 
        status: 400,
        headers: getCorsHeaders()
      });
    }

    // Call external visual search API
    let searchData: VisualSearchResponse;
    try {
      searchData = await callVisualSearchAPI(shopDomain!, imageFile);
    } catch (error) {
      return json<any>({
        result: false,
        products: [],
        error: error instanceof Error ? error.message : "Visual search API failed"
      }, { 
        status: 500,
        headers: getCorsHeaders()
      });
    }

    if (!searchData.results || searchData.results.length === 0) {
      return json<any>({
        result: true,
        products: []
      }, {
        headers: getCorsHeaders()
      });
    }

    try {
      const productDetails = await fetchProductDetailsWithAuth(shopDomain!, searchData.results.map(({shopifyProductId}) =>shopifyProductId ));  
      return json<any>({
        result: true,
        products: productDetails
      }, {
        headers: getCorsHeaders()
      });
    } catch (error) {
      console.error("fetchProductDetails error:", error);
      
      // If authentication fails, return error message
      if (error instanceof Error && error.message.includes("No session found")) {
        return json<any>({
          result: false,
          products: [],
          error: "Shop not authenticated. Please install the app first.",
          code: "SHOP_NOT_AUTHENTICATED"
        }, { 
          status: 401,
          headers: getCorsHeaders()
        });
      }
      
      if (error instanceof Error && error.message.includes("Session expired")) {
        return json<any>({
          result: false,
          products: [],
          error: "Shop session expired. Please reinstall the app.",
          code: "SESSION_EXPIRED"
        }, { 
          status: 401,
          headers: getCorsHeaders()
        });
      }
      
      // For other errors, return generic error
      return json<any>({
        result: false,
        products: [],
        error: error instanceof Error ? error.message : "Failed to fetch product details"
      }, { 
        status: 500,
        headers: getCorsHeaders()
      });
    }

  } catch (error) {
    console.error("API Error:", error);
    return json<any>({
      result: false,
      products: [],
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }, { 
      status: 500,
      headers: getCorsHeaders()
    });
  }
}
