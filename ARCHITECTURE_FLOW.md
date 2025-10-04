# 🏗️ Visual Search App - Complete Architecture Flow

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Initial App Installation](#initial-app-installation)
3. [Manual Product Sync (First Time)](#manual-product-sync-first-time)
4. [Real-time Webhooks (Ongoing Updates)](#real-time-webhooks-ongoing-updates)
5. [Visual Search Flow](#visual-search-flow)
6. [Data Storage Architecture](#data-storage-architecture)
7. [Technology Stack](#technology-stack)

---

## 🎯 System Overview

### Architecture Components:
- **Shopify App (Remix)**: Lightweight orchestrator and UI
- **Python Server (Flask)**: Handles all product operations and embeddings
- **Firestore**: Stores store metadata and sync jobs only (NO products)
- **Vector DB**: Stores product embeddings and product IDs
- **Shopify API**: Source of truth for all product data

### Key Principle:
> **No product duplication!** Product data is only stored in Shopify. Product IDs are stored in Vector DB alongside embeddings. Product details are fetched from Shopify API when needed.

---

## 📥 Initial App Installation

### Step 1: User Installs App from Shopify App Store

```
User clicks "Install App" in Shopify App Store
↓
Shopify redirects to app with installation URL
↓
app/routes/auth.$.tsx handles OAuth flow
↓
Shopify returns access token and shop info
```

### Step 2: Store Data Saved to Firestore

```
shopifyStoreLoader (app/utils/shopifyData.server.ts) runs:
↓
1. Checks if store exists in Firestore
   - If exists: Load existing store data
   - If new: Fetch store info from Shopify GraphQL API
↓
2. Fetch store details from Shopify:
   - Store name, domain, email
   - Plan details (Plus, Standard)
   - Store features, limits, billing info
↓
3. Get total product count from Shopify:
   query { productsCount { count } }
↓
4. Save to Firestore (app.database.service.ts):
   stores/{storeId}:
     - shopDomain
     - name, email
     - plan details
     - totalProductsInShopify
     - productCount: 0 (not synced yet)
     - createdAt, updatedAt
```

### Step 3: UI Shows Initial State

```
app/routes/app._index.tsx displays:
↓
✅ Store info loaded
✅ needsSync = true (no products synced)
✅ Shows: "Ready to Enable Visual Search"
✅ Displays: "Sync Store Products" button
```

**Firestore after installation:**
```
stores/
  └── {storeId}/
      ├── shopDomain: "mystore.myshopify.com"
      ├── name: "My Store"
      ├── productCount: 0
      └── totalProductsInShopify: 1500
```

---

## 🔄 Manual Product Sync (First Time)

### Step 1: User Clicks "Sync Store Products"

```
User clicks sync button
↓
app/routes/app._index.tsx:
  syncFetcher.submit({}, { method: "POST", action: "/app/sync-store" })
```

### Step 2: Shopify App Creates Sync Job

```
app/routes/app.sync-store.tsx receives POST request:
↓
1. Check for existing running sync:
   - Query latest sync_job for shop
   - If running: Return existing jobId
   - If failed: Resume with same jobId
↓
2. Create sync job in Firestore (WITHOUT product count):
   stores/{storeId}/sync_jobs/{jobId}:
     - status: "pending"
     - totalProducts: 0  (Python will update this)
     - syncedCount: 0
     - progress: 0
     - cursor: null
     - createdAt: timestamp
↓
3. Call Python server (fire-and-forget):
   POST http://python-server:8080/api/sync-products
   {
     shopDomain: "mystore.myshopify.com",
     jobId: "job_123",
     accessToken: "shpat_xxxxx",
     shopifyApiVersion: "2024-10"
   }
   ❌ NO totalProducts (Python fetches it)
↓
4. Return immediately to UI:
   {
     success: true,
     jobId: "job_123",
     message: "Sync started in background"
   }
   ❌ NO totalProducts (will be updated by Python)
```

### Step 3: UI Starts Polling for Progress

```
app/routes/app._index.tsx receives jobId:
↓
useEffect starts polling every 5 seconds:
  GET /app/sync-status/job_123
↓
UI displays:
  - Spinner
  - "Starting sync..."
  - Progress bar (0%)
  - "0 of 0 products" (totalProducts not set yet)
```

### Step 4: Python Server Syncs Products (Background)

```
python-server/routes/sync_products.py receives request:
↓
1. Get store from Firestore
   - Find store by shopDomain
↓
2. Get sync job:
   - Check if already completed (skip if yes)
   - Check for resume (failed job with cursor)
↓
3. GET PRODUCT COUNT FROM SHOPIFY (Python handles this):
   query { productsCount { count } }
   → totalProducts = 1500

   print("📊 Fetching product count from Shopify...")
   print("📦 Total products in Shopify: 1500")
↓
4. Update job status with product count:
   status: "running"
   totalProducts: 1500  ✅ (Python sets this)
   startedAt: timestamp
↓
5. Fetch products in batches (10 per batch):

   LOOP: while syncedCount < totalProducts
   ↓
   a) Fetch batch from Shopify GraphQL:
      query {
        products(first: 10, after: "cursor") {
          pageInfo { hasNextPage, endCursor }
          edges {
            node {
              id, title, handle, description
              vendor, productType, tags
              media, variants, metafields
              ...
            }
          }
        }
      }
   ↓
   b) NO Firestore product storage (embeddings only):
      print("📦 Processing batch of 10 products (embeddings only)...")
   ↓
   c) Update progress in Firestore:
      syncedCount += 10
      progress = (syncedCount / totalProducts) * 100
      cursor = endCursor
   ↓
   d) Rate limiting:
      sleep(0.5)  # 500ms between batches
   ↓
   e) Handle throttling:
      if THROTTLED error → sleep(2) → retry
↓
6. After all products fetched:
   print("🎯 Product sync completed. Starting embeddings...")
↓
7. Call embedding API:
   POST https://embedding-api.com/sync
   {
     store_domain: "mystore.myshopify.com"
   }
   ↓
   Embedding API:
     - Fetches ALL products from Shopify
     - Generates embeddings
     - Stores in Vector DB:
       {
         productId: "gid://shopify/Product/123",
         embedding: [0.1, 0.2, ...],
         store_domain: "mystore.myshopify.com"
       }
↓
8. Mark job as completed:
   status: "completed"
   progress: 100
   embeddingSuccess: true
   completedAt: timestamp
↓
9. Update store metadata (product count for UI):
   productCount: 1500
   updatedAt: timestamp
```

### Step 5: UI Shows Completion

```
Polling detects status = "completed":
↓
UI displays:
  🎉 Sync Complete!
  ✅ 1500 products synced successfully
  "Your products are now ready for visual search!"
↓
Shows next steps:
  - Set Up App Blocks
  - View Analytics
```

**Firestore after sync:**
```
stores/
  └── {storeId}/
      ├── productCount: 1500 ✅
      └── sync_jobs/
          └── job_123/
              ├── status: "completed" ✅
              ├── progress: 100
              ├── syncedCount: 1500
              ├── totalProducts: 1500
              ├── embeddingSuccess: true
              └── completedAt: timestamp
```

**Vector DB after sync:**
```
embeddings:
  - productId: "gid://shopify/Product/123", embedding: [...], store: "mystore.myshopify.com"
  - productId: "gid://shopify/Product/456", embedding: [...], store: "mystore.myshopify.com"
  - ... (1500 products)
```

---

## 🔔 Real-time Webhooks (Ongoing Updates)

### Product Created Webhook

```
Merchant creates new product in Shopify
↓
Shopify sends webhook:
  POST https://app.com/webhooks/products/create
  {
    id: 789,
    title: "New Product",
    ...
  }
↓
app/routes/webhooks.products.create.tsx:
↓
1. Authenticate webhook
2. Validate payload (using utils/pythonWebhook.server.ts)
3. Forward to Python server:
   POST http://python-server:8080/api/webhook/product/create
   {
     shopDomain: "mystore.myshopify.com",
     productId: "gid://shopify/Product/789"
   }
   ❌ NO accessToken needed (embedding API fetches from Shopify)
4. Return 200 OK immediately
↓
Python Server (python-server/routes/webhooks.py):
↓
1. Verify store exists in Firestore
↓
2. Sync embedding ONLY (NO Firestore product storage):
   POST https://embedding-api.com/sync
   {
     store_domain: "mystore.myshopify.com",
     productIds: ["gid://shopify/Product/789"],
     action: "create"
   }
   ↓
   Embedding API:
     - Fetches product 789 from Shopify
     - Generates embedding
     - Stores product ID + embedding in Vector DB
↓
3. Update product count in Firestore:
   productCount: Increment(+1)  → 1501
   updatedAt: timestamp
↓
4. Return success
```

### Product Updated Webhook

```
Merchant updates product in Shopify
↓
Shopify webhook → app/routes/webhooks.products.update.tsx
↓
Forward to Python: /api/webhook/product/update
{
  shopDomain: "mystore.myshopify.com",
  productId: "gid://shopify/Product/456"
}
↓
Python Server:
1. Verify store exists
2. Sync embedding update ONLY (NO Firestore product storage):
   - Embedding API fetches updated product from Shopify
   - Regenerates embedding
   - Updates in Vector DB
3. Return success (no count change for updates)
```

### Product Deleted Webhook

```
Merchant deletes product in Shopify
↓
Shopify webhook → app/routes/webhooks.products.delete.tsx
↓
Forward to Python: /api/webhook/product/delete
{
  shopDomain: "mystore.myshopify.com",
  productId: "gid://shopify/Product/123"
}
↓
Python Server:
1. Verify store exists
2. Delete embedding from Vector DB ONLY:
   - Embedding API removes product 123 from Vector DB
3. Update product count in Firestore:
   productCount: Increment(-1)  → 1499
   updatedAt: timestamp
4. Return success
```

**After webhook updates:**
```
Firestore:
  stores/{storeId}/productCount: 1499 ✅

Vector DB:
  - Product 123: DELETED ✅
  - Product 456: UPDATED ✅
  - Product 789: CREATED ✅
```

---

## 🔍 Visual Search Flow

### Step 1: Customer Uses Visual Search

```
Customer visits store → Uploads image
↓
Storefront app block sends image to:
  POST https://app.com/api/visual-search
  {
    image: base64_image,
    shopDomain: "mystore.myshopify.com"
  }
```

### Step 2: Search Vector DB

```
Backend sends image to Embedding API:
  POST https://embedding-api.com/search
  {
    image: base64_image,
    store_domain: "mystore.myshopify.com",
    limit: 10
  }
↓
Embedding API:
1. Generate embedding for uploaded image
2. Search Vector DB for similar embeddings:
   - Compare image embedding with product embeddings
   - Filter by store_domain
   - Return top 10 matches
↓
Returns:
  {
    results: [
      { productId: "gid://shopify/Product/456", score: 0.95 },
      { productId: "gid://shopify/Product/789", score: 0.89 },
      ...
    ]
  }
```

### Step 3: Fetch Product Details from Shopify

```
Backend receives product IDs:
↓
For each productId in results:
  query {
    product(id: "gid://shopify/Product/456") {
      id, title, handle
      description, vendor
      priceRangeV2 {
        minVariantPrice { amount, currencyCode }
      }
      featuredMedia {
        ... on MediaImage {
          image { url, altText }
        }
      }
      variants(first: 1) {
        edges {
          node {
            id, price, availableForSale
          }
        }
      }
    }
  }
↓
Returns full product details for each match
```

### Step 4: Display Results to Customer

```
Backend returns to frontend:
  {
    results: [
      {
        id: "gid://shopify/Product/456",
        title: "Blue Sneakers",
        price: "$79.99",
        image: "https://cdn.shopify.com/...",
        url: "https://store.com/products/blue-sneakers",
        similarity: 0.95
      },
      ...
    ]
  }
↓
Storefront displays:
  - Product images
  - Titles and prices
  - "View Product" links
  - Sorted by similarity score
```

---

## 💾 Data Storage Architecture

### Firestore Structure

```
stores/
  └── {storeId}/
      ├── shopDomain: "mystore.myshopify.com"
      ├── name: "My Store"
      ├── email: "owner@store.com"
      ├── plan: { shopifyPlus: false }
      ├── productCount: 1500            # For UI display only
      ├── totalProductsInShopify: 1500  # From Shopify API
      ├── createdAt: timestamp
      ├── updatedAt: timestamp
      │
      └── sync_jobs/
          ├── job_123/
          │   ├── status: "completed"
          │   ├── progress: 100
          │   ├── syncedCount: 1500
          │   ├── totalProducts: 1500
          │   ├── cursor: "eyJsYXN0X2lkIjo..."
          │   ├── error: null
          │   ├── embeddingSuccess: true
          │   ├── createdAt: timestamp
          │   └── completedAt: timestamp
          │
          └── job_124/
              └── ... (next sync)
```

### Vector DB Structure

```
Collection: product_embeddings

Documents:
  - id: auto_generated
    productId: "gid://shopify/Product/123"
    store_domain: "mystore.myshopify.com"
    embedding: [0.123, 0.456, 0.789, ...] (1536 dimensions)
    created_at: timestamp
    updated_at: timestamp

  - id: auto_generated
    productId: "gid://shopify/Product/456"
    store_domain: "mystore.myshopify.com"
    embedding: [0.234, 0.567, 0.890, ...]
    created_at: timestamp
    updated_at: timestamp

... (1500 products)
```

### ❌ What's NOT Stored

```
Firestore:
  ❌ Product titles, descriptions
  ❌ Product images, media
  ❌ Product variants, prices
  ❌ Product metadata

→ All product data fetched from Shopify API when needed
```

---

## 🛠️ Technology Stack

### Shopify App (Frontend & Backend)
```
Framework: Remix (React + Node.js)
Language: TypeScript
Deployment: Netlify
Database: Firestore (metadata only)

Key Files:
  - app/routes/app._index.tsx         → Main UI
  - app/routes/app.sync-store.tsx     → Sync orchestrator
  - app/routes/webhooks.products.*    → Webhook handlers
  - app/utils/shopifyData.server.ts   → Store loader
  - app/utils/pythonWebhook.server.ts → Webhook utils
```

### Python Server (Worker)
```
Framework: Flask
Language: Python 3.9+
Deployment: Netlify Functions / Cloud Run
Database: Firestore (via google-cloud-firestore)

Key Files:
  - python-server/app.py                    → Flask app
  - python-server/routes/sync_products.py   → Sync handler
  - python-server/routes/webhooks.py        → Webhook handlers
  - python-server/utils/shopify_client.py   → Shopify GraphQL utils
  - python-server/utils/firestore_client.py → Firestore utils
  - python-server/utils/embedding_client.py → Embedding API utils
```

### External Services
```
Shopify GraphQL API: Product data source
Embedding API: Image similarity search
Firestore: Metadata storage
Vector DB: Embedding storage (in Embedding API)
```

---

## 🔑 Key Design Decisions

### 1. No Product Duplication
- Products only stored in Shopify (source of truth)
- Product IDs stored in Vector DB (with embeddings)
- No Firestore product storage → Simpler, no sync issues

### 2. Shopify App = Lightweight Orchestrator
- Creates sync jobs
- Forwards webhooks to Python
- Polls job status
- Minimal business logic

### 3. Python Server = Heavy Lifter
- Handles all product operations
- Manages embeddings
- Long-running operations (no timeout)
- Batch processing

### 4. Firestore = Metadata Only
- Store info (domain, name, plan)
- Sync jobs (progress tracking)
- Product count (for UI display)

### 5. Vector DB = Search Engine
- Product embeddings
- Product IDs
- Similarity search

### 6. Real-time via Webhooks
- Initial sync for bulk setup
- Webhooks for real-time updates
- No polling or scheduled syncs needed

---

## 📊 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         SHOPIFY                                  │
│  (Source of Truth - All Product Data)                           │
│                                                                  │
│  Products: id, title, description, images, variants, etc.       │
└──────────────────┬──────────────────────────┬───────────────────┘
                   │                          │
                   │ GraphQL API              │ Webhooks
                   ↓                          ↓
┌──────────────────────────────┐    ┌────────────────────────┐
│     SHOPIFY APP (Remix)      │    │   SHOPIFY WEBHOOKS     │
│  - OAuth & Installation      │    │  - Product Created     │
│  - Store Loader              │    │  - Product Updated     │
│  - Sync Orchestrator         │    │  - Product Deleted     │
│  - Webhook Receiver          │    └────────┬───────────────┘
│  - UI & Polling              │             │
└──────┬──────────────┬────────┘             │
       │              │                      │
       │              │ Forward              │
       ↓              ↓                      ↓
┌──────────────────────────────────────────────────────────┐
│              PYTHON SERVER (Flask)                        │
│  - Sync Products (batches)                               │
│  - Webhook Handlers (create/update/delete)               │
│  - Embedding Sync                                        │
└──────┬──────────────┬────────────────┬───────────────────┘
       │              │                │
       │              │                │
       ↓              ↓                ↓
┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐
│  FIRESTORE  │  │ EMBEDDING API │  │    VECTOR DB         │
│             │  │               │  │                      │
│ - Stores    │  │ - Generate    │  │ - Product IDs        │
│ - Sync Jobs │  │   Embeddings  │  │ - Embeddings         │
│ - Metadata  │  │ - Search      │  │ - Similarity Search  │
│             │  │   Similar     │  │                      │
│ ❌ Products │  │   Products    │  │ ✅ Product IDs Only  │
└─────────────┘  └──────────────┘  └──────────────────────┘

Visual Search Flow:
Customer Image → Embedding API → Vector DB Search → Product IDs
                                                          ↓
                                            Shopify API (Fetch Products)
                                                          ↓
                                            Display Results to Customer
```

---

## 🎯 Summary

1. **Installation**: Store info saved to Firestore
2. **Manual Sync**: Python fetches products → Embeddings created → Product IDs in Vector DB
3. **Webhooks**: Real-time updates → Only embedding sync (no Firestore products)
4. **Visual Search**: Image → Vector DB → Product IDs → Shopify API → Results

**Result**: Clean architecture with no data duplication, always up-to-date products from Shopify! 🚀

---

## 📊 **Shopify App Responsibilities (Minimal)**

### ✅ What Shopify App DOES:
1. **Authentication & OAuth**: Handles app installation and access token management
2. **Store Loader**: Fetches store info from Shopify (name, plan, features) - ONCE on install
3. **Create Sync Jobs**: Creates empty sync job in Firestore (totalProducts: 0)
4. **Forward to Python**: Sends jobId + accessToken to Python server
5. **Read Sync Jobs**: Polls job status for UI updates
6. **Receive Webhooks**: Authenticates and forwards to Python server
7. **Display UI**: Shows sync progress, completion status

### ❌ What Shopify App DOES NOT DO:
1. ❌ Fetch product count from Shopify (Python does this)
2. ❌ Fetch products from Shopify (Python does this)
3. ❌ Store products in Firestore (No product storage at all)
4. ❌ Call embedding API (Python does this)
5. ❌ Update product count (Python does this)
6. ❌ Handle product webhooks logic (Just forwards to Python)

### 🎯 Firestore Operations by Shopify App:
```
WRITE Operations:
- Create store document (on install)
- Create sync_job (status: pending, totalProducts: 0)

READ Operations:
- Read store document (for UI)
- Read sync_job (for polling status)
- Read latest sync_job (check for running sync)

❌ NO Operations on:
- products collection (doesn't exist!)
- Updating totalProducts (Python does this)
- Updating productCount (Python does this)
```

### 🐍 Python Server Responsibilities (All Business Logic):
```
✅ Fetch product count from Shopify
✅ Update job.totalProducts
✅ Fetch products from Shopify
✅ Call embedding API
✅ Update job progress/status
✅ Update store.productCount
✅ Handle webhook product changes
✅ Sync embeddings for webhooks
```

**In summary**: Shopify app is a lightweight **orchestrator and UI** that only reads job status. Python server handles **ALL Shopify API calls and business logic**. 🎉
