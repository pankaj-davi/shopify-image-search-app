#!/usr/bin/env node

/**
 * 💾 Database Backup Script
 * Creates backups of the database based on the provider
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

async function createBackupDirectory() {
  const backupDir = join(__dirname, '..', 'backups');
  try {
    await fs.access(backupDir);
  } catch {
    await fs.mkdir(backupDir, { recursive: true });
    console.log('📁 Created backups directory');
  }
  return backupDir;
}

async function backupFirebase() {
  console.log('🔥 Starting Firebase backup...');
  
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
    const backupData = {
      timestamp: new Date().toISOString(),
      projectId,
      collections: {}
    };
    
    // Backup stores collection
    console.log('📦 Backing up stores collection...');
    const storesSnapshot = await firestore.collection('stores').get();
    backupData.collections.stores = [];
    storesSnapshot.forEach(doc => {
      backupData.collections.stores.push({
        id: doc.id,
        data: doc.data()
      });
    });
    console.log(`✅ Backed up ${storesSnapshot.size} stores`);
    
    // Backup products collection
    console.log('📦 Backing up products collection...');
    const productsSnapshot = await firestore.collection('products').get();
    backupData.collections.products = [];
    productsSnapshot.forEach(doc => {
      backupData.collections.products.push({
        id: doc.id,
        data: doc.data()
      });
    });
    console.log(`✅ Backed up ${productsSnapshot.size} products`);
    
    // Backup store events collection
    console.log('📦 Backing up storeEvents collection...');
    const eventsSnapshot = await firestore.collection('storeEvents').get();
    backupData.collections.storeEvents = [];
    eventsSnapshot.forEach(doc => {
      backupData.collections.storeEvents.push({
        id: doc.id,
        data: doc.data()
      });
    });
    console.log(`✅ Backed up ${eventsSnapshot.size} store events`);
    
    await app.delete();
    
    const backupDir = await createBackupDirectory();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = join(backupDir, `firebase-backup-${timestamp}.json`);
    
    await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`💾 Backup saved to: ${backupFile}`);
    
    return {
      success: true,
      backupFile,
      stats: {
        stores: backupData.collections.stores.length,
        products: backupData.collections.products.length,
        events: backupData.collections.storeEvents.length
      }
    };
    
  } catch (error) {
    throw new Error(`Firebase backup failed: ${error.message}`);
  }
}

async function backupPrisma() {
  console.log('🗄️ Starting Prisma backup...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not configured');
  }
  
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    
    const backupData = {
      timestamp: new Date().toISOString(),
      databaseUrl: databaseUrl.replace(/:[^:@]*@/, ':***@'), // Hide password
      tables: {}
    };
    
    // Backup stores
    console.log('📦 Backing up stores...');
    const stores = await prisma.store.findMany();
    backupData.tables.stores = stores;
    console.log(`✅ Backed up ${stores.length} stores`);
    
    // Backup products  
    console.log('📦 Backing up products...');
    const products = await prisma.product.findMany();
    backupData.tables.products = products;
    console.log(`✅ Backed up ${products.length} products`);
    
    // Backup sessions
    console.log('📦 Backing up sessions...');
    const sessions = await prisma.session.findMany();
    backupData.tables.sessions = sessions;
    console.log(`✅ Backed up ${sessions.length} sessions`);
    
    await prisma.$disconnect();
    
    const backupDir = await createBackupDirectory();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = join(backupDir, `prisma-backup-${timestamp}.json`);
    
    await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`💾 Backup saved to: ${backupFile}`);
    
    return {
      success: true,
      backupFile,
      stats: {
        stores: stores.length,
        products: products.length,
        sessions: sessions.length
      }
    };
    
  } catch (error) {
    throw new Error(`Prisma backup failed: ${error.message}`);
  }
}

async function cleanupOldBackups() {
  console.log('🧹 Cleaning up old backups...');
  
  const backupDir = join(__dirname, '..', 'backups');
  try {
    const files = await fs.readdir(backupDir);
    const backupFiles = files.filter(file => 
      file.endsWith('.json') && 
      (file.startsWith('firebase-backup-') || file.startsWith('prisma-backup-'))
    );
    
    // Keep only last 10 backups
    if (backupFiles.length > 10) {
      const sortedFiles = backupFiles
        .map(file => ({
          name: file,
          path: join(backupDir, file),
          stat: null
        }))
        .sort((a, b) => a.name.localeCompare(b.name)); // Sort by timestamp in filename
      
      const filesToDelete = sortedFiles.slice(0, sortedFiles.length - 10);
      
      for (const file of filesToDelete) {
        await fs.unlink(file.path);
        console.log(`🗑️ Deleted old backup: ${file.name}`);
      }
      
      console.log(`✅ Cleaned up ${filesToDelete.length} old backups`);
    } else {
      console.log('ℹ️ No old backups to clean up');
    }
  } catch (error) {
    console.warn(`⚠️ Cleanup warning: ${error.message}`);
  }
}

async function main() {
  console.log('💾 Database Backup Script');
  console.log('='.repeat(25) + '\n');
  
  await loadEnvironment();
  
  const provider = process.env.DATABASE_PROVIDER || 'firebase';
  console.log(`📊 Database provider: ${provider}\n`);
  
  try {
    let result;
    
    switch (provider) {
      case 'firebase':
        result = await backupFirebase();
        break;
      case 'prisma':
        result = await backupPrisma();
        break;
      default:
        throw new Error(`Backup not implemented for provider: ${provider}`);
    }
    
    await cleanupOldBackups();
    
    console.log('\n' + '='.repeat(40));
    console.log('📊 BACKUP SUMMARY');
    console.log('='.repeat(40));
    console.log(`✅ Backup completed successfully`);
    console.log(`📁 File: ${result.backupFile}`);
    console.log(`📊 Statistics:`);
    Object.entries(result.stats).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error(`❌ Backup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Backup script failed:', error);
    process.exit(1);
  });
}
