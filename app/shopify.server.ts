import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
  DeliveryMethod,
} from "@shopify/shopify-app-remix/server";
import type { Session } from "@shopify/shopify-app-remix/server";
import { sessionStorage } from "./session-storage.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage,
  distribution: AppDistribution.AppStore,
  useOnlineTokens: false, // Use offline tokens for persistent API access
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/app/uninstalled",
    },
  },
  afterAuth: async (session: Session) => {
    await shopify.registerWebhooks({ session });
    try {
      // Lazy load Firebase to avoid initialization errors
      const { initializeFirebase } = await import("./services/firebase.service");
      const firestore = initializeFirebase();
      await firestore.collection("storeEvents").add({
        shopDomain: session.shop,
        installed: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to record store event in Firebase:", error);
      // Continue anyway - don't block authentication due to Firebase errors
    }
    return true;
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
