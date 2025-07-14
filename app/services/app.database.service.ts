import { getDatabase, type ProductData, type StoreData } from './database.interface';

export class AppDatabaseService {
  private database: any = null;

  private async getDB() {
    if (!this.database) {
      this.database = await getDatabase();
    }
    return this.database;
  }

  // Store operations
  async syncStore(storeInfo: { name: string; myshopifyDomain: string }) {
    const db = await this.getDB();
    const shopDomain = storeInfo.myshopifyDomain;

    try {
      // Check if store exists
      let store = await db.getStore(shopDomain);
      
      if (!store) {
        // Create new store
        const storeData: StoreData = {
          shopDomain,
          name: storeInfo.name,
          myshopifyDomain: storeInfo.myshopifyDomain,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const storeId = await db.createStore(storeData);
        console.log(`✅ Store synced (created): ${shopDomain} -> ${storeId}`);
        return storeId;
      } else {
        // Update existing store
        await db.updateStore(shopDomain, {
          name: storeInfo.name,
          updatedAt: new Date(),
        });
        console.log(`✅ Store synced (updated): ${shopDomain}`);
        return store.id;
      }
    } catch (error) {
      console.error('❌ Error syncing store:', error);
      throw error;
    }
  }

  async getStore(shopDomain: string) {
    const db = await this.getDB();
    try {
      const store = await db.getStore(shopDomain);
      return store;
    } catch (error) {
      console.error(`❌ Error fetching store: ${shopDomain}`, error);
      throw error;
    }
  }

  async updateStore(shopDomain: string, updates: Partial<StoreData>) {
    const db = await this.getDB();
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };
      
      console.log(`📝 [Database] Updating store ${shopDomain} with:`, JSON.stringify(updateData, null, 2));
      
      await db.updateStore(shopDomain, updateData);
      console.log(`✅ Store updated: ${shopDomain}`);
      
      // Verify the update by reading back
      const verifyData = await db.getStore(shopDomain);
      console.log(`✅ [Database] Verification - store data after update:`, JSON.stringify(verifyData, null, 2));
    } catch (error) {
      console.error(`❌ Error updating store: ${shopDomain}`, error);
      throw error;
    }
  }

  // Product operations
  async syncProductFromShopify(shopifyProduct: any, shopDomain: string) {
    const db = await this.getDB();

    try {
      const variant = shopifyProduct.variants?.edges?.[0]?.node;
      
      const productData: ProductData = {
        shopifyProductId: shopifyProduct.id,
        title: shopifyProduct.title,
        handle: shopifyProduct.handle,
        status: shopifyProduct.status,
        price: variant?.price || '',
        sku: variant?.sku || '',
        shopDomain,
        createdAt: new Date(shopifyProduct.createdAt),
        updatedAt: new Date(shopifyProduct.updatedAt || shopifyProduct.createdAt),
      };

      // Check if product already exists
      const existingProducts = await this.getProductsByShopifyId(shopifyProduct.id);
      
      if (existingProducts.length > 0) {
        // Update existing product
        const existingProduct = existingProducts[0];
        await db.updateProduct(existingProduct.id!, {
          title: productData.title,
          handle: productData.handle,
          status: productData.status,
          price: productData.price,
          sku: productData.sku,
          updatedAt: productData.updatedAt,
        });
        console.log(`✅ Product synced (updated): ${productData.title}`);
        return existingProduct.id;
      } else {
        // Create new product
        const productId = await db.createProduct(productData);
        console.log(`✅ Product synced (created): ${productData.title} -> ${productId}`);
        return productId;
      }
    } catch (error) {
      console.error('❌ Error syncing product:', error);
      throw error;
    }
  }

  async getProductsByShopifyId(shopifyProductId: string): Promise<ProductData[]> {
    const db = await this.getDB();
    
    try {
      // For now, get all products and filter (could be optimized per database)
      const products = await db.getProducts(1000); // Get more products to search through
      return products.filter((p: ProductData) => p.shopifyProductId === shopifyProductId);
    } catch (error) {
      console.error('❌ Error getting products by Shopify ID:', error);
      return [];
    }
  }

  async getStoreProducts(shopDomain: string, limit: number = 10): Promise<ProductData[]> {
    const db = await this.getDB();
    
    try {
      // Check if database has shop-specific method
      if (db.getProductsByShop) {
        return await db.getProductsByShop(shopDomain, limit);
      } else {
        // Fallback: get all and filter
        const products = await db.getProducts(1000);
        return products.filter((p: ProductData) => p.shopDomain === shopDomain).slice(0, limit);
      }
    } catch (error) {
      console.error('❌ Error getting store products:', error);
      return [];
    }
  }

  async searchProducts(searchTerm: string, shopDomain?: string): Promise<ProductData[]> {
    const db = await this.getDB();
    
    try {
      if (db.searchProducts) {
        return await db.searchProducts(searchTerm, shopDomain);
      } else {
        // Fallback: basic search
        const products = await db.getProducts(1000);
        return products.filter((p: ProductData) => {
          const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.handle.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesShop = !shopDomain || p.shopDomain === shopDomain;
          return matchesSearch && matchesShop;
        });
      }
    } catch (error) {
      console.error('❌ Error searching products:', error);
      return [];
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    const db = await this.getDB();
    
    try {
      await db.deleteProduct(productId);
      console.log(`✅ Product deleted: ${productId}`);
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      throw error;
    }
  }

  // Database info
  async getDatabaseInfo() {
    const db = await this.getDB();
    return {
      provider: db.constructor.name,
      isConnected: !!db,
    };
  }
}

// Export singleton instance
export const appDatabase = new AppDatabaseService();
