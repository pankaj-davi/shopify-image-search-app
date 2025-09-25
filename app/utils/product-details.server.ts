import { extractIdFromGid } from "./visual-search.server";
import { getShopSession, createAdminClient } from "./shop.server";

export interface ProductDetails {
  id: string;
  available: boolean;
  title: string;
  handle: string;
  collection: Array<{
    id: string;
    title: string;
    handle: string;
  }>;
  currency: string;
  images: Array<{
    url: string;
    altText?: string;
  }>;
  metafields: Array<{
    namespace: string;
    key: string;
    value: string;
    type: string;
  } | null>;
  price: string;
  variants: {
    nodes: Array<{
      id: string;
      title: string;
      price: string;
      availableForSale: boolean;
      sku?: string;
      image?: {
        url: string;
        altText?: string;
      } | null;
    }>;
  };
  description: string;
  vendor: string;
  productType: string;
  totalInventory: number;
}

const PRODUCT_DETAILS_QUERY = `
  query getProductDetails($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        handle
        status
        description
        vendor
        productType
        totalInventory
        priceRangeV2 {
          minVariantPrice { 
            amount 
            currencyCode 
          }
          maxVariantPrice { 
            amount 
            currencyCode 
          }
        }
        featuredMedia {
          ... on MediaImage {
            image { 
              url 
              altText 
            }
          }
        }
        images(first: 10) {
          nodes { 
            url 
            altText 
          }
        }
        variants(first: 50) {
          nodes {
            id
            title
            price
            availableForSale
            sku
            image { 
              url 
              altText 
            }
          }
        }
        metafields(first: 10) {
          nodes { 
            namespace 
            key 
            value 
            type 
          }
        }
        collections(first: 5) {
          nodes { 
            id 
            title 
            handle 
          }
        }
      }
      ... on ProductVariant {
        id
        title
        price
        availableForSale
        sku
        image { 
          url 
          altText 
        }
        product {
          id
          title
          handle
          status
          description
          vendor
          productType
          totalInventory
          priceRangeV2 {
            minVariantPrice { 
              amount 
              currencyCode 
            }
            maxVariantPrice { 
              amount 
              currencyCode 
            }
          }
          featuredMedia {
            ... on MediaImage {
              image { 
                url 
                altText 
              }
            }
          }
          images(first: 10) {
            nodes { 
              url 
              altText 
            }
          }
          variants(first: 50) {
            nodes {
              id
              title
              price
              availableForSale
              sku
              image { 
                url 
                altText 
              }
            }
          }
          metafields(first: 10) {
            nodes { 
              namespace 
              key 
              value 
              type 
            }
          }
          collections(first: 5) {
            nodes { 
              id 
              title 
              handle 
            }
          }
        }
      }
    }
  }
`;

export async function fetchProductDetails(
    admin: any, 
    productIds: string[]
): Promise<ProductDetails[]> {
    const fetchStart = Date.now();
    console.log(`[TIMING] Fetching product details for ${productIds.length} IDs`);
    try {
        const graphqlStart = Date.now();
        const shopifyResponse = await admin.graphql(PRODUCT_DETAILS_QUERY, {
            variables: { ids: productIds }
        });
        const graphqlEnd = Date.now();
        console.log(`[TIMING] GraphQL query took: ${graphqlEnd - graphqlStart}ms`);
        
        const jsonStart = Date.now();
        const shopifyData = await shopifyResponse.json();
        const jsonEnd = Date.now();
        console.log(`[TIMING] Shopify JSON parsing took: ${jsonEnd - jsonStart}ms`);
        if (!shopifyData.data || !shopifyData.data.nodes) {
            throw new Error("Failed to fetch product details from Shopify");
        }

        // Transform Shopify data to required format
        const transformStart = Date.now();
        const result = shopifyData.data.nodes
            .filter((node: any) => node !== null)
            .map((node: any) => transformProductNode(node));
        const transformEnd = Date.now();
        console.log(`[TIMING] Data transformation took: ${transformEnd - transformStart}ms`);
        console.log(`[TIMING] Total product fetch took: ${Date.now() - fetchStart}ms`);
        
        return result;
    } catch (error) {
        console.error("Error fetching product details:", error);
        console.log(`[TIMING] Product fetch failed after: ${Date.now() - fetchStart}ms`);
        throw error;
    }
}

export async function fetchProductDetailsWithAuth(
    shopDomain: string,
    productIds: string[]
): Promise<ProductDetails[]> {
    console.log("Fetching product details with auth for shop:", shopDomain);
    
    // Get stored session for this shop
    const session = await getShopSession(shopDomain);
    
    if (!session) {
        throw new Error(`No session found for shop ${shopDomain}. Please install the app first.`);
    }
    
    // Check if session is expired
    if (session.expires && new Date() > session.expires) {
        throw new Error(`Session expired for shop ${shopDomain}. Please reinstall the app.`);
    }
    
    // Create admin client with stored access token
    const admin = createAdminClient(shopDomain, session.accessToken);
    
    // Use existing fetchProductDetails logic
    return fetchProductDetails(admin, productIds);
}

function transformProductNode(node: any): ProductDetails {
  // Handle both Product and ProductVariant nodes
  const product = node.product || node;
  const currency = product.priceRangeV2?.minVariantPrice?.currencyCode || 'USD';
  const price = product.priceRangeV2?.minVariantPrice?.amount || '0.0';
  
  // For products, check if any variant is available for sale
  // For product variants, use the variant's availableForSale or product's variant availability
  let isAvailable = false;
  if (node.product) {
    // This is a ProductVariant node
    isAvailable = node.availableForSale || false;
  } else {
    // This is a Product node - check if any variant is available
    isAvailable = product.variants?.nodes?.some((variant: any) => variant.availableForSale) || false;
  }
  
  
  return {
    id: extractIdFromGid(product.id),
    available: isAvailable,
    title: product.title || '',
    handle: product.handle || '',
    collection: (product.collections?.nodes || []).map((col: any) => ({
      id: extractIdFromGid(col.id),
      title: col.title,
      handle: col.handle
    })),
    currency: currency,
    images: (product.images?.nodes || []).map((img: any) => ({
      url: img.url,
      altText: img.altText
    })),
    metafields: (product.metafields?.nodes || []).map((meta: any) => 
      meta ? {
        namespace: meta.namespace,
        key: meta.key,
        value: meta.value,
        type: meta.type
      } : null
    ),
    price: price,
    variants: {
      nodes: (product.variants?.nodes || []).map((variant: any) => ({
        id: variant.id,
        title: variant.title,
        price: variant.price,
        availableForSale: variant.availableForSale,
        sku: variant.sku,
        image: variant.image ? {
          url: variant.image.url,
          altText: variant.image.altText
        } : null
      }))
    },
    description: product.description || '',
    vendor: product.vendor || '',
    productType: product.productType || '',
    totalInventory: product.totalInventory || 0
  };
}
