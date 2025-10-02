# Migration Guide: Moving to Subcollections

## Overview
This guide explains how to migrate from the flat collection structure to the new subcollections approach for better data organization and performance.

## Before: Flat Structure
```
collections/
├── stores/{shopDomain}
└── products/{productId}
    ├── shopDomain: "store-reference"
    └── ... product data
```

## After: Subcollections Structure
```
collections/
└── stores/{shopDomain}
    ├── ... store data
    └── products/{productId}  # Subcollection
        └── ... product data
```

## Benefits of Migration

### ✅ Improved Performance
- **Faster Queries**: Products are co-located with their store
- **Better Caching**: Related data is grouped together
- **Reduced Network Calls**: Can fetch store + products in optimized queries

### ✅ Better Data Organization
- **Logical Grouping**: Products naturally belong under their store
- **Easier Management**: Store deletion can cascade to products
- **Cleaner Architecture**: Reflects real-world relationships

### ✅ Enhanced Scalability
- **No Size Limits**: Unlike embedded arrays, subcollections scale infinitely
- **Efficient Indexing**: Firestore optimizes subcollection indexes
- **Collection Group Queries**: Can still query across all products

## Migration Steps

### Step 1: Update Database Interface
The interface remains the same - no breaking changes to your application code.

### Step 2: New Data Structure
```typescript
// Store Document
stores/pixel-dress-store.myshopify.com
├── shopDomain: "pixel-dress-store.myshopify.com"
├── name: "Pixel Dress Store"
├── email: "store@example.com"
├── productCount: 25
└── products/                    # Subcollection
    ├── product-123/
    │   ├── shopifyProductId: "gid://shopify/Product/123"
    │   ├── title: "Awesome Product"
    │   └── ... other product fields
    └── product-456/
        ├── shopifyProductId: "gid://shopify/Product/456"
        └── ... other product fields
```

### Step 3: Automatic Migration
The new sync process will automatically:
1. ✅ Create stores in the `stores` collection
2. ✅ Create products as subcollections under their store
3. ✅ Handle existing data gracefully

### Step 4: Collection Group Queries
Search across all products from all stores:
```typescript
// Search all products across all stores
const products = await searchProducts("snowboard");

// Search products within a specific store
const storeProducts = await getProductsByShop("pixel-dress-store.myshopify.com");
```

## Query Examples

### Get Store with Products
```typescript
const result = await getStoreWithProducts("pixel-dress-store.myshopify.com", 25);
// Returns: { store: StoreData, products: ProductData[] }
```

### Search Products Globally
```typescript
const products = await searchProducts("snowboard");
// Searches across ALL stores using collection group query
```

### Get Products by Store
```typescript
const products = await getProductsByShop("pixel-dress-store.myshopify.com", 10);
// Gets products from specific store's subcollection
```

### Pagination Support
```typescript
// Get next page of products
const query = firestore
  .collection('stores')
  .doc(shopDomain)
  .collection('products')
  .orderBy('createdAt', 'desc')
  .startAfter(lastDocument)
  .limit(25);
```

## Performance Improvements

### Before (Flat Collections)
```typescript
// ❌ Required filtering by shopDomain
const products = await firestore
  .collection('products')
  .where('shopDomain', '==', shopDomain)
  .get();
// Issues: Index required, slower queries, more complex
```

### After (Subcollections)
```typescript
// ✅ Direct subcollection access
const products = await firestore
  .collection('stores')
  .doc(shopDomain)
  .collection('products')
  .get();
// Benefits: Faster, no indexes needed, better performance
```

## Firestore Rules Example

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Store access rules
    match /stores/{shopDomain} {
      allow read, write: if request.auth != null;
      
      // Product subcollection rules
      match /products/{productId} {
        allow read, write: if request.auth != null;
      }
    }
    
    // Collection group rule for global product search
    match /{path=**}/products/{productId} {
      allow read: if request.auth != null;
    }
  }
}
```

## Data Consistency

### Atomic Operations
```typescript
// Store and products are updated atomically
await syncStoreWithProducts(storeData, products);
```

### Transaction Safety
- Store updates use transactions for consistency
- Product batches ensure all products are synced
- Rollback protection for failed operations

## Monitoring and Debugging

### Success Indicators
- ✅ Products appear under `stores/{shopDomain}/products/`
- ✅ Collection group queries return results
- ✅ Store documents show correct `productCount`

### Common Issues
- Ensure proper authentication for subcollection access
- Check Firestore rules allow subcollection operations
- Verify collection group queries have proper indexes

## Rollback Plan

If issues occur, the system can revert to flat collections by:
1. Updating query methods to use `products` collection
2. Re-enabling `shopDomain` filtering
3. Maintaining data integrity during transition

## Conclusion

The subcollections approach provides:
- 🚀 **Better Performance**: Faster queries and better caching
- 📊 **Improved Organization**: Logical data grouping
- 🔍 **Enhanced Search**: Collection group queries
- 📈 **Future Scalability**: Unlimited growth potential

This migration enhances your app's architecture while maintaining full backward compatibility.
