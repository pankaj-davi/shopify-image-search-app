import prisma from "../db.server";

export async function getShopSession(shopDomain: string) {
  // Get the most recent session for this shop
  const session = await prisma.session.findFirst({
    where: { 
      shop: shopDomain
    },
    orderBy: { 
      expires: 'desc' 
    }
  });
  
  // Check if session has a valid access token
  if (session && session.accessToken) {
    return session;
  }
  
  return null;
}

export function createAdminClient(shopDomain: string, accessToken: string) {
  return {
    graphql: async (query: string, variables?: any) => {
      const response = await fetch(`https://${shopDomain}/admin/api/2025-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({ 
          query, 
          variables: variables?.variables || variables 
        })
      });
      
      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
      }
      
      return { 
        json: () => response.json() 
      };
    }
  };
}