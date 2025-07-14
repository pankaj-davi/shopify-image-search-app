# Firebase Database Setup Guide

## 🔥 Firebase Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or use an existing project
3. Enable Firestore Database:
   - Go to "Firestore Database" in the left sidebar
   - Click "Create database"
   - Choose "Start in production mode" (you can change rules later)
   - Select your preferred location

### 2. Create a Service Account

1. Go to Project Settings (gear icon) → "Service accounts"
2. Click "Generate new private key"
3. Download the JSON file and keep it secure

### 3. Environment Configuration

Copy the values from your service account JSON to your `.env` file:

```env
DATABASE_PROVIDER=firebase
FIREBASE_PROJECT_ID=your-project-id-here
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
```

**Important**:

- Replace `\n` in the private key with actual newlines, or use the format above
- Keep the quotes around the private key
- Never commit these credentials to version control

### 4. Firestore Security Rules (Optional)

In the Firebase Console, go to Firestore → Rules and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to authenticated users
    match /{document=**} {
      allow read, write: if true; // Change this for production
    }
  }
}
```

### 5. Test Your Setup

Run your app and check the console for:

```
🔥 Firebase initialized successfully
```

## 📊 Firestore Data Structure

Your data will be organized as:

```
/stores/{shopDomain}
  - name: string
  - myshopifyDomain: string
  - createdAt: timestamp
  - updatedAt: timestamp

/products/{productId}
  - shopifyProductId: string
  - title: string
  - handle: string
  - status: string
  - price: string
  - sku: string
  - shopDomain: string
  - createdAt: timestamp
  - updatedAt: timestamp
```

## 🔄 Switching from Firebase to Other Databases

To switch to Prisma:

1. Change `DATABASE_PROVIDER=prisma` in your `.env`
2. Run `npm run prisma:migrate`
3. Restart your app

To switch to MongoDB or Supabase:

1. Implement the respective database classes
2. Change the `DATABASE_PROVIDER` in your `.env`
3. Configure the respective environment variables

## 🚨 Troubleshooting

### Error: "Firebase project ID is required"

- Make sure `FIREBASE_PROJECT_ID` is set in your `.env` file

### Error: "Permission denied"

- Check your Firestore security rules
- Verify your service account has the right permissions

### Error: "Invalid private key"

- Make sure the private key is properly formatted with `\n` characters
- Ensure the entire key is wrapped in quotes
