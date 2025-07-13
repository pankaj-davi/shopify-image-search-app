import { type DatabaseInterface, type ProductData, type StoreData } from './database.interface';

export class SupabaseDatabase implements DatabaseInterface {
  constructor() {
    console.log('🗂️ Supabase database initialized (placeholder)');
  }

  async createProduct(product: ProductData): Promise<string> {
    console.log('🗂️ Supabase createProduct called (not implemented)');
    throw new Error('Supabase implementation not yet available. Please switch to Firebase or Prisma.');
  }

  async getProducts(limit?: number): Promise<ProductData[]> {
    console.log('🗂️ Supabase getProducts called (not implemented)');
    throw new Error('Supabase implementation not yet available. Please switch to Firebase or Prisma.');
  }

  async getProductById(id: string): Promise<ProductData | null> {
    console.log('🗂️ Supabase getProductById called (not implemented)');
    throw new Error('Supabase implementation not yet available. Please switch to Firebase or Prisma.');
  }

  async updateProduct(id: string, updates: Partial<ProductData>): Promise<void> {
    console.log('🗂️ Supabase updateProduct called (not implemented)');
    throw new Error('Supabase implementation not yet available. Please switch to Firebase or Prisma.');
  }

  async deleteProduct(id: string): Promise<void> {
    console.log('🗂️ Supabase deleteProduct called (not implemented)');
    throw new Error('Supabase implementation not yet available. Please switch to Firebase or Prisma.');
  }

  async createStore(store: StoreData): Promise<string> {
    console.log('🗂️ Supabase createStore called (not implemented)');
    throw new Error('Supabase implementation not yet available. Please switch to Firebase or Prisma.');
  }

  async getStore(shopDomain: string): Promise<StoreData | null> {
    console.log('🗂️ Supabase getStore called (not implemented)');
    throw new Error('Supabase implementation not yet available. Please switch to Firebase or Prisma.');
  }

  async updateStore(shopDomain: string, updates: Partial<StoreData>): Promise<void> {
    console.log('🗂️ Supabase updateStore called (not implemented)');
    throw new Error('Supabase implementation not yet available. Please switch to Firebase or Prisma.');
  }
}
