import { type DatabaseInterface, type ProductData, type StoreData } from './database.interface';
import prisma from '../db.server';

export class PrismaDatabase implements DatabaseInterface {
  // Product operations
  async createProduct(product: ProductData): Promise<string> {
    try {
      const result = await prisma.product.create({
        data: {
          shopifyProductId: product.shopifyProductId,
          title: product.title,
          handle: product.handle,
          status: product.status,
          price: product.price,
          sku: product.sku,
          shopDomain: product.shopDomain,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      });
      
      console.log('🗄️ Product created in Prisma:', result.id);
      return result.id;
    } catch (error) {
      console.error('❌ Error creating product in Prisma:', error);
      throw error;
    }
  }

  async getProducts(limit: number = 10): Promise<ProductData[]> {
    try {
      const products = await prisma.product.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      
      console.log(`🗄️ Retrieved ${products.length} products from Prisma`);
      return products.map(this.mapPrismaProduct);
    } catch (error) {
      console.error('❌ Error getting products from Prisma:', error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<ProductData | null> {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
      });
      
      return product ? this.mapPrismaProduct(product) : null;
    } catch (error) {
      console.error('❌ Error getting product by ID from Prisma:', error);
      throw error;
    }
  }

  async updateProduct(id: string, updates: Partial<ProductData>): Promise<void> {
    try {
      await prisma.product.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });
      
      console.log('🗄️ Product updated in Prisma:', id);
    } catch (error) {
      console.error('❌ Error updating product in Prisma:', error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await prisma.product.delete({
        where: { id },
      });
      
      console.log('🗄️ Product deleted from Prisma:', id);
    } catch (error) {
      console.error('❌ Error deleting product from Prisma:', error);
      throw error;
    }
  }

  // Store operations
  async createStore(store: StoreData): Promise<string> {
    try {
      const result = await prisma.store.create({
        data: {
          shopDomain: store.shopDomain,
          name: store.name,
          myshopifyDomain: store.myshopifyDomain,
          createdAt: store.createdAt,
          updatedAt: store.updatedAt,
        },
      });
      
      console.log('🗄️ Store created in Prisma:', result.id);
      return result.id;
    } catch (error) {
      console.error('❌ Error creating store in Prisma:', error);
      throw error;
    }
  }

  async getStore(shopDomain: string): Promise<StoreData | null> {
    try {
      const store = await prisma.store.findUnique({
        where: { shopDomain },
      });
      
      return store ? this.mapPrismaStore(store) : null;
    } catch (error) {
      console.error('❌ Error getting store from Prisma:', error);
      throw error;
    }
  }

  async updateStore(shopDomain: string, updates: Partial<StoreData>): Promise<void> {
    try {
      await prisma.store.update({
        where: { shopDomain },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });
      
      console.log('🗄️ Store updated in Prisma:', shopDomain);
    } catch (error) {
      console.error('❌ Error updating store in Prisma:', error);
      throw error;
    }
  }

  // Helper methods
  private mapPrismaProduct(product: any): ProductData {
    return {
      id: product.id,
      shopifyProductId: product.shopifyProductId,
      title: product.title,
      handle: product.handle,
      status: product.status,
      price: product.price,
      sku: product.sku,
      shopDomain: product.shopDomain,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private mapPrismaStore(store: any): StoreData {
    return {
      id: store.id,
      shopDomain: store.shopDomain,
      name: store.name,
      myshopifyDomain: store.myshopifyDomain,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
    };
  }

  // Prisma-specific methods
  async getProductsByShop(shopDomain: string, limit: number = 10): Promise<ProductData[]> {
    try {
      const products = await prisma.product.findMany({
        where: { shopDomain },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      
      return products.map(this.mapPrismaProduct);
    } catch (error) {
      console.error('❌ Error getting products by shop from Prisma:', error);
      throw error;
    }
  }

  async searchProducts(searchTerm: string, shopDomain?: string): Promise<ProductData[]> {
    try {
      const whereClause: any = {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { handle: { contains: searchTerm, mode: 'insensitive' } },
        ],
      };

      if (shopDomain) {
        whereClause.shopDomain = shopDomain;
      }

      const products = await prisma.product.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });
      
      return products.map(this.mapPrismaProduct);
    } catch (error) {
      console.error('❌ Error searching products in Prisma:', error);
      throw error;
    }
  }
}
