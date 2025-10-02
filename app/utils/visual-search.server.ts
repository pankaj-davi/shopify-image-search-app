// Visual Search Utility Functions
export interface BoundingBox {
  [key: string]: [number, number, number, number];
}

export interface VisualSearchResponse {
  search_results: string[];
  largest_bounding_box_id: number;
  all_bounding_box: BoundingBox[];
  labels: Array<{[key: string]: string}>;
}

export interface VisualSearchErrorResponse {
  error: string;
}

export type VisualSearchAPIResponse = VisualSearchResponse | VisualSearchErrorResponse;

export async function callVisualSearchAPI(
  shopDomain: string, 
  imageFile: File
): Promise<VisualSearchAPIResponse> {
  const apiStartTime = Date.now();
  console.log(`[TIMING] Visual Search API call starting for domain: ${shopDomain}`);
  console.log(`[TIMING] Image file size: ${imageFile.size} bytes`);
  
  const formDataStart = Date.now();
  const searchFormData = new FormData();
  searchFormData.append("file", imageFile);
  searchFormData.append("store_domain", shopDomain);
  console.log(`[TIMING] FormData creation took: ${Date.now() - formDataStart}ms`);

   const url = `${process.env.SHOPIFY_APP_EMBEDDINGS_URL}/search`;

  try {
    const fetchStart = Date.now();
    const searchResponse = await fetch(url, {
      method: "POST",
      headers: {
        "accept": "application/json",
      },
      body: searchFormData,
    });
    const fetchEnd = Date.now();
    console.log(`[TIMING] Fetch request took: ${fetchEnd - fetchStart}ms`);
    
    if (!searchResponse.ok) { 
      const errorStart = Date.now();
      const errorText = await searchResponse.text();
      console.log(`[TIMING] Error text parsing took: ${Date.now() - errorStart}ms`);
      throw new Error(`Visual search API failed with status: ${searchResponse.status} - ${errorText}`);
    }
    
    const jsonStart = Date.now();
    const responseData = await searchResponse.json();
    const jsonEnd = Date.now();
    console.log(`[TIMING] JSON parsing took: ${jsonEnd - jsonStart}ms`);
    console.log(`[TIMING] Total Visual Search API took: ${Date.now() - apiStartTime}ms`);
    
    console.log("Visual search response:Pankaj", responseData);
    return responseData;
  } catch (error) {
    console.error("Visual search API error:", error);
    console.log(`[TIMING] Visual Search API failed after: ${Date.now() - apiStartTime}ms`);
    throw error;
  }
}

export function extractIdFromGid(gid: string): string {
  return gid.split('/').pop() || '';
}
