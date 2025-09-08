// Visual Search Utility Functions
export interface VisualSearchResult {
  product_id: string;
  variant: boolean;
  main_image: boolean;
  sku: string | null;
  shopifyProductId: string;
  similarity_score: number;
  detected_label: string;
}

interface CropMetadata {
  label: string;
  score: number;
  bbox: [number, number, number, number];
  bbox_normalized: [number, number, number, number];
  area: number;
}

interface CropSearchResult {
  crop_index: number;
  crop_metadata: CropMetadata;
  search_results: VisualSearchResult[];
}

interface Results {
  total_crops: number;
  crop_search_results: CropSearchResult[];
}

export interface VisualSearchResponse {
  results: Results;
}

export interface VisualSearchErrorResponse {
  error: string;
}

export type VisualSearchAPIResponse = VisualSearchResponse | VisualSearchErrorResponse;

export async function callVisualSearchAPI(
  shopDomain: string, 
  imageFile: File
): Promise<VisualSearchAPIResponse> {
  const searchFormData = new FormData();
  searchFormData.append("file", imageFile);
  
  //  const url = `${process.env.SHOPIFY_APP_EMBEDDINGS_URL}/search/${shopDomain}`;
   const url = `http://34.121.106.164:8000/search/${shopDomain}`;
  
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
    const responseData = await searchResponse.json();
    console.log("Visual search response:Pankaj", responseData);
    return responseData;
  } catch (error) {
    console.error("Visual search API error:", error);
    throw error;
  }
}

export function extractIdFromGid(gid: string): string {
  return gid.split('/').pop() || '';
}
