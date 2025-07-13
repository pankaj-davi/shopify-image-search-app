import { type DatabaseInterface, type ProductData, type StoreData } from './database.interface';
import { getFirestoreInstance } from './firebase.service';
import { FieldValue } from 'firebase-admin/firestore';

export class FirebaseDatabase implements DatabaseInterface {
  private firestore = getFirestoreInstance();

  // Product operations
  async createProduct(product: ProductData): Promise<string> {
    try {
      const productData = {
        ...product,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      const docRef = await this.firestore.collection('products').add(productData);
      console.log('🔥 Product created in Firebase:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating product in Firebase:', error);
      throw error;
    }
  }

  async getProducts(limit: number = 10): Promise<ProductData[]> {
    try {
      const query = this.firestore
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
          price: data.price,
          sku: data.sku,
          shopDomain: data.shopDomain,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });
      
      console.log(`🔥 Retrieved ${products.length} products from Firebase`);
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
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('❌ Error getting product by ID from Firebase:', error);
      throw error;
    }
  }

  async updateProduct(id: string, updates: Partial<ProductData>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      };
      
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
      const storeData = {
        ...store,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      
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
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('❌ Error getting store from Firebase:', error);
      throw error;
    }
  }

  async updateStore(shopDomain: string, updates: Partial<StoreData>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      await this.firestore.collection('stores').doc(shopDomain).update(updateData);
      console.log('🔥 Store updated in Firebase:', shopDomain);
    } catch (error) {
      console.error('❌ Error updating store in Firebase:', error);
      throw error;
    }
  }

  // Firebase-specific methods
  async getProductsByShop(shopDomain: string, limit: number = 10): Promise<ProductData[]> {
    try {
      const query = this.firestore
        .collection('products')
        .where('shopDomain', '==', shopDomain)
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
          price: data.price,
          sku: data.sku,
          shopDomain: data.shopDomain,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
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
      let query: any = this.firestore.collection('products');
      
      if (shopDomain) {
        query = query.where('shopDomain', '==', shopDomain);
      }
      
      // Note: Firestore doesn't support full-text search natively
      // For production, consider using Algolia or Elasticsearch
      const snapshot = await query.get();
      
      const products: ProductData[] = [];
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
            price: data.price,
            sku: data.sku,
            shopDomain: data.shopDomain,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        }
      });
      
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
}
