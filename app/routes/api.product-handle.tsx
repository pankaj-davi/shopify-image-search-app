import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { 
  callVisualSearchAPI, 
  type VisualSearchAPIResponse,
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
  const totalStartTime = Date.now();
  console.log(`[TIMING] API call started at: ${totalStartTime}`);
  
  try {
    // Get shop domain from header (sent by frontend)
    const shopDomain = request.headers.get("shopDomainURL");
    console.log(`[TIMING] Headers parsed: ${Date.now() - totalStartTime}ms`);

    // Parse form data to get the uploaded image
    const formDataStartTime = Date.now();
    const formData = await request.formData();
    const formDataEndTime = Date.now();
    console.log(`[TIMING] FormData parsing took: ${formDataEndTime - formDataStartTime}ms`);

    
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
    let searchData: VisualSearchAPIResponse;
    const apiStartTime = Date.now();
    try {
      searchData = await callVisualSearchAPI(shopDomain!, imageFile);
      const apiEndTime = Date.now();
      const apiResponseTime = apiEndTime - apiStartTime;
      console.log(`Visual Search API response time: ${apiResponseTime}ms`);
    } catch (error) {
      const apiEndTime = Date.now();
      const apiResponseTime = apiEndTime - apiStartTime;
      console.log(`Visual Search API response time (failed): ${apiResponseTime}ms`);
      return json<any>({
        result: false,
        products: [],
        error: error instanceof Error ? error.message : "Visual search API failed"
      }, { 
        status: 500,
        headers: getCorsHeaders()
      });
    }

    // Check if the API returned an error
    if ('error' in searchData) {
      return json<any>({
        result: false,
        products: [],
        error: searchData.error
      }, { 
        status: 500,
        headers: getCorsHeaders()
      });
    }

    if (!searchData.search_results || searchData.search_results.length === 0) {
      return json<any>({
        result: true,
        products: [],
        search_results: [],
        largest_bounding_box_id: searchData.largest_bounding_box_id || null,
        all_bounding_box: searchData.all_bounding_box || [],
        labels: searchData.labels || []
      }, {
        headers: getCorsHeaders()
      });
    }

    try {
     
      const allSearchResults = searchData.search_results;
      // console.log(allSearchResults, "allSearchResults from search_results")
      
      const fetchStartTime = Date.now();
      const productDetails = await fetchProductDetailsWithAuth(shopDomain!, allSearchResults);
      const fetchEndTime = Date.now();
      const fetchResponseTime = fetchEndTime - fetchStartTime;
      console.log(`Product fetch response time: ${fetchResponseTime}ms`);  
      return json<any>({
        result: true,
        products: productDetails,
        search_results: searchData.search_results,
        largest_bounding_box_id: searchData.largest_bounding_box_id,
        all_bounding_box: searchData.all_bounding_box,
        labels: searchData.labels
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
