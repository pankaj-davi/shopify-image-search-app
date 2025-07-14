#!/usr/bin/env node
/**
 * Database Seeding Script
 * Seeds the database with sample data for testing
 */

import { getDatabase } from '../app/services/database.interface.js';

const sampleStores = [
  {
    shopDomain: 'demo-store.myshopify.com',
    name: 'Demo Store',
    myshopifyDomain: 'demo-store.myshopify.com',
  },
  {
    shopDomain: 'test-shop.myshopify.com',
    name: 'Test Shop',
    myshopifyDomain: 'test-shop.myshopify.com',
  }
];

const sampleProducts = [
  {
    shopifyProductId: '12345',
    title: 'Sample Product 1',
    handle: 'sample-product-1',
    status: 'active',
    price: '29.99',
    sku: 'SP001',
    shopDomain: 'demo-store.myshopify.com',
  },
  {
    shopifyProductId: '67890',
    title: 'Sample Product 2',
    handle: 'sample-product-2',
    status: 'active',
    price: '49.99',
    sku: 'SP002',
    shopDomain: 'demo-store.myshopify.com',
  },
  {
    shopifyProductId: '11111',
    title: 'Test Product',
    handle: 'test-product',
    status: 'draft',
    price: '19.99',
    sku: 'TP001',
    shopDomain: 'test-shop.myshopify.com',
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    const db = await getDatabase();
    
    // Seed stores
    console.log('🏪 Seeding stores...');
    for (const store of sampleStores) {
      try {
        await db.createStore({
          ...store,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`✅ Store created: ${store.name}`);
      } catch (error) {
        if (error.message.includes('already exists') || error.code === 'ALREADY_EXISTS') {
          console.log(`⚠️ Store already exists: ${store.name}`);
        } else {
          console.error(`❌ Error creating store ${store.name}:`, error.message);
        }
      }
    }
    
    // Seed products
    console.log('📦 Seeding products...');
    for (const product of sampleProducts) {
      try {
        await db.createProduct({
          ...product,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`✅ Product created: ${product.title}`);
      } catch (error) {
        if (error.message.includes('already exists') || error.code === 'ALREADY_EXISTS') {
          console.log(`⚠️ Product already exists: ${product.title}`);
        } else {
          console.error(`❌ Error creating product ${product.title}:`, error.message);
        }
      }
    }
    
    console.log('🎉 Database seeding completed successfully!');
    
    // Verify seeded data
    console.log('\n📊 Verifying seeded data...');
    const stores = await db.getStores?.() || [];
    const products = await db.getProducts?.(50) || [];
    
    console.log(`📈 Total stores: ${stores.length || 'N/A'}`);
    console.log(`📈 Total products: ${products.length || 'N/A'}`);
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export { seedDatabase };
