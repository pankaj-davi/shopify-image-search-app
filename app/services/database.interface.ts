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
  sku?: string;
  priceRange?: {
    minVariantPrice: { amount: string; currencyCode: string };
    maxVariantPrice: { amount: string; currencyCode: string };
  } | null;
  featuredImage?: {
    url: string;
    altText?: string | null;
  } | null;
  options?: Array<{ name: string; values: string[] }>;
  variants?: Array<{ price: string; sku: string }>;
  metafields?: Array<{
    namespace: string;
    key: string;
    value: string;
    type: string;
    description?: string | null;
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
  plan?: {
    partnerDevelopment?: boolean;
    shopifyPlus?: boolean;
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
