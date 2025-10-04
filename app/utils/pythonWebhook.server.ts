/**
 * Python Server Webhook Utilities
 * Centralized webhook forwarding to Python server
 */

interface WebhookPayload {
  shopDomain: string;
  productId: string;
  accessToken?: string;
}

export async function forwardWebhookToPython(
  action: 'create' | 'update' | 'delete',
  shopDomain: string,
  productId: string,
  accessToken?: string
): Promise<void> {
  try {
    const pythonServerUrl = process.env.PYTHON_SERVER_URL;

    if (!pythonServerUrl) {
      console.error('❌ PYTHON_SERVER_URL not configured');
      return;
    }

    const payload: WebhookPayload = {
      shopDomain,
      productId
    };

    // Add access token for create/update (needed to fetch product)
    if (action === 'create' || action === 'update') {
      payload.accessToken = accessToken;
    }

    // Fire-and-forget call to Python server
    fetch(`${pythonServerUrl}/api/webhook/product/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch((error: any) => {
      console.error(`❌ Python server webhook error (${action}):`, error);
    });

    console.log(`✅ Product ${action} webhook forwarded to Python server: ${productId}`);
  } catch (error) {
    console.error(`❌ Error forwarding webhook to Python:`, error);
  }
}

export function validateWebhook(payload: any, shop: string | undefined): boolean {
  if (!payload || !shop) {
    console.error("❌ Missing payload or shop data");
    return false;
  }

  if (!payload.id) {
    console.error("❌ Missing product ID in webhook payload");
    return false;
  }

  return true;
}
