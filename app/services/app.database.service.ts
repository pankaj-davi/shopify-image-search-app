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
          
          // Enhanced store details
          description: storeInfo.description,
          url: storeInfo.url,
          primaryDomain: storeInfo.primaryDomain,
          contactEmail: storeInfo.contactEmail,
          ianaTimezone: storeInfo.ianaTimezone,
          weightUnit: storeInfo.weightUnit,
          unitSystem: storeInfo.unitSystem,
          enabledPresentmentCurrencies: storeInfo.enabledPresentmentCurrencies,
          billingAddress: storeInfo.billingAddress,
          checkoutApiSupported: storeInfo.checkoutApiSupported,
          setupRequired: storeInfo.setupRequired,
          taxesIncluded: storeInfo.taxesIncluded,
          taxShipping: storeInfo.taxShipping,
          marketingSmsConsentEnabledAtCheckout: storeInfo.marketingSmsConsentEnabledAtCheckout,
          transactionalSmsDisabled: storeInfo.transactionalSmsDisabled,
          features: storeInfo.features,
          resourceLimits: storeInfo.resourceLimits,
          
          createdAt: storeInfo.createdAt && typeof storeInfo.createdAt === 'string' ? new Date(storeInfo.createdAt) : new Date(),
          updatedAt: storeInfo.updatedAt && typeof storeInfo.updatedAt === 'string' ? new Date(storeInfo.updatedAt) : (storeInfo.createdAt && typeof storeInfo.createdAt === 'string' ? new Date(storeInfo.createdAt) : new Date()),
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
  // NOTE: To capture all images, ensure your Shopify GraphQL query includes:
  // - featuredMedia { mediaContentType, image { url, altText } }
  // - media(first: 10) { edges { node { mediaContentType, image { url, altText, width, height } } } }
  // - variants(first: 10) { edges { node { id, price, sku, title, image { url, altText, width, height } } } }
  async syncStoreWithProducts(storeInfo: any, shopifyProducts: any[]): Promise<void> {
    const db = await this.getDB();
    const shopDomain = storeInfo.myshopifyDomain;

    try {
      // Prepare store data with all enhanced fields
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
        
        // Enhanced store details
        description: storeInfo.description,
        url: storeInfo.url,
        primaryDomain: storeInfo.primaryDomain,
        contactEmail: storeInfo.contactEmail,
        ianaTimezone: storeInfo.ianaTimezone,
        weightUnit: storeInfo.weightUnit,
        unitSystem: storeInfo.unitSystem,
        enabledPresentmentCurrencies: storeInfo.enabledPresentmentCurrencies,
        billingAddress: storeInfo.billingAddress,
        checkoutApiSupported: storeInfo.checkoutApiSupported,
        setupRequired: storeInfo.setupRequired,
        taxesIncluded: storeInfo.taxesIncluded,
        taxShipping: storeInfo.taxShipping,
        marketingSmsConsentEnabledAtCheckout: storeInfo.marketingSmsConsentEnabledAtCheckout,
        transactionalSmsDisabled: storeInfo.transactionalSmsDisabled,
        features: storeInfo.features,
        resourceLimits: storeInfo.resourceLimits,
        
        createdAt: storeInfo.createdAt && typeof storeInfo.createdAt === 'string' ? new Date(storeInfo.createdAt) : new Date(),
        updatedAt: storeInfo.updatedAt && typeof storeInfo.updatedAt === 'string' ? new Date(storeInfo.updatedAt) : (storeInfo.createdAt && typeof storeInfo.createdAt === 'string' ? new Date(storeInfo.createdAt) : new Date()),
      };

      // Prepare products data
      console.log(`🔍 Raw Shopify product data structure:`, JSON.stringify(shopifyProducts.slice(0, 1), null, 2));
      const products: ProductData[] = shopifyProducts.map(product => {
        const variant = product.variants?.edges?.[0]?.node;
        
        // Extract all featured media information
        const featuredMedia = product.featuredMedia ? {
          mediaContentType: product.featuredMedia.mediaContentType,
          image: product.featuredMedia.image ? {
            url: product.featuredMedia.image.url,
            altText: product.featuredMedia.image.altText || null,
          } : null,
        } : null;

        // Extract all media (images, videos, etc.) - this replaces the deprecated images field
        const allMedia = product.media?.edges?.map((edge: any) => ({
          mediaContentType: edge.node.mediaContentType,
          image: edge.node.image ? {
            url: edge.node.image.url,
            altText: edge.node.image.altText || null,
            width: edge.node.image.width || null,
            height: edge.node.image.height || null,
          } : null,
        })) || [];

        // Debug logging for image data
        if (product.title.includes('Example T-Shirt')) {
          console.log(`🖼️ Image debug for ${product.title}:`, {
            featuredMedia: JSON.stringify(featuredMedia, null, 2),
            mediaCount: allMedia.length,
            allMedia: JSON.stringify(allMedia, null, 2),
            variantImages: product.variants?.edges?.map((v: any) => v.node.image).filter(Boolean)
          });
        }

        // Extract all variants with complete information including images
        const allVariants = product.variants?.edges?.map((edge: any) => ({
          id: edge.node.id,
          price: edge.node.price,
          sku: edge.node.sku || null,
          title: edge.node.title || null,
          availableForSale: edge.node.availableForSale || false,
          image: edge.node.image ? {
            url: edge.node.image.url,
            altText: edge.node.image.altText || null,
            width: edge.node.image.width || null,
            height: edge.node.image.height || null,
          } : null,
        })) || [];

        // Extract all metafields with complete information
        const allMetafields = product.metafields?.edges?.map((edge: any) => ({
          namespace: edge.node.namespace,
          key: edge.node.key,
          value: edge.node.value,
          type: edge.node.type,
          definition: edge.node.definition ? {
            description: edge.node.definition.description || null,
          } : null,
        })) || [];

        // Extract all options with complete information
        const allOptions = product.options?.map((option: any) => ({
          name: option.name,
          values: option.values || [],
        })) || [];

        // Extract complete price range information
        const priceRange = product.priceRangeV2 ? {
          minVariantPrice: {
            amount: product.priceRangeV2.minVariantPrice.amount,
            currencyCode: product.priceRangeV2.minVariantPrice.currencyCode,
          },
          maxVariantPrice: {
            amount: product.priceRangeV2.maxVariantPrice.amount,
            currencyCode: product.priceRangeV2.maxVariantPrice.currencyCode,
          },
        } : null;

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
          sku: variant?.sku || null,
          priceRange,
          featuredMedia,
          media: allMedia,
          options: allOptions,
          variants: allVariants,
          metafields: allMetafields,
          shopDomain,
          createdAt: product.createdAt && typeof product.createdAt === 'string' ? new Date(product.createdAt) : new Date(),
          updatedAt: product.updatedAt && typeof product.updatedAt === 'string' ? new Date(product.updatedAt) : (product.createdAt && typeof product.createdAt === 'string' ? new Date(product.createdAt) : new Date()),
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

  async recordStoreEvent(shopDomain: string, eventType: string, eventData: any): Promise<void> {
    try {
      const event = {
        shopDomain,
        eventType,
        eventData,
        timestamp: new Date().toISOString()
      };
      
      console.log(`📊 [Database] Recording store event:`, event);
      
      // If your database supports event logging, implement it here
      // For now, just log the event
      // const db = await this.getDB();
      // await db.recordEvent?.(event);
      
    } catch (error) {
      console.error('[Database] Error recording store event:', error);
      // Don't throw - this is for analytics only
    }
  }

  // Product operations
  async syncProductFromShopify(shopifyProduct: any, shopDomain: string) {
    const db = await this.getDB();

    try {
      const variant = shopifyProduct.variants?.edges?.[0]?.node;
      console.log(`📝variantDDDDDDDDDDDDD Shopify: ${JSON.stringify(variant, null, 2)}`);
      // Extract all featured media information
      const featuredMedia = shopifyProduct.featuredMedia ? {
        mediaContentType: shopifyProduct.featuredMedia.mediaContentType,
        image: shopifyProduct.featuredMedia.image ? {
          url: shopifyProduct.featuredMedia.image.url,
          altText: shopifyProduct.featuredMedia.image.altText || null,
        } : null,
      } : null;

      // Extract all media (images, videos, etc.) - this replaces the deprecated images field
      const allMedia = shopifyProduct.media?.edges?.map((edge: any) => ({
        mediaContentType: edge.node.mediaContentType,
        image: edge.node.image ? {
          url: edge.node.image.url,
          altText: edge.node.image.altText || null,
          width: edge.node.image.width || null,
          height: edge.node.image.height || null,
        } : null,
      })) || [];

      // Extract all variants with complete information including images
      const allVariants = shopifyProduct.variants?.edges?.map((edge: any) => ({
        id: edge.node.id,
        price: edge.node.price,
        sku: edge.node.sku || null,
        title: edge.node.title || null,
        availableForSale: edge.node.availableForSale || false,
        image: edge.node.image ? {
          url: edge.node.image.url,
          altText: edge.node.image.altText || null,
          width: edge.node.image.width || null,
          height: edge.node.image.height || null,
        } : null,
      })) || [];

      // Extract all metafields with complete information
      const allMetafields = shopifyProduct.metafields?.edges?.map((edge: any) => ({
        namespace: edge.node.namespace,
        key: edge.node.key,
        value: edge.node.value,
        type: edge.node.type,
        definition: edge.node.definition ? {
          description: edge.node.definition.description || null,
        } : null,
      })) || [];

      // Extract all options with complete information
      const allOptions = shopifyProduct.options?.map((option: any) => ({
        name: option.name,
        values: option.values || [],
      })) || [];

      // Extract complete price range information
      const priceRange = shopifyProduct.priceRangeV2 ? {
        minVariantPrice: {
          amount: shopifyProduct.priceRangeV2.minVariantPrice.amount,
          currencyCode: shopifyProduct.priceRangeV2.minVariantPrice.currencyCode,
        },
        maxVariantPrice: {
          amount: shopifyProduct.priceRangeV2.maxVariantPrice.amount,
          currencyCode: shopifyProduct.priceRangeV2.maxVariantPrice.currencyCode,
        },
      } : null;
      
      const productData: ProductData = {
        shopifyProductId: shopifyProduct.id,
        title: shopifyProduct.title,
        handle: shopifyProduct.handle,
        status: shopifyProduct.status,
        description: shopifyProduct.description || null,
        vendor: shopifyProduct.vendor || null,
        productType: shopifyProduct.productType || null,
        tags: shopifyProduct.tags || [],
        onlineStoreUrl: shopifyProduct.onlineStoreUrl || null,
        totalInventory: shopifyProduct.totalInventory || 0,
        price: variant?.price || '',
        sku: variant?.sku || null,
        priceRange,
        featuredMedia,
        media: allMedia,
        options: allOptions,
        variants: allVariants,
        metafields: allMetafields,
        shopDomain,
        createdAt: shopifyProduct.createdAt && typeof shopifyProduct.createdAt === 'string' ? new Date(shopifyProduct.createdAt) : new Date(),
        updatedAt: shopifyProduct.updatedAt && typeof shopifyProduct.updatedAt === 'string' ? new Date(shopifyProduct.updatedAt) : (shopifyProduct.createdAt && typeof shopifyProduct.createdAt === 'string' ? new Date(shopifyProduct.createdAt) : new Date()),
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
          description: productData.description,
          vendor: productData.vendor,
          productType: productData.productType,
          tags: productData.tags,
          onlineStoreUrl: productData.onlineStoreUrl,
          totalInventory: productData.totalInventory,
          price: productData.price,
          sku: productData.sku,
          priceRange: productData.priceRange,
          featuredMedia: productData.featuredMedia,
          media: productData.media,
          options: productData.options,
          variants: productData.variants,
          metafields: productData.metafields,
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
