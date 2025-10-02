// Database configuration - easily switch between different databases

export type DatabaseProvider = 'firebase' | 'mongodb' | 'supabase';

export interface DatabaseConfig {
  provider: DatabaseProvider;
  firebase?: {
    projectId: string;
    clientEmail?: string;
    privateKey?: string;
    databaseURL?: string;
  };
  mongodb?: {
    connectionString: string;
    databaseName: string;
  };
  supabase?: {
    url: string;
    anonKey: string;
  };
}

// Current database provider - change this to switch databases
export const DATABASE_PROVIDER: DatabaseProvider = process.env.DATABASE_PROVIDER as DatabaseProvider || 'firebase';

// Helper function to get Firebase private key (supports both plain text and base64)
function getFirebasePrivateKey(): string {
  // First try to use base64-encoded key
  if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
    try {
      return Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf-8');
    } catch (error) {
      console.error('Failed to decode FIREBASE_PRIVATE_KEY_BASE64:', error);
    }
  }
  // Fall back to plain text key
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';
}

export const databaseConfig: DatabaseConfig = {
  provider: DATABASE_PROVIDER,
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: getFirebasePrivateKey(),
    databaseURL: process.env.FIREBASE_DATABASE_URL || '',
  },
  mongodb: {
    connectionString: process.env.MONGODB_CONNECTION_STRING || '',
    databaseName: process.env.MONGODB_DATABASE_NAME || 'shopify_app',
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
  },
};
