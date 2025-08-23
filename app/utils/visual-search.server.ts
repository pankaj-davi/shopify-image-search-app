// Visual Search Utility Functions
export interface VisualSearchResult {
  product_id: string;
  variant: boolean;
  main_image: boolean;
  sku: string;
  shopifyProductId: string;
  "Object Name": string;
}

export interface VisualSearchResponse {
  results: VisualSearchResult[];
}

export async function callVisualSearchAPI(
  shopDomain: string, 
  imageFile: File
): Promise<VisualSearchResponse> {
  const searchFormData = new FormData();
  searchFormData.append("file", imageFile);
  console.log("Sending visual search request...");
  const searchResponse = await fetch(
    `${process.env.SHOPIFY_APP_EMBEDDINGS_URL}/${shopDomain}`,
    {
      method: "POST",
      headers: {
        "accept": "application/json",
      },
      body: searchFormData,
    }
  );
  
  if (!searchResponse.ok) { 
    throw new Error(`Visual search API failed with status: ${searchResponse.status}`);
  }
  const responseData = await searchResponse.json();
  console.log(responseData, "TTTTTTTTTTTTTTTTTTT");
  return responseData;
}

export function extractUniqueProductGids(results: VisualSearchResult[]): string[] {
  const productGids = new Set<string>();
  
  results.forEach(result => {
    if (result.shopifyProductId) {
      productGids.add(result.shopifyProductId);
    }
  });
  console.log("Extracted product GIDs:", Array.from(productGids));
  return Array.from(productGids);
}

export function extractIdFromGid(gid: string): string {
  return gid.split('/').pop() || '';
}
