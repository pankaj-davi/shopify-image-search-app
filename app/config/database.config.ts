// Database configuration - easily switch between different databases

export type DatabaseProvider = 'firebase' | 'prisma' | 'mongodb' | 'supabase';

export interface DatabaseConfig {
  provider: DatabaseProvider;
  firebase?: {
    projectId: string;
    clientEmail?: string;
    privateKey?: string;
    databaseURL?: string;
  };
  prisma?: {
    databaseUrl: string;
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

export const databaseConfig: DatabaseConfig = {
  provider: DATABASE_PROVIDER,
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    databaseURL: process.env.FIREBASE_DATABASE_URL || '',
  },
  prisma: {
    databaseUrl: process.env.DATABASE_URL || 'file:dev.sqlite',
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
