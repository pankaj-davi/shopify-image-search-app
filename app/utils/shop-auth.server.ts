import { sessionStorage } from "../session-storage.server";

export async function getValidShopSession(shopDomain: string) {
  try {
    // Use Shopify's session storage to get valid sessions
    const offlineSessionId = `offline_${shopDomain}`;
    console.log(`🔍 Looking for session with ID: ${offlineSessionId}`);

    // Also check if there are ANY sessions for this shop
    const allSessions = await sessionStorage.findSessionsByShop(shopDomain);
    console.log(`📊 Found ${allSessions.length} total session(s) for shop ${shopDomain}`);
    if (allSessions.length > 0) {
      console.log(`📋 Session IDs: ${allSessions.map(s => s.id).join(', ')}`);
    }

    const session = await sessionStorage.loadSession(offlineSessionId);

    if (session && session.accessToken) {
      // Validate the token by making a simple GraphQL query
      const isValid = await validateAccessToken(shopDomain, session.accessToken);
      if (isValid) {
        return session;
      } else {
        console.warn(`Invalid access token found for shop: ${shopDomain}`);
        console.warn(`Shop needs to reinstall the app at: https://${shopDomain}/admin/apps`);
        // DON'T delete the session - let it be replaced on next successful auth
        // Deleting it prevents the shop from being recognized during reinstall
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error getting shop session for ${shopDomain}:`, error);
    return null;
  }
}

export async function validateAccessToken(shopDomain: string, accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`https://${shopDomain}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        query: 'query { shop { name } }'
      })
    });

    if (response.ok) {
      const data = await response.json();
      return !data.errors;
    }
    return false;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
}

export function createValidatedAdminClient(shopDomain: string, accessToken: string) {
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
        // Provide more specific error for authentication issues
        if (response.status === 401) {
          throw new Error(`SHOP_AUTH_FAILED: Access token is invalid or expired for shop ${shopDomain}. Please reinstall the app.`);
        }
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Check for GraphQL errors that might indicate auth issues
      if (data.errors) {
        const authError = data.errors.find((error: any) =>
          error.message?.includes('access token') ||
          error.message?.includes('Unauthorized') ||
          error.message?.includes('Invalid API key')
        );
        if (authError) {
          throw new Error(`SHOP_AUTH_FAILED: ${authError.message}`);
        }
      }

      return {
        json: () => Promise.resolve(data)
      };
    }
  };
}