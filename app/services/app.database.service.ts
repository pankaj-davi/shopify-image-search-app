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
  async syncStore(storeInfo: any): Promise<string> {
    const db = await this.getDB();
    const shopDomain = storeInfo.myshopifyDomain;

    try {
      // Check if store exists
      const store = await db.getStore(shopDomain);
      
      if (!store) {
        // Create new store with enhanced data
        const storeData: StoreData = {
          shopDomain,
          name: storeInfo.name,
          myshopifyDomain: storeInfo.myshopifyDomain,
          email: storeInfo.email,
          currencyCode: storeInfo.currencyCode,
          timezoneAbbreviation: storeInfo.timezoneAbbreviation,
          timezoneOffset: storeInfo.timezoneOffset,
          timezoneOffsetMinutes: storeInfo.timezoneOffsetMinutes,
          plan: storeInfo.plan,
          createdAt: new Date(storeInfo.createdAt),
          updatedAt: new Date(storeInfo.updatedAt || storeInfo.createdAt),
        };
        
        const storeId = await db.createStore(storeData);
        console.log(`✅ Store synced (created): ${shopDomain} -> ${storeId}`);
        return storeId;
      } else {
        // Update existing store with enhanced data
        await db.updateStore(shopDomain, {
          name: storeInfo.name,
          email: storeInfo.email,
          currencyCode: storeInfo.currencyCode,
          timezoneAbbreviation: storeInfo.timezoneAbbreviation,
          timezoneOffset: storeInfo.timezoneOffset,
          timezoneOffsetMinutes: storeInfo.timezoneOffsetMinutes,
          plan: storeInfo.plan,
          updatedAt: new Date(storeInfo.updatedAt || storeInfo.createdAt),
        });
        console.log(`✅ Store synced (updated): ${shopDomain}`);
        return store.id!;
      }
    } catch (error) {
      console.error('❌ Error syncing store:', error);
      throw error;
    }
  }

  // Enhanced method to sync store with products in one operation
  async syncStoreWithProducts(storeInfo: any, shopifyProducts: any[]): Promise<void> {
    const db = await this.getDB();
    const shopDomain = storeInfo.myshopifyDomain;

    try {
      // Prepare store data
      const storeData: StoreData = {
        shopDomain,
        name: storeInfo.name,
        myshopifyDomain: storeInfo.myshopifyDomain,
        email: storeInfo.email,
        currencyCode: storeInfo.currencyCode,
        timezoneAbbreviation: storeInfo.timezoneAbbreviation,
        timezoneOffset: storeInfo.timezoneOffset,
        timezoneOffsetMinutes: storeInfo.timezoneOffsetMinutes,
        plan: storeInfo.plan,
        createdAt: new Date(storeInfo.createdAt),
        updatedAt: new Date(storeInfo.updatedAt || storeInfo.createdAt),
      };

      // Prepare products data
      const products: ProductData[] = shopifyProducts.map(product => {
        const variant = product.variants?.edges?.[0]?.node;
        
        return {
          shopifyProductId: product.id,
          title: product.title,
          handle: product.handle,
          status: product.status,
          description: product.description || null,
          vendor: product.vendor || null,
          productType: product.productType || null,
          tags: product.tags || [],
          onlineStoreUrl: product.onlineStoreUrl || null,
          totalInventory: product.totalInventory || 0,
          price: variant?.price || '',
          sku: variant?.sku || '',
          priceRange: product.priceRangeV2 ? {
            minVariantPrice: product.priceRangeV2.minVariantPrice,
            maxVariantPrice: product.priceRangeV2.maxVariantPrice,
          } : null,
          featuredImage: product.featuredMedia?.image ? {
            url: product.featuredMedia.image.url,
            altText: product.featuredMedia.image.altText || null,
          } : null,
          options: product.options || [],
          variants: product.variants?.edges?.map((edge: any) => ({
            price: edge.node.price,
            sku: edge.node.sku || '',
          })) || [],
          metafields: product.metafields?.edges?.map((edge: any) => ({
            namespace: edge.node.namespace,
            key: edge.node.key,
            value: edge.node.value,
            type: edge.node.type,
            description: edge.node.definition?.description || null,
          })) || [],
          shopDomain,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt || product.createdAt),
        };
      });

      // Use the new atomic sync method
      await db.syncStoreWithProducts(storeData, products);
      console.log(`✅ Store and products synced atomically: ${shopDomain} (${products.length} products)`);
    } catch (error) {
      console.error('❌ Error syncing store with products:', error);
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

  // Enhanced method to get store with associated products
  async getStoreWithProducts(shopDomain: string, productLimit: number = 25) {
    const db = await this.getDB();
    try {
      const result = await db.getStoreWithProducts(shopDomain, productLimit);
      return result;
    } catch (error) {
      console.error(`❌ Error fetching store with products: ${shopDomain}`, error);
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
