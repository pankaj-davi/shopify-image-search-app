import { databaseConfig, type DatabaseProvider } from '../config/database.config';

// Generic database interface
export interface DatabaseInterface {
  // Product operations
  createProduct(product: ProductData): Promise<string>;
  getProducts(limit?: number): Promise<ProductData[]>;
  getProductById(id: string): Promise<ProductData | null>;
  updateProduct(id: string, updates: Partial<ProductData>): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  
  // Batch product operations for better performance
  batchCreateProducts(products: ProductData[]): Promise<string[]>;
  batchUpdateProducts(updates: Array<{ id: string; data: Partial<ProductData> }>): Promise<void>;
  
  // Store operations
  createStore(store: StoreData): Promise<string>;
  getStore(shopDomain: string): Promise<StoreData | null>;
  updateStore(shopDomain: string, updates: Partial<StoreData>): Promise<void>;
  
  // Store-Product relationship operations
  getStoreWithProducts(shopDomain: string, productLimit?: number): Promise<{ store: StoreData; products: ProductData[] } | null>;
  syncStoreWithProducts(storeData: StoreData, products: ProductData[]): Promise<void>;

  // Event logging
  recordStoreEvent(shopDomain: string, eventType: string, eventData: Record<string, any>): Promise<void>;
}

// Data types
export interface ProductData {
  id?: string;
  shopifyProductId: string;
  title: string;
  handle: string;
  status: string;
  description?: string | null;
  vendor?: string | null;
  productType?: string | null;
  tags?: string[];
  onlineStoreUrl?: string | null;
  totalInventory?: number;
  price?: string;
  sku?: string | null;
  priceRange?: {
    minVariantPrice: { amount: string; currencyCode: string };
    maxVariantPrice: { amount: string; currencyCode: string };
  } | null;
  featuredMedia?: {
    mediaContentType?: string;
    image?: {
      url: string;
      altText?: string | null;
    } | null;
  } | null;
  media?: Array<{
    mediaContentType: string;
    image?: {
      url: string;
      altText?: string | null;
      width?: number;
      height?: number;
    };
  }>;
  options?: Array<{ name: string; values: string[] }>;
  variants?: Array<{ 
    id?: string;
    price: string; 
    sku: string | null;
    title?: string;
    availableForSale?: boolean;
    image?: {
      url: string;
      altText?: string | null;
      width?: number;
      height?: number;
    } | null;
  }>;
  metafields?: Array<{
    namespace: string;
    key: string;
    value: string;
    type: string;
    definition?: {
      description?: string | null;
    } | null;
  }>;
  shopDomain: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreData {
  id?: string;
  shopDomain: string;
  name: string;
  myshopifyDomain: string;
  email?: string;
  currencyCode?: string;
  timezoneAbbreviation?: string;
  timezoneOffset?: string;
  timezoneOffsetMinutes?: number;
  
  // Enhanced Plan Details
  plan?: {
    partnerDevelopment?: boolean;
    shopifyPlus?: boolean;
    displayName?: string;
  };
  
  // Store Details (NEW)
  description?: string;
  url?: string;
  primaryDomain?: {
    host?: string;
    sslEnabled?: boolean;
    url?: string;
  };
  
  // Contact & Communication (NEW)
  contactEmail?: string;
  
  // Location & Settings (NEW)
  ianaTimezone?: string;
  weightUnit?: string;
  unitSystem?: string;
  enabledPresentmentCurrencies?: string[];
  
  // Address Information (NEW)
  billingAddress?: {
    address1?: string;
    address2?: string;
    city?: string;
    company?: string;
    country?: string;
    countryCodeV2?: string;
    phone?: string;
    province?: string;
    provinceCode?: string;
    zip?: string;
  };
  
  // Store Configuration (NEW)
  checkoutApiSupported?: boolean;
  setupRequired?: boolean;
  taxesIncluded?: boolean;
  taxShipping?: boolean;
  marketingSmsConsentEnabledAtCheckout?: boolean;
  transactionalSmsDisabled?: boolean;
  
  // Store Features (NEW)
  features?: {
    avalaraAvatax?: boolean;
    branding?: boolean;
    captcha?: boolean;
    eligibleForSubscriptions?: boolean;
    giftCards?: boolean;
    reports?: boolean;
    sellsSubscriptions?: boolean;
    showMetrics?: boolean;
    storefront?: boolean;
    usingShopifyBalance?: boolean;
  };
  
  // Resource Limits (NEW)
  resourceLimits?: {
    locationLimit?: number;
    maxProductOptions?: number;
    maxProductVariants?: number;
    redirectLimitReached?: boolean;
  };
  
  themeConfig?: any; // Visual search theme configuration
  productCount?: number; // Track synced products count
  lastSyncAt?: Date; // Track last sync timestamp
  createdAt: Date;
  updatedAt: Date;
}

// Database factory function
export async function createDatabaseInstance(): Promise<DatabaseInterface> {
  const provider = databaseConfig.provider;
  
  switch (provider) {
    case 'firebase': {
      const { FirebaseDatabase } = await import('./firebase.database');
      return new FirebaseDatabase();
    }
    
    // case 'prisma': {
    //   const { PrismaDatabase } = await import('./prisma.database');
      // return new PrismaDatabase();
    // }
    
    // case 'mongodb': {
    //   const { MongoDatabase } = await import('./mongo.database');
    //   return new MongoDatabase();
    // }
    
    // case 'supabase': {
    //   const { SupabaseDatabase } = await import('./supabase.database');
      // return new SupabaseDatabase();
    // }
    
    default:
      throw new Error(`Unsupported database provider: ${provider}`);
  }
}

// Singleton instance
let databaseInstance: DatabaseInterface | null = null;

export async function getDatabase(): Promise<DatabaseInterface> {
  if (!databaseInstance) {
    databaseInstance = await createDatabaseInstance();
  }
  return databaseInstance;
}

export { type DatabaseProvider };
