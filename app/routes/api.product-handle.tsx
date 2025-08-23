import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { 
  callVisualSearchAPI, 
  extractUniqueProductGids,
  type VisualSearchResponse 
} from "../utils/visual-search.server";
import { 
  fetchProductDetails, 
  type ProductDetails 
} from "../utils/product-details.server";

interface ProductResponse {
  result: boolean;
  products: ProductDetails[];
  error?: string;
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Authenticate with Shopify
    const { admin, session } = await authenticate.admin(request);
    const shopDomain = session.shop;

    // Parse form data to get the uploaded image
    const formData = await request.formData();
    const imageFile = formData.get("file") as File;

    if (!imageFile) {
      return json<ProductResponse>({
        result: false,
        products: [],
        error: "No image file provided"
      }, { status: 400 });
    }

    // Call external visual search API
    let searchData: VisualSearchResponse;
    try {
      searchData = await callVisualSearchAPI(shopDomain, imageFile);
      console.log("RRRRRRRRRRRRRR:", searchData, imageFile);
    } catch (error) {
      return json<ProductResponse>({
        result: false,
        products: [],
        error: error instanceof Error ? error.message : "Visual search API failed"
      }, { status: 500 });
    }

    if (!searchData.results || searchData.results.length === 0) {
      return json<ProductResponse>({
        result: true,
        products: []
      });
    }

    // Extract unique product IDs from search results
    const productIds = extractUniqueProductGids(searchData.results);

    if (productIds.length === 0) {
      return json<ProductResponse>({
        result: true,
        products: []
      });
    }

    // Fetch product details from Shopify
    let products: ProductDetails[];
    try {
      products = await fetchProductDetails(admin, productIds);
    } catch (error) {
      return json<ProductResponse>({
        result: false,
        products: [],
        error: error instanceof Error ? error.message : "Failed to fetch product details"
      }, { status: 500 });
    }

    return json<ProductResponse>({
      result: true,
      products: products
    });

  } catch (error) {
    console.error("API Error:", error);
    return json<ProductResponse>({
      result: false,
      products: [],
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
}
