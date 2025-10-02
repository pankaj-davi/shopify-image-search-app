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
  private firestoreInstance?: ReturnType<typeof getFirestoreInstance>;

  private getFirestore() {
    if (!this.firestoreInstance) {
      this.firestoreInstance = getFirestoreInstance();
    }
    return this.firestoreInstance;
  }

  // Product operations (using subcollections)
  async createProduct(product: ProductData): Promise<string> {
    try {
      const productData = sanitizeData({
        ...product,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      // Store product in subcollection under the store using Shopify product ID as document ID
      const shopifyId = product.shopifyProductId.replace('gid://shopify/Product/', '');
      const docRef = this.getFirestore()
        .collection('stores')
        .doc(product.shopDomain)
        .collection('products')
        .doc(shopifyId);

      await docRef.set(productData);

      console.log('🔥 Product created in Firebase subcollection:', shopifyId, productData);
      return shopifyId;
    } catch (error) {
      console.error('❌ Error creating product in Firebase:', error);
      throw error;
    }
  }



  async getProducts(limit: number = 10): Promise<ProductData[]> {
    try {
      // Use collection group query to get products from all stores
      const collectionGroup = this.getFirestore().collectionGroup('products');
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







  // Store operations
  async createStore(store: StoreData): Promise<string> {
    try {
      const storeData = sanitizeData({
        ...store,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      // Use shopDomain as document ID for easy retrieval
      const docRef = this.getFirestore().collection('stores').doc(store.shopDomain);
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
      const doc = await this.getFirestore().collection('stores').doc(shopDomain).get();
      
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
      
      await this.getFirestore().collection('stores').doc(shopDomain).update(updateData);
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
      
      await this.getFirestore().runTransaction(async (transaction) => {
        // Update or create store
        const storeRef = this.getFirestore().collection('stores').doc(storeData.shopDomain);
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
        const batch = this.getFirestore().batch();
        const productBatch = products.slice(i, i + batchSize);
        
        for (const product of productBatch) {
          // Check if product exists by shopifyProductId in the store's subcollection
          const existingProductQuery = await this.getFirestore()
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
            const newProductRef = this.getFirestore()
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
      const query = this.getFirestore()
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
      // Save as subcollection under the store domain
      await this.getFirestore()
        .collection('stores')
        .doc(shopDomain)
        .collection('events')
        .add(event);
      console.log(`🔥 Store event successfully recorded in subcollection: ${eventType} for ${shopDomain}`);
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
      console.log('🔥 Creating app block usage with data:', usage);

      const usageData = sanitizeData({
        shopDomain: usage.shopDomain,
        action: usage.action,
        url: usage.url || null,
        userAgent: usage.userAgent || null,
        metadata: usage.metadata ? (typeof usage.metadata === 'string' ? usage.metadata : JSON.stringify(usage.metadata)) : null,
        timestamp: usage.timestamp || FieldValue.serverTimestamp(),
      });

      console.log('🔥 Sanitized usage data:', usageData);

      // Store as subcollection under the store
      const docRef = await this.getFirestore()
        .collection('stores')
        .doc(usage.shopDomain)
        .collection('appBlockUsage')
        .add(usageData);

      console.log('🔥 App block usage created in Firebase subcollection:', {
        id: docRef.id,
        shopDomain: usage.shopDomain,
        action: usage.action,
        path: `stores/${usage.shopDomain}/appBlockUsage/${docRef.id}`,
        savedTimestamp: usageData.timestamp
      });

      return { id: docRef.id };
    } catch (error) {
      console.error('❌ Error creating app block usage in Firebase:', error);
      throw error;
    }
  }

  // ===============================
  // PRODUCT WEBHOOK METHODS
  // ===============================

  async updateProductByShopifyId(shopDomain: string, shopifyProductId: string, productData: Partial<ProductData>): Promise<boolean> {
    try {
      // Extract numeric ID from Shopify GID or use as-is if already numeric
      const productId = shopifyProductId.replace('gid://shopify/Product/', '');

      const docRef = this.getFirestore()
        .collection('stores')
        .doc(shopDomain)
        .collection('products')
        .doc(productId);

      const doc = await docRef.get();

      if (doc.exists) {
        const updateData = sanitizeData({
          ...productData,
          updatedAt: FieldValue.serverTimestamp(),
        });

        await docRef.update(updateData);
        console.log(`🔥 Product updated in Firebase: ${productId}`);
        return true;
      } else {
        console.log(`⚠️ Product not found for update: ${productId}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating product by Shopify ID:', error);
      throw error;
    }
  }

  async deleteProductByShopifyId(shopDomain: string, shopifyProductId: string): Promise<boolean> {
    try {
      // Extract numeric ID from Shopify GID or use as-is if already numeric
      const productId = shopifyProductId.replace('gid://shopify/Product/', '');

      const docRef = this.getFirestore()
        .collection('stores')
        .doc(shopDomain)
        .collection('products')
        .doc(productId);

      const doc = await docRef.get();

      if (doc.exists) {
        await docRef.delete();
        console.log(`🔥 Product deleted from Firebase: ${productId}`);
        return true;
      } else {
        console.log(`⚠️ Product not found for deletion: ${productId}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error deleting product by Shopify ID:', error);
      throw error;
    }
  }

  async getProductByShopifyId(shopDomain: string, shopifyProductId: string): Promise<ProductData | null> {
    try {
      // Extract numeric ID from Shopify GID or use as-is if already numeric
      const productId = shopifyProductId.replace('gid://shopify/Product/', '');

      const docRef = this.getFirestore()
        .collection('stores')
        .doc(shopDomain)
        .collection('products')
        .doc(productId);

      const doc = await docRef.get();

      if (doc.exists) {
        const data = doc.data()!;
        return {
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
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting product by Shopify ID:', error);
      throw error;
    }
  }

  // ===============================
  // SYNC JOB TRACKING METHODS
  // ===============================

  async createSyncJob(shopDomain: string, totalProducts: number): Promise<string> {
    try {
      const jobData = {
        shopDomain,
        status: 'pending', // pending, running, completed, failed
        totalProducts,
        syncedCount: 0,
        progress: 0,
        cursor: null,
        createdAt: FieldValue.serverTimestamp(),
        startedAt: null,
        completedAt: null,
        error: null,
        embeddingSuccess: false,
      };

      const jobRef = await this.getFirestore()
        .collection('sync_jobs')
        .add(jobData);

      console.log(`🔥 Sync job created: ${jobRef.id}`);
      return jobRef.id;
    } catch (error) {
      console.error('❌ Error creating sync job:', error);
      throw error;
    }
  }

  async getSyncJob(jobId: string): Promise<any> {
    try {
      const doc = await this.getFirestore()
        .collection('sync_jobs')
        .doc(jobId)
        .get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data()!;
      return {
        id: doc.id,
        shopDomain: data.shopDomain,
        status: data.status,
        totalProducts: data.totalProducts,
        syncedCount: data.syncedCount,
        progress: data.progress,
        cursor: data.cursor,
        createdAt: data.createdAt,
        startedAt: data.startedAt,
        completedAt: data.completedAt,
        error: data.error,
        embeddingSuccess: data.embeddingSuccess,
      };
    } catch (error) {
      console.error('❌ Error getting sync job:', error);
      throw error;
    }
  }

  async updateSyncJob(jobId: string, updates: any): Promise<void> {
    try {
      await this.getFirestore()
        .collection('sync_jobs')
        .doc(jobId)
        .update({
          ...updates,
          updatedAt: FieldValue.serverTimestamp()
        });
    } catch (error) {
      console.error('❌ Error updating sync job:', error);
      throw error;
    }
  }

  async getLatestSyncJob(shopDomain: string): Promise<any> {
    try {
      const snapshot = await this.getFirestore()
        .collection('sync_jobs')
        .where('shopDomain', '==', shopDomain)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      };
    } catch (error) {
      console.error('❌ Error getting latest sync job:', error);
      throw error;
    }
  }

  async saveProductsBatch(shopDomain: string, products: any[]): Promise<void> {
    try {
      const batch = this.getFirestore().batch();

      for (const product of products) {
        const productId = product.id.replace('gid://shopify/Product/', '');
        const productRef = this.getFirestore()
          .collection('stores')
          .doc(shopDomain)
          .collection('products')
          .doc(productId);

        batch.set(productRef, {
          ...product,
          shopDomain,
          syncedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
      }

      await batch.commit();
      console.log(`🔥 Saved batch of ${products.length} products`);
    } catch (error) {
      console.error('❌ Error saving products batch:', error);
      throw error;
    }
  }

  async getStoreProducts(shopDomain: string, limit: number = 1000): Promise<any[]> {
    try {
      const snapshot = await this.getFirestore()
        .collection('stores')
        .doc(shopDomain)
        .collection('products')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error getting store products:', error);
      throw error;
    }
  }

  // ===============================
  // ANALYTICS METHODS
  // ===============================

  async getVisualSearchAnalytics(filters: any): Promise<any> {
    try {
      const shopDomain = filters.shop;
      if (!shopDomain) {
        throw new Error('Shop domain is required for analytics');
      }

      const shopDocRef = this.getFirestore().collection('stores').doc(shopDomain);
      const appBlockUsageRef = shopDocRef.collection('appBlockUsage');
      const allRecordsSnapshot = await appBlockUsageRef.get();

      const allEvents: any[] = [];
      console.log(filters , "filtersfiltersfiltersfiltersfilters")
      allRecordsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        console.log(data, "datadddddddddddddddd")
        if (data.metadata) {
          try {
            let metadata;
            if (typeof data.metadata === 'string') {
              metadata = JSON.parse(data.metadata);
            } else {
              metadata = data.metadata;
            }
            console.log(metadata.source , "metadata.sourcemetadata.sourcemetadata.source");
            if (metadata && metadata.source) {
              let timestamp;
              if (data.timestamp?.toDate) {
                timestamp = data.timestamp.toDate();
              } else if (data.timestamp) {
                timestamp = new Date(data.timestamp);
              } else {
                timestamp = new Date();
              }

              const startDate = new Date(filters.startDate);
              const endDate = new Date(filters.endDate);
              const isInRange = timestamp >= startDate && timestamp <= endDate;
              console.log("allretuneObj" , {
                  id: doc.id,
                  shopDomain: shopDomain,
                  action: data.action,
                  url: data.url,
                  metadata: metadata,
                  timestamp: timestamp
              })
              if (isInRange) {
                allEvents.push({
                  id: doc.id,
                  shopDomain: shopDomain,
                  action: data.action,
                  url: data.url,
                  metadata: metadata,
                  timestamp: timestamp
                });
              }
            }
          } catch (e) {
            // Silently handle metadata parse errors
          }
        }
      });

      return this.processEventsIntoAnalytics(allEvents);

    } catch (error) {
      console.error('❌ Error getting visual search analytics from Firebase:', error);
      throw error;
    }
  }

  private processEventsIntoAnalytics(events: any[]): any {
    const totalEvents = events.length;
    console.log(events , "eventseventseventseventsevents")
    // Action breakdown
    const actionBreakdown = {
      loaded: events.filter(e => e.action === 'loaded').length,
      added: events.filter(e => e.action === 'added').length,
      viewed: events.filter(e => e.action === 'viewed').length,
      used: events.filter(e => e.action === 'used').length
    };

    // Daily trends (last 30 days)
    const dailyTrends: any[] = [];
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    last30Days.forEach(date => {
      const dayEvents = events.filter(e => {
        const eventDate = new Date(e.timestamp).toISOString().split('T')[0];
        return eventDate === date;
      });

      dailyTrends.push({
        date,
        loaded: dayEvents.filter(e => e.action === 'loaded').length,
        added: dayEvents.filter(e => e.action === 'added').length,
        viewed: dayEvents.filter(e => e.action === 'viewed').length,
        used: dayEvents.filter(e => e.action === 'used').length
      });
    });

    // Device breakdown (from metadata)
    const deviceBreakdown = {
      mobile: events.filter(e => e.metadata?.isMobile === true).length,
      desktop: events.filter(e => e.metadata?.isMobile === false).length
    };

    // Top shops
    const shopCounts: { [key: string]: number } = {};
    events.forEach(e => {
      shopCounts[e.shopDomain] = (shopCounts[e.shopDomain] || 0) + 1;
    });

    const topShops = Object.entries(shopCounts)
      .map(([shopDomain, eventCount]) => ({ shopDomain, eventCount }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    // Recent events
    const recentEvents = events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);

    return {
      totalEvents,
      actionBreakdown,
      dailyTrends,
      deviceBreakdown,
      topShops,
      recentEvents
    };
  }
}
