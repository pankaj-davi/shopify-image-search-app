// Visual Search Utility Functions
export interface VisualSearchResult {
  product_id: string;
  variant: boolean;
  main_image: boolean;
  sku: string;
  shopifyProductId: string;
  ["Object Name"]: string;
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
  
   const url = `${process.env.SHOPIFY_APP_EMBEDDINGS_URL}/search/${shopDomain}`;
  
  try {
    const searchResponse = await fetch(url, {
      method: "POST",
      headers: {
        "accept": "application/json",
      },
      body: searchFormData,
    });
    
    if (!searchResponse.ok) { 
      const errorText = await searchResponse.text();
      throw new Error(`Visual search API failed with status: ${searchResponse.status} - ${errorText}`);
    }
    const responseData = await searchResponse.json();    console.log("Visual search response:", responseData);
    return responseData;
  } catch (error) {
    console.error("Visual search API error:", error);
    throw error;
  }
}

export function extractIdFromGid(gid: string): string {
  return gid.split('/').pop() || '';
}
