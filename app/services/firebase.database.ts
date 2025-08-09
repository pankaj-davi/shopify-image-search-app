import { type DatabaseInterface, type ProductData, type StoreData } from './database.interface';
import { getFirestoreInstance } from './firebase.service';
import { FieldValue } from 'firebase-admin/firestore';

// Utility function to safely convert timestamps
function safeToDate(timestamp: any): Date {
  if (!timestamp) {
    return new Date();
  }
  
  // If it's already a Date object, return as-is
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // If it's a Firebase Timestamp with toDate method
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // If it's a string, try to parse it
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  
  // Fallback to current date
  return new Date();
}

// Utility function to remove undefined values from objects
function sanitizeData(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeData(item)).filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeData(value);
      }
    }
    return sanitized;
  }
  
  return obj;
}

export class FirebaseDatabase implements DatabaseInterface {
  private firestore = getFirestoreInstance();

  // Product operations (using subcollections)
  async createProduct(product: ProductData): Promise<string> {
    try {
      const productData = sanitizeData({
        ...product,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      // Store product in subcollection under the store
      const docRef = await this.firestore
        .collection('stores')
        .doc(product.shopDomain)
        .collection('products')
        .add(productData);
        
      console.log('🔥 Product created in Firebase subcollection:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating product in Firebase:', error);
      throw error;
    }
  }

  async batchCreateProducts(products: ProductData[]): Promise<string[]> {
    try {
      const batch = this.firestore.batch();
      const productIds: string[] = [];
      
      for (const product of products) {
        const docRef = this.firestore.collection('products').doc();
        const productData = sanitizeData({
          ...product,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        
        batch.set(docRef, productData);
        productIds.push(docRef.id);
      }
      
      await batch.commit();
      console.log(`🔥 Batch created ${products.length} products in Firebase`);
      return productIds;
    } catch (error) {
      console.error('❌ Error batch creating products in Firebase:', error);
      throw error;
    }
  }

  async batchUpdateProducts(updates: Array<{ id: string; data: Partial<ProductData> }>): Promise<void> {
    try {
      const batch = this.firestore.batch();
      
      for (const update of updates) {
        const docRef = this.firestore.collection('products').doc(update.id);
        const updateData = sanitizeData({
          ...update.data,
          updatedAt: FieldValue.serverTimestamp(),
        });
        
        batch.update(docRef, updateData);
      }
      
      await batch.commit();
      console.log(`🔥 Batch updated ${updates.length} products in Firebase`);
    } catch (error) {
      console.error('❌ Error batch updating products in Firebase:', error);
      throw error;
    }
  }

  async getProducts(limit: number = 10): Promise<ProductData[]> {
    try {
      // Use collection group query to get products from all stores
      const collectionGroup = this.firestore.collectionGroup('products');
      const query = collectionGroup
        .orderBy('createdAt', 'desc')
        .limit(limit);
      
      const snapshot = await query.get();
      
      const products: ProductData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        products.push({
          id: doc.id,
          shopifyProductId: data.shopifyProductId,
          title: data.title,
          handle: data.handle,
          status: data.status,
          description: data.description,
          vendor: data.vendor,
          productType: data.productType,
          tags: data.tags,
          onlineStoreUrl: data.onlineStoreUrl,
          totalInventory: data.totalInventory,
          price: data.price,
          sku: data.sku,
          priceRange: data.priceRange,
          featuredMedia: data.featuredMedia,
          media: data.media,
          options: data.options,
          variants: data.variants,
          metafields: data.metafields,
          shopDomain: data.shopDomain,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt),
        });
      });
      
      console.log(`🔥 Retrieved ${products.length} products from Firebase subcollections`);
      return products;
    } catch (error) {
      console.error('❌ Error getting products from Firebase:', error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<ProductData | null> {
    try {
      const doc = await this.firestore.collection('products').doc(id).get();
      
      if (!doc.exists) {
        return null;
      }
      
      const data = doc.data()!;
      return {
        id: doc.id,
        shopifyProductId: data.shopifyProductId,
        title: data.title,
        handle: data.handle,
        status: data.status,
        price: data.price,
        sku: data.sku,
        shopDomain: data.shopDomain,
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
      };
    } catch (error) {
      console.error('❌ Error getting product by ID from Firebase:', error);
      throw error;
    }
  }

  async updateProduct(id: string, updates: Partial<ProductData>): Promise<void> {
    try {
      const updateData = sanitizeData({
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      await this.firestore.collection('products').doc(id).update(updateData);
      console.log('🔥 Product updated in Firebase:', id);
    } catch (error) {
      console.error('❌ Error updating product in Firebase:', error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await this.firestore.collection('products').doc(id).delete();
      console.log('🔥 Product deleted from Firebase:', id);
    } catch (error) {
      console.error('❌ Error deleting product from Firebase:', error);
      throw error;
    }
  }

  // Store operations
  async createStore(store: StoreData): Promise<string> {
    try {
      const storeData = sanitizeData({
        ...store,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      // Use shopDomain as document ID for easy retrieval
      const docRef = this.firestore.collection('stores').doc(store.shopDomain);
      await docRef.set(storeData);
      
      console.log('🔥 Store created in Firebase:', store.shopDomain);
      return store.shopDomain;
    } catch (error) {
      console.error('❌ Error creating store in Firebase:', error);
      throw error;
    }
  }

  async getStore(shopDomain: string): Promise<StoreData | null> {
    try {
      const doc = await this.firestore.collection('stores').doc(shopDomain).get();
      
      if (!doc.exists) {
        return null;
      }
      
      const data = doc.data()!;
      return {
        id: doc.id,
        shopDomain: data.shopDomain,
        name: data.name,
        myshopifyDomain: data.myshopifyDomain,
        email: data.email,
        currencyCode: data.currencyCode,
        timezoneAbbreviation: data.timezoneAbbreviation,
        timezoneOffset: data.timezoneOffset,
        timezoneOffsetMinutes: data.timezoneOffsetMinutes,
        plan: data.plan,
        productCount: data.productCount,
        lastSyncAt: data.lastSyncAt ? safeToDate(data.lastSyncAt) : undefined,
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt),
      };
    } catch (error) {
      console.error('❌ Error getting store from Firebase:', error);
      throw error;
    }
  }

  async updateStore(shopDomain: string, updates: Partial<StoreData>): Promise<void> {
    try {
      const updateData = sanitizeData({
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      await this.firestore.collection('stores').doc(shopDomain).update(updateData);
      console.log('🔥 Store updated in Firebase:', shopDomain);
    } catch (error) {
      console.error('❌ Error updating store in Firebase:', error);
      throw error;
    }
  }

  // Store-Product relationship operations
  async getStoreWithProducts(shopDomain: string, productLimit: number = 25): Promise<{ store: StoreData; products: ProductData[] } | null> {
    try {
      // Get store data
      const store = await this.getStore(shopDomain);
      if (!store) {
        return null;
      }

      // Get products for this store
      const products = await this.getProductsByShop(shopDomain, productLimit);

      return { store, products };
    } catch (error) {
      console.error('❌ Error getting store with products from Firebase:', error);
      throw error;
    }
  }

  async syncStoreWithProducts(storeData: StoreData, products: ProductData[]): Promise<void> {
    try {
      console.log(`🔥 Starting Firebase transaction to sync store ${storeData.shopDomain} with ${products.length} products`);
      
      await this.firestore.runTransaction(async (transaction) => {
        // Update or create store
        const storeRef = this.firestore.collection('stores').doc(storeData.shopDomain);
        const storeDoc = await transaction.get(storeRef);
        
        const storeUpdateData: any = sanitizeData({
          ...storeData,
          productCount: products.length,
          lastSyncAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        if (storeDoc.exists) {
          transaction.update(storeRef, storeUpdateData);
          console.log(`🔥 Store updated in transaction: ${storeData.shopDomain}`);
        } else {
          storeUpdateData.createdAt = FieldValue.serverTimestamp();
          transaction.set(storeRef, storeUpdateData);
          console.log(`🔥 Store created in transaction: ${storeData.shopDomain}`);
        }
      });

      // Handle products in batches using subcollections
      const batchSize = 400; // Leave some room for safety
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = this.firestore.batch();
        const productBatch = products.slice(i, i + batchSize);
        
        for (const product of productBatch) {
          // Check if product exists by shopifyProductId in the store's subcollection
          const existingProductQuery = await this.firestore
            .collection('stores')
            .doc(storeData.shopDomain)
            .collection('products')
            .where('shopifyProductId', '==', product.shopifyProductId)
            .limit(1)
            .get();

          if (!existingProductQuery.empty) {
            // Update existing product in subcollection
            const existingDoc = existingProductQuery.docs[0];
            const updateData = sanitizeData({
              ...product,
              updatedAt: FieldValue.serverTimestamp(),
            });
            batch.update(existingDoc.ref, updateData);
          } else {
            // Create new product in subcollection
            const newProductRef = this.firestore
              .collection('stores')
              .doc(storeData.shopDomain)
              .collection('products')
              .doc();
              
            const productData = sanitizeData({
              ...product,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
            batch.set(newProductRef, productData);
          }
        }
        
        await batch.commit();
        console.log(`🔥 Processed batch ${Math.floor(i / batchSize) + 1} of products (${productBatch.length} products)`);
      }
      
      console.log(`✅ Successfully synced store ${storeData.shopDomain} with ${products.length} products using subcollections`);
    } catch (error) {
      console.error('❌ Error syncing store with products in Firebase:', error);
      throw error;
    }
  }

  // Firebase-specific methods
  async getProductsByShop(shopDomain: string, limit: number = 10): Promise<ProductData[]> {
    try {
      const query = this.firestore
        .collection('stores')
        .doc(shopDomain)
        .collection('products')
        .orderBy('createdAt', 'desc')
        .limit(limit);
      
      const snapshot = await query.get();
      
      const products: ProductData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        products.push({
          id: doc.id,
          shopifyProductId: data.shopifyProductId,
          title: data.title,
          handle: data.handle,
          status: data.status,
          description: data.description,
          vendor: data.vendor,
          productType: data.productType,
          tags: data.tags,
          onlineStoreUrl: data.onlineStoreUrl,
          totalInventory: data.totalInventory,
          price: data.price,
          sku: data.sku,
          priceRange: data.priceRange,
          featuredMedia: data.featuredMedia,
          media: data.media,
          options: data.options,
          variants: data.variants,
          metafields: data.metafields,
          shopDomain: data.shopDomain,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt),
        });
      });
      
      return products;
    } catch (error) {
      console.error('❌ Error getting products by shop from Firebase:', error);
      throw error;
    }
  }

  async searchProducts(searchTerm: string, shopDomain?: string): Promise<ProductData[]> {
    try {
      const products: ProductData[] = [];
      
      if (shopDomain) {
        // Search within a specific store's subcollection
        const snapshot = await this.firestore
          .collection('stores')
          .doc(shopDomain)
          .collection('products')
          .get();
          
        snapshot.forEach((doc: any) => {
          const data = doc.data();
          const title = data.title?.toLowerCase() || '';
          const handle = data.handle?.toLowerCase() || '';
          const search = searchTerm.toLowerCase();
          
          if (title.includes(search) || handle.includes(search)) {
            products.push({
              id: doc.id,
              shopifyProductId: data.shopifyProductId,
              title: data.title,
              handle: data.handle,
              status: data.status,
              description: data.description,
              vendor: data.vendor,
              productType: data.productType,
              tags: data.tags,
              onlineStoreUrl: data.onlineStoreUrl,
              totalInventory: data.totalInventory,
              price: data.price,
              sku: data.sku,
              priceRange: data.priceRange,
              featuredMedia: data.featuredMedia,
              media: data.media,
              options: data.options,
              variants: data.variants,
              metafields: data.metafields,
              shopDomain: data.shopDomain,
              createdAt: safeToDate(data.createdAt),
              updatedAt: safeToDate(data.updatedAt),
            });
          }
        });
      } else {
        // Search across all stores (collection group query)
        const collectionGroup = this.firestore.collectionGroup('products');
        const snapshot = await collectionGroup.get();
        
        snapshot.forEach((doc: any) => {
          const data = doc.data();
          const title = data.title?.toLowerCase() || '';
          const handle = data.handle?.toLowerCase() || '';
          const search = searchTerm.toLowerCase();
          
          if (title.includes(search) || handle.includes(search)) {
            products.push({
              id: doc.id,
              shopifyProductId: data.shopifyProductId,
              title: data.title,
              handle: data.handle,
              status: data.status,
              description: data.description,
              vendor: data.vendor,
              productType: data.productType,
              tags: data.tags,
              onlineStoreUrl: data.onlineStoreUrl,
              totalInventory: data.totalInventory,
              price: data.price,
              sku: data.sku,
              priceRange: data.priceRange,
              featuredMedia: data.featuredMedia,
              media: data.media,
              options: data.options,
              variants: data.variants,
              metafields: data.metafields,
              shopDomain: data.shopDomain,
              createdAt: safeToDate(data.createdAt),
              updatedAt: safeToDate(data.updatedAt),
            });
          }
        });
      }
      
      return products;
    } catch (error) {
      console.error('❌ Error searching products in Firebase:', error);
      throw error;
    }
  }

  async recordStoreEvent(shopDomain: string, eventType: string, eventData: Record<string, any>): Promise<void> {
    try {
      console.log(`🔥 Attempting to record store event: ${eventType} for ${shopDomain}`);
      const event = {
        shopDomain,
        eventType,
        eventData,
        timestamp: FieldValue.serverTimestamp(),
      };

      console.log('🔥 Event data prepared:', event);
      await this.firestore.collection('storeEvents').add(event);
      console.log(`🔥 Store event successfully recorded: ${eventType} for ${shopDomain}`);
    } catch (error) {
      console.error('❌ Error recording store event in Firebase:', error);
      throw error;
    }
  }

  // ===============================
  // APP BLOCK TRACKING METHODS
  // ===============================

  async createAppBlockUsage(usage: any): Promise<{ id: string }> {
    try {
      const usageData = sanitizeData({
        shopDomain: usage.shopDomain,
        blockType: usage.blockType,
        action: usage.action,
        url: usage.url || null,
        userAgent: usage.userAgent || null,
        metadata: usage.metadata ? JSON.stringify(usage.metadata) : null,
        sessionId: usage.sessionId || null,
        timestamp: FieldValue.serverTimestamp(),
      });

      const docRef = await this.firestore.collection('appBlockUsage').add(usageData);
      
      console.log('🔥 App block usage created in Firebase:', {
        id: docRef.id,
        shopDomain: usage.shopDomain,
        action: usage.action,
        blockType: usage.blockType
      });

      return { id: docRef.id };
    } catch (error) {
      console.error('❌ Error creating app block usage in Firebase:', error);
      throw error;
    }
  }

  async getAppBlockUsageStats(shopDomain: string, since: Date): Promise<any> {
    try {
      const query = this.firestore
        .collection('appBlockUsage')
        .where('shopDomain', '==', shopDomain)
        .where('timestamp', '>=', since);

      const snapshot = await query.get();
      
      const stats = {
        totalUsage: 0,
        byAction: {} as Record<string, number>,
        dailyUsage: [] as any[],
        lastUsed: null as string | null
      };

      let lastTimestamp: Date | null = null;

      snapshot.forEach((doc) => {
        const data = doc.data();
        stats.totalUsage++;
        
        // Count by action
        const action = data.action || 'unknown';
        stats.byAction[action] = (stats.byAction[action] || 0) + 1;
        
        // Track last used
        const timestamp = safeToDate(data.timestamp);
        if (!lastTimestamp || timestamp > lastTimestamp) {
          lastTimestamp = timestamp;
        }
      });

      if (lastTimestamp) {
        stats.lastUsed = (lastTimestamp as Date).toISOString();
      }

      console.log(`🔥 Retrieved app block stats for ${shopDomain}:`, stats);
      return stats;
    } catch (error) {
      console.error('❌ Error getting app block usage stats from Firebase:', error);
      throw error;
    }
  }

  async getRecentAppBlockUsage(shopDomain: string, since: Date): Promise<any[]> {
    try {
      const query = this.firestore
        .collection('appBlockUsage')
        .where('shopDomain', '==', shopDomain)
        .where('timestamp', '>=', since)
        .orderBy('timestamp', 'desc')
        .limit(50);

      const snapshot = await query.get();
      
      const usage: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        usage.push({
          id: doc.id,
          shopDomain: data.shopDomain,
          blockType: data.blockType,
          action: data.action,
          url: data.url,
          userAgent: data.userAgent,
          metadata: data.metadata ? JSON.parse(data.metadata) : null,
          sessionId: data.sessionId,
          timestamp: safeToDate(data.timestamp),
        });
      });

      console.log(`🔥 Retrieved ${usage.length} recent app block usage records for ${shopDomain}`);
      return usage;
    } catch (error) {
      console.error('❌ Error getting recent app block usage from Firebase:', error);
      throw error;
    }
  }

  // ===============================
  // VISUAL SEARCH TRACKING METHODS
  // ===============================

  async createVisualSearchUsage(usage: any): Promise<{ id: string }> {
    try {
      const usageData = sanitizeData({
        shopDomain: usage.shopDomain,
        searchType: usage.searchType,
        hasResults: usage.hasResults || false,
        resultCount: usage.resultCount || 0,
        imageSize: usage.imageSize || null,
        imageType: usage.imageType || null,
        cropData: usage.cropData ? JSON.stringify(usage.cropData) : null,
        sessionId: usage.sessionId || null,
        url: usage.url || null,
        timestamp: FieldValue.serverTimestamp(),
      });

      const docRef = await this.firestore.collection('visualSearchUsage').add(usageData);
      
      console.log('🔥 Visual search usage created in Firebase:', {
        id: docRef.id,
        shopDomain: usage.shopDomain,
        searchType: usage.searchType,
        hasResults: usage.hasResults,
        resultCount: usage.resultCount
      });

      return { id: docRef.id };
    } catch (error) {
      console.error('❌ Error creating visual search usage in Firebase:', error);
      throw error;
    }
  }

  async getVisualSearchUsageStats(shopDomain: string, since: Date): Promise<any> {
    try {
      const query = this.firestore
        .collection('visualSearchUsage')
        .where('shopDomain', '==', shopDomain)
        .where('timestamp', '>=', since);

      const snapshot = await query.get();
      
      const stats = {
        totalSearches: 0,
        successfulSearches: 0,
        bySearchType: {} as Record<string, number>,
        averageResults: 0,
        dailySearches: [] as any[]
      };

      let totalResults = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        stats.totalSearches++;
        
        if (data.hasResults) {
          stats.successfulSearches++;
        }
        
        // Count by search type
        const searchType = data.searchType || 'unknown';
        stats.bySearchType[searchType] = (stats.bySearchType[searchType] || 0) + 1;
        
        // Calculate average results
        totalResults += (data.resultCount || 0);
      });

      if (stats.totalSearches > 0) {
        stats.averageResults = totalResults / stats.totalSearches;
      }

      console.log(`🔥 Retrieved visual search stats for ${shopDomain}:`, stats);
      return stats;
    } catch (error) {
      console.error('❌ Error getting visual search usage stats from Firebase:', error);
      throw error;
    }
  }
}
