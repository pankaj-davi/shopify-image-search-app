# 🗄️ Flexible Database Setup for Shopify App

This Shopify app is configured with a **flexible database architecture** that allows you to easily switch between different database providers without changing your application code.

## 🎯 Quick Start

### 1. Choose Your Database Provider

Set the `DATABASE_PROVIDER` in your `.env` file:

```env
# Choose one: firebase, prisma, mongodb, supabase
DATABASE_PROVIDER=firebase
```

### 2. Configure Your Chosen Database

#### 🔥 Firebase (Recommended for rapid development)

```env
DATABASE_PROVIDER=firebase
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
```

**📋 [See detailed Firebase setup guide](./FIREBASE_SETUP.md)**

#### 🗄️ Prisma (SQL databases)

```env
DATABASE_PROVIDER=prisma
# SQLite (default)
DATABASE_URL="file:dev.sqlite"
# PostgreSQL
# DATABASE_URL="postgresql://username:password@localhost:5432/database"
# MySQL
# DATABASE_URL="mysql://username:password@localhost:3306/database"
```

#### 🍃 MongoDB (Coming soon)

```env
DATABASE_PROVIDER=mongodb
MONGODB_CONNECTION_STRING=mongodb://localhost:27017
MONGODB_DATABASE_NAME=shopify_app
```

#### 🗂️ Supabase (Coming soon)

```env
DATABASE_PROVIDER=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Database Setup

For **Prisma**:

```bash
npm run prisma:migrate
npm run prisma:generate
```

For **Firebase**:

- No setup needed, database is created automatically

### 4. Start Your App

```bash
npm run dev
```

## 🔄 Switching Between Databases

**It's as simple as changing one environment variable!**

1. Update `DATABASE_PROVIDER` in your `.env` file
2. Configure the new database credentials
3. Restart your app
4. Your data layer automatically adapts!

```env
# Switch from Firebase to Prisma
DATABASE_PROVIDER=prisma
```

## 🏗️ Architecture Overview

```
app/
├── config/
│   └── database.config.ts          # Central database configuration
├── services/
│   ├── database.interface.ts       # Common interface for all databases
│   ├── firebase.database.ts        # Firebase implementation
│   ├── prisma.database.ts          # Prisma implementation
│   ├── mongo.database.ts           # MongoDB implementation (placeholder)
│   ├── supabase.database.ts        # Supabase implementation (placeholder)
│   ├── firebase.service.ts         # Firebase initialization
│   └── app.database.service.ts     # Main database service
```

## 📊 Database Operations Available

```typescript
// Store operations
await appDatabase.syncStore(storeInfo);
await appDatabase.getStore(shopDomain);

// Product operations
await appDatabase.syncProductFromShopify(shopifyProduct, shopDomain);
await appDatabase.getStoreProducts(shopDomain, limit);
await appDatabase.searchProducts(searchTerm, shopDomain);
await appDatabase.deleteProduct(productId);
```

## 🎯 Data Models

### Store

```typescript
{
  id: string;
  shopDomain: string;
  name: string;
  myshopifyDomain: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Product

```typescript
{
  id: string;
  shopifyProductId: string;
  title: string;
  handle: string;
  status: string;
  price?: string;
  sku?: string;
  shopDomain: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔧 Adding a New Database Provider

1. Create a new implementation file: `app/services/your-database.database.ts`
2. Implement the `DatabaseInterface`
3. Add your provider to the factory in `database.interface.ts`
4. Add configuration options to `database.config.ts`
5. Set `DATABASE_PROVIDER=your-database` in `.env`

## 🚨 Troubleshooting

### "Database provider not supported"

- Check that `DATABASE_PROVIDER` is set correctly in `.env`
- Ensure the provider value matches exactly: `firebase`, `prisma`, `mongodb`, or `supabase`

### Firebase permission errors

- Verify your service account credentials
- Check Firestore security rules
- Ensure the Firebase project is active

### Prisma connection errors

- Run `npm run prisma:generate` after schema changes
- Check your `DATABASE_URL` format
- Ensure the database exists and is accessible

## 🎉 Features

✅ **Auto-sync** Shopify products and store data to your database  
✅ **Search** products across your database  
✅ **Easy switching** between database providers  
✅ **Type-safe** operations with TypeScript  
✅ **Scalable** architecture for future growth  
✅ **Console logging** for debugging and monitoring

## 📈 Production Recommendations

- **Firebase**: Great for rapid development and real-time features
- **Prisma + PostgreSQL**: Best for complex queries and relationships
- **MongoDB**: Perfect for document-based data and flexible schemas
- **Supabase**: Excellent for real-time features with SQL database

Choose based on your specific needs for performance, scalability, and team expertise!
