#!/usr/bin/env node

/**
 * 🔄 Database Restore Script
 * Restores database from backup files
 */

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadEnvironment() {
  try {
    const envPath = join(__dirname, '..', '.env');
    try {
      const envContent = await fs.readFile(envPath, 'utf-8');
      const envVars = envContent.split('\n').filter(line => line && !line.startsWith('#'));
      envVars.forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      });
    } catch (error) {
      console.warn('⚠️ No .env file found, using environment variables');
    }
  } catch (error) {
    console.error('❌ Error loading environment:', error.message);
  }
}

async function getBackupFile(backupName) {
  const backupDir = join(__dirname, '..', 'backups');
  
  if (backupName) {
    // Use specific backup file
    const backupFile = join(backupDir, backupName);
    try {
      await fs.access(backupFile);
      return backupFile;
    } catch {
      throw new Error(`Backup file not found: ${backupName}`);
    }
  } else {
    // Use most recent backup
    try {
      const files = await fs.readdir(backupDir);
      const provider = process.env.DATABASE_PROVIDER || 'firebase';
      const backupFiles = files
        .filter(file => file.startsWith(`${provider}-backup-`) && file.endsWith('.json'))
        .sort()
        .reverse();
      
      if (backupFiles.length === 0) {
        throw new Error(`No ${provider} backup files found`);
      }
      
      console.log(`ℹ️ Using most recent backup: ${backupFiles[0]}`);
      return join(backupDir, backupFiles[0]);
    } catch (error) {
      throw new Error(`Error finding backup files: ${error.message}`);
    }
  }
}

async function restoreFirebase(backupData) {
  console.log('🔥 Starting Firebase restore...');
  
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID not configured');
  }
  
  try {
    const { initializeApp, cert, getApps } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    
    // Clean up existing apps
    const existingApps = getApps();
    existingApps.forEach(app => app.delete());
    
    let app;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (clientEmail && privateKey) {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      app = initializeApp({ projectId });
    }
    
    const firestore = getFirestore(app);
    
    // Confirm before proceeding
    console.log('⚠️ This will overwrite existing data in Firebase!');
    console.log(`Project: ${projectId}`);
    console.log(`Backup from: ${backupData.timestamp}`);
    
    // Restore stores
    if (backupData.collections.stores) {
      console.log('🏪 Restoring stores...');
      for (const store of backupData.collections.stores) {
        await firestore.collection('stores').doc(store.id).set(store.data);
      }
      console.log(`✅ Restored ${backupData.collections.stores.length} stores`);
    }
    
    // Restore products
    if (backupData.collections.products) {
      console.log('📦 Restoring products...');
      for (const product of backupData.collections.products) {
        await firestore.collection('products').doc(product.id).set(product.data);
      }
      console.log(`✅ Restored ${backupData.collections.products.length} products`);
    }
    
    // Restore events
    if (backupData.collections.storeEvents) {
      console.log('📋 Restoring store events...');
      for (const event of backupData.collections.storeEvents) {
        await firestore.collection('storeEvents').doc(event.id).set(event.data);
      }
      console.log(`✅ Restored ${backupData.collections.storeEvents.length} events`);
    }
    
    await app.delete();
    
    return {
      success: true,
      stats: {
        stores: backupData.collections.stores?.length || 0,
        products: backupData.collections.products?.length || 0,
        events: backupData.collections.storeEvents?.length || 0
      }
    };
    
  } catch (error) {
    throw new Error(`Firebase restore failed: ${error.message}`);
  }
}

async function restorePrisma(backupData) {
  console.log('🗄️ Starting Prisma restore...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not configured');
  }
  
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    
    console.log('⚠️ This will overwrite existing data in the database!');
    console.log(`Database: ${databaseUrl.replace(/:[^:@]*@/, ':***@')}`);
    console.log(`Backup from: ${backupData.timestamp}`);
    
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await prisma.product.deleteMany();
    await prisma.store.deleteMany();
    console.log('✅ Existing data cleared');
    
    // Restore stores
    if (backupData.tables.stores) {
      console.log('🏪 Restoring stores...');
      for (const store of backupData.tables.stores) {
        await prisma.store.create({ data: store });
      }
      console.log(`✅ Restored ${backupData.tables.stores.length} stores`);
    }
    
    // Restore products
    if (backupData.tables.products) {
      console.log('📦 Restoring products...');
      for (const product of backupData.tables.products) {
        await prisma.product.create({ data: product });
      }
      console.log(`✅ Restored ${backupData.tables.products.length} products`);
    }
    
    await prisma.$disconnect();
    
    return {
      success: true,
      stats: {
        stores: backupData.tables.stores?.length || 0,
        products: backupData.tables.products?.length || 0,
        sessions: backupData.tables.sessions?.length || 0
      }
    };
    
  } catch (error) {
    throw new Error(`Prisma restore failed: ${error.message}`);
  }
}

async function main() {
  console.log('🔄 Database Restore Script');
  console.log('='.repeat(26) + '\n');
  
  await loadEnvironment();
  
  const provider = process.env.DATABASE_PROVIDER || 'firebase';
  const backupName = process.argv[3]; // npm run db:restore -- --backup=filename.json
  
  console.log(`📊 Database provider: ${provider}`);
  console.log(`📁 Backup file: ${backupName || 'most recent'}\n`);
  
  try {
    // Get backup file
    const backupFile = await getBackupFile(backupName);
    console.log(`📥 Loading backup: ${backupFile}`);
    
    // Load backup data
    const backupContent = await fs.readFile(backupFile, 'utf-8');
    const backupData = JSON.parse(backupContent);
    
    console.log(`📅 Backup timestamp: ${backupData.timestamp}`);
    
    // Restore based on provider
    let result;
    switch (provider) {
      case 'firebase':
        result = await restoreFirebase(backupData);
        break;
      case 'prisma':
        result = await restorePrisma(backupData);
        break;
      default:
        throw new Error(`Restore not implemented for provider: ${provider}`);
    }
    
    console.log('\n' + '='.repeat(40));
    console.log('📊 RESTORE SUMMARY');
    console.log('='.repeat(40));
    console.log(`✅ Restore completed successfully`);
    console.log(`📁 From: ${backupFile}`);
    console.log(`📊 Statistics:`);
    Object.entries(result.stats).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error(`❌ Restore failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Restore script failed:', error);
    process.exit(1);
  });
}
