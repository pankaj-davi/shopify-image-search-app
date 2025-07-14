import {
  type DatabaseInterface,
  type ProductData,
  type StoreData,
} from './database.interface';

export class SupabaseDatabase implements DatabaseInterface {
  constructor() {
    console.log('🗂️ Supabase database initialized (placeholder)');
  }

  async createProduct(_product: ProductData): Promise<string> {
    console.log('🗂️ Supabase createProduct called (not implemented)');
    throw new Error(
      'Supabase implementation not yet available. Please switch to Firebase or Prisma.'
    );
  }

  async getProducts(_limit?: number): Promise<ProductData[]> {
    console.log('🗂️ Supabase getProducts called (not implemented)');
    throw new Error(
      'Supabase implementation not yet available. Please switch to Firebase or Prisma.'
    );
  }

  async getProductById(_id: string): Promise<ProductData | null> {
    console.log('🗂️ Supabase getProductById called (not implemented)');
    throw new Error(
      'Supabase implementation not yet available. Please switch to Firebase or Prisma.'
    );
  }

  async updateProduct(
    _id: string,
    _updates: Partial<ProductData>
  ): Promise<void> {
    console.log('🗂️ Supabase updateProduct called (not implemented)');
    throw new Error(
      'Supabase implementation not yet available. Please switch to Firebase or Prisma.'
    );
  }

  async deleteProduct(_id: string): Promise<void> {
    console.log('🗂️ Supabase deleteProduct called (not implemented)');
    throw new Error(
      'Supabase implementation not yet available. Please switch to Firebase or Prisma.'
    );
  }

  async createStore(_store: StoreData): Promise<string> {
    console.log('🗂️ Supabase createStore called (not implemented)');
    throw new Error(
      'Supabase implementation not yet available. Please switch to Firebase or Prisma.'
    );
  }

  async getStore(_shopDomain: string): Promise<StoreData | null> {
    console.log('🗂️ Supabase getStore called (not implemented)');
    throw new Error(
      'Supabase implementation not yet available. Please switch to Firebase or Prisma.'
    );
  }

  async updateStore(
    _shopDomain: string,
    _updates: Partial<StoreData>
  ): Promise<void> {
    console.log('🗂️ Supabase updateStore called (not implemented)');
    throw new Error(
      'Supabase implementation not yet available. Please switch to Firebase or Prisma.'
    );
  }

  async deleteStore(_shopDomain: string): Promise<boolean> {
    console.log('🗂️ Supabase deleteStore called (not implemented)');
    throw new Error(
      'Supabase implementation not yet available. Please switch to Firebase or Prisma.'
    );
  }

  async recordStoreEvent(
    _shopDomain: string,
    _eventType: string,
    _eventData: Record<string, any>
  ): Promise<void> {
    console.log('🗂️ Supabase recordStoreEvent called (not implemented)');
    throw new Error(
      'Supabase implementation not yet available. Please switch to Firebase or Prisma.'
    );
  }

  async healthCheck(): Promise<boolean> {
    console.log('🗂️ Supabase healthCheck called (not implemented)');
    throw new Error(
      'Supabase implementation not yet available. Please switch to Firebase or Prisma.'
    );
  }
}
