# Firebase Best Practices for Store and Product Data

## Overview

This document outlines the best practices implemented for storing Shopify store and product data in Firebase Firestore, ensuring proper data relationships, consistency, and performance.

## Data Structure

### 1. Store Data Enhancement

The store data structure has been enhanced to capture comprehensive Shopify store information:

```typescript
interface StoreData {
  shopDomain: string;           // Primary identifier
  name: string;                 // Store name
  myshopifyDomain: string;      // Shopify domain
  email?: string;               // Store email
  currencyCode?: string;        // Store currency
  timezoneAbbreviation?: string; // Timezone
  timezoneOffset?: string;      // Timezone offset
  timezoneOffsetMinutes?: number; // Timezone offset in minutes
  plan?: {                      // Shopify plan details
    partnerDevelopment?: boolean;
    shopifyPlus?: boolean;
  };
  productCount?: number;        // Cached product count
  lastSyncAt?: Date;           // Last sync timestamp
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Product Data Enhancement

Product data now includes comprehensive Shopify product information:

```typescript
interface ProductData {
  shopifyProductId: string;     // Shopify product ID
  title: string;                // Product title
  handle: string;               // Product handle
  status: string;               // Product status
  description?: string;         // Product description
  vendor?: string;              // Product vendor
  productType?: string;         // Product type
  tags?: string[];              // Product tags
  onlineStoreUrl?: string;      // Store URL
  totalInventory?: number;      // Total inventory
  priceRange?: {                // Price range
    minVariantPrice: { amount: string; currencyCode: string };
    maxVariantPrice: { amount: string; currencyCode: string };
  };
  featuredImage?: {             // Featured image
    url: string;
    altText?: string;
  };
  options?: Array<{ name: string; values: string[] }>; // Product options
  variants?: Array<{ price: string; sku: string }>;    // Product variants
  metafields?: Array<{          // Product metafields
    namespace: string;
    key: string;
    value: string;
    type: string;
    description?: string;
  }>;
  shopDomain: string;           // Store association
  createdAt: Date;
  updatedAt: Date;
}
```

## Firebase Collection Structure

### Subcollections Approach (Recommended)
```
stores/{shopDomain}                    # Store documents
├── shopDomain: string                 # Primary key
├── name: string
├── email: string
├── currencyCode: string
├── plan: object
├── productCount: number               # Cached count
├── lastSyncAt: timestamp
├── createdAt: timestamp
├── updatedAt: timestamp
└── products/{productId}               # Products subcollection
    ├── shopifyProductId: string
    ├── title: string
    ├── description: string
    ├── priceRange: object
    ├── featuredImage: object
    ├── variants: array
    ├── metafields: array
    ├── createdAt: timestamp
    └── updatedAt: timestamp
```

### Benefits of Subcollections
✅ **Scalability**: No document size limits (1MB per document)  
✅ **Performance**: Query products independently  
✅ **Atomic Updates**: Update individual products safely  
✅ **Efficient Queries**: Paginate, filter, and sort products  
✅ **Better Indexing**: Firestore optimizes subcollection indexes  
✅ **Collection Group Queries**: Search across all stores' products  

### Alternative: Embedded Arrays (Not Recommended)
```typescript
// ❌ Embedded approach - hits size limits quickly
{
  shopDomain: "example.myshopify.com",
  name: "Example Store",
  products: [
    { shopifyProductId: "123", title: "Product 1", ... }, // Will hit 1MB limit
    { shopifyProductId: "456", title: "Product 2", ... },
  ]
}
```

### Collection Group Queries
```typescript
// Search across ALL stores' products
const collectionGroup = this.firestore.collectionGroup('products');
const snapshot = await collectionGroup
  .where('status', '==', 'ACTIVE')
  .orderBy('createdAt', 'desc')
  .limit(50)
  .get();
```

## Best Practices Implemented

### 1. Atomic Operations
```typescript
// All store and product updates happen atomically
await db.syncStoreWithProducts(storeData, products);
```

### 2. Batch Operations
```typescript
// Products are updated in batches for better performance
const batchSize = 400; // Firebase limit consideration
for (let i = 0; i < products.length; i += batchSize) {
  const batch = this.firestore.batch();
  // ... batch operations
  await batch.commit();
}
```

### 3. Transaction Safety
```typescript
// Store updates use transactions for consistency
await this.firestore.runTransaction(async (transaction) => {
  // ... transactional operations
});
```

### 4. Efficient Querying
```typescript
// Optimized queries with proper indexing
const query = this.firestore
  .collection('products')
  .where('shopDomain', '==', shopDomain)
  .orderBy('createdAt', 'desc')
  .limit(limit);
```

### 5. Data Consistency
- Products are linked to stores via `shopDomain` field
- Upsert operations ensure data consistency
- Timestamps are managed server-side using `FieldValue.serverTimestamp()`

## Performance Optimizations

### 1. Indexing Strategy
Create these composite indexes in Firebase Console:
- `products` collection: `shopDomain ASC, createdAt DESC`
- `products` collection: `shopDomain ASC, status ASC, updatedAt DESC`

### 2. Batch Size Limits
- Firebase batch operations limited to 500 operations
- Using 400 operations per batch for safety margin

### 3. Query Limits
- Default product queries limited to 25 items
- Pagination should be implemented for larger datasets

## Usage Examples

### Sync Store with Products
```typescript
// Enhanced atomic sync
await appDatabase.syncStoreWithProducts(
  storeData.data.shop,
  storeData.data.products.edges.map(edge => edge.node)
);
```

### Get Store with Products
```typescript
// Get store and associated products in one call
const result = await appDatabase.getStoreWithProducts(shopDomain, 25);
if (result) {
  const { store, products } = result;
  // Use store and products data
}
```

### Batch Product Updates
```typescript
// Efficient batch updates
const updates = products.map(product => ({
  id: product.id,
  data: { status: 'active', updatedAt: new Date() }
}));
await db.batchUpdateProducts(updates);
```

## Migration Considerations

If migrating from existing data:
1. Update store documents with new fields
2. Ensure all products have proper `shopDomain` references
3. Create necessary Firebase indexes
4. Test query performance after migration

## Data Sanitization

### Handling Undefined Values

Firebase Firestore doesn't allow `undefined` values in documents. To handle this, we've implemented a data sanitization function:

```typescript
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
```

### Benefits
- **Removes undefined values**: Prevents Firebase validation errors
- **Preserves null values**: Maintains data structure integrity
- **Handles nested objects**: Recursively cleans complex data structures
- **Filters arrays**: Removes undefined elements from arrays

### Usage
All Firebase operations now use sanitization:
```typescript
const productData = sanitizeData({
  ...product,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
});
```

## Error Handling

- All database operations include comprehensive error handling
- Failed batch operations are logged with specific error details
- Transactional operations automatically rollback on failure

## Monitoring and Logging

- All operations are logged with appropriate log levels
- Store sync operations include timing and count information
- Error logs include context for debugging

This structure provides a robust, scalable foundation for managing Shopify store and product data in Firebase while maintaining data consistency and optimal performance.

## Common Issues and Solutions

### 1. Undefined Values Error
**Error**: `Cannot use "undefined" as a Firestore value`

**Solution**: Use the `sanitizeData()` function to remove undefined values before saving to Firebase.

```typescript
// ❌ This will cause an error if metafields contains undefined values
await this.firestore.collection('products').add(product);

// ✅ This will work correctly
const sanitizedProduct = sanitizeData(product);
await this.firestore.collection('products').add(sanitizedProduct);
```

### 2. Batch Operation Limits
**Error**: Batch operations failing with large datasets

**Solution**: Process data in batches of 400 operations (safe limit under Firebase's 500 limit).

```typescript
const batchSize = 400;
for (let i = 0; i < products.length; i += batchSize) {
  const batch = this.firestore.batch();
  const productBatch = products.slice(i, i + batchSize);
  // ... process batch
  await batch.commit();
}
```

### 3. Shopify Data Inconsistencies
**Issue**: Missing or null values from Shopify API

**Solution**: Provide default values and null fallbacks:

```typescript
description: product.description || null,
tags: product.tags || [],
metafields: product.metafields?.edges?.map(...) || [],
```

### 4. Timestamp Handling
**Issue**: Error `data.updatedAt?.toDate is not a function`

**Solution**: Use the `safeToDate()` function to handle different timestamp formats:

```typescript
function safeToDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp && typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (typeof timestamp === 'string') return new Date(timestamp);
  return new Date();
}

// Usage in data retrieval
createdAt: safeToDate(data.createdAt),
updatedAt: safeToDate(data.updatedAt),
```

**Why this happens**: Firebase can return timestamps as:
- Firebase `Timestamp` objects (with `.toDate()` method)
- JavaScript `Date` objects (already converted)
- String timestamps (ISO format)
- `null` or `undefined` values

### 5. Transaction Limitations
**Issue**: Complex operations failing in transactions

**Solution**: Use transactions for critical operations, batches for bulk operations:

```typescript
// Use transactions for store updates
await this.firestore.runTransaction(async (transaction) => {
  // Critical store updates
});

// Use batches for product bulk operations
const batch = this.firestore.batch();
// Bulk product operations
await batch.commit();
```
