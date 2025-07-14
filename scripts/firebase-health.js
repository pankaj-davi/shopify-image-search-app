#!/usr/bin/env node

/**
 * 🔥 Firebase Health Check Script
 * Specifically tests Firebase connectivity and configuration
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
      const envVars = envContent
        .split('\n')
        .filter(line => line && !line.startsWith('#'));
      envVars.forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts
            .join('=')
            .trim()
            .replace(/^["']|["']$/g, '');
        }
      });
    } catch (error) {
      console.warn('⚠️ No .env file found, using environment variables');
    }
  } catch (error) {
    console.error('❌ Error loading environment:', error.message);
  }
}

async function testFirebaseConnection() {
  console.log('🔥 Testing Firebase connection...\n');

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // Check configuration
  console.log('📋 Configuration Check:');
  console.log(`   Project ID: ${projectId || '❌ Missing'}`);
  console.log(`   Client Email: ${clientEmail ? '✅ Present' : '❌ Missing'}`);
  console.log(`   Private Key: ${privateKey ? '✅ Present' : '❌ Missing'}`);

  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID is required');
  }

  try {
    const { initializeApp, cert, getApps } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');

    // Clean up existing apps
    const existingApps = getApps();
    existingApps.forEach(app => app.delete());

    let app;
    console.log('\n🔧 Initializing Firebase...');

    if (clientEmail && privateKey) {
      console.log('   Using service account credentials');
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      console.log('   Using application default credentials');
      app = initializeApp({ projectId });
    }

    console.log('✅ Firebase app initialized successfully');

    console.log('\n🗄️ Testing Firestore connection...');
    const firestore = getFirestore(app);

    // Test basic connectivity
    const testCollection = firestore.collection('health-check');
    const testDoc = testCollection.doc('connectivity-test');

    // Write test
    console.log('   Writing test document...');
    await testDoc.set({
      test: true,
      timestamp: new Date(),
      source: 'health-check-script',
    });
    console.log('✅ Write operation successful');

    // Read test
    console.log('   Reading test document...');
    const doc = await testDoc.get();
    if (doc.exists) {
      console.log('✅ Read operation successful');
      console.log(`   Data: ${JSON.stringify(doc.data())}`);
    } else {
      throw new Error('Document not found after write');
    }

    // Cleanup
    console.log('   Cleaning up test document...');
    await testDoc.delete();
    console.log('✅ Cleanup successful');

    // Test collections listing
    console.log('\n📁 Testing collections access...');
    const collections = await firestore.listCollections();
    console.log(`✅ Found ${collections.length} collections`);
    collections.forEach(collection => {
      console.log(`   - ${collection.id}`);
    });

    await app.delete();

    return {
      success: true,
      message: 'All Firebase tests passed',
      details: {
        projectId,
        hasCredentials: !!(clientEmail && privateKey),
        collectionsCount: collections.length,
      },
    };
  } catch (error) {
    throw new Error(`Firebase test failed: ${error.message}`);
  }
}

async function testFirebaseRules() {
  console.log('\n🔒 Testing Firestore security rules...');

  try {
    const { initializeApp, cert, getApps } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    // Clean up existing apps
    const existingApps = getApps();
    existingApps.forEach(app => app.delete());

    let app;
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

    // Test stores collection access
    console.log('   Testing stores collection access...');
    const storesCollection = firestore.collection('stores');
    const storesSnapshot = await storesCollection.limit(1).get();
    console.log(
      `✅ Stores collection accessible (${storesSnapshot.size} documents)`
    );

    // Test products collection access
    console.log('   Testing products collection access...');
    const productsCollection = firestore.collection('products');
    const productsSnapshot = await productsCollection.limit(1).get();
    console.log(
      `✅ Products collection accessible (${productsSnapshot.size} documents)`
    );

    await app.delete();

    return {
      success: true,
      message: 'Security rules allow admin access',
      details: {
        storesAccessible: true,
        productsAccessible: true,
      },
    };
  } catch (error) {
    console.log(`⚠️ Security rules test failed: ${error.message}`);
    return {
      success: false,
      message: 'Security rules may be too restrictive for admin access',
      details: { error: error.message },
    };
  }
}

async function main() {
  console.log('🔥 Firebase Health Check');
  console.log('='.repeat(25) + '\n');

  await loadEnvironment();

  const results = [];

  try {
    const connectionResult = await testFirebaseConnection();
    results.push({ name: 'Connection Test', ...connectionResult });
  } catch (error) {
    console.error(`❌ ${error.message}`);
    results.push({
      name: 'Connection Test',
      success: false,
      message: error.message,
    });
  }

  try {
    const rulesResult = await testFirebaseRules();
    results.push({ name: 'Security Rules Test', ...rulesResult });
  } catch (error) {
    console.error(`❌ ${error.message}`);
    results.push({
      name: 'Security Rules Test',
      success: false,
      message: error.message,
    });
  }

  console.log('\n' + '='.repeat(40));
  console.log('📊 FIREBASE HEALTH SUMMARY');
  console.log('='.repeat(40));

  let allPassed = true;
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.message}`);
    if (result.details) {
      Object.entries(result.details).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }
    if (!result.success) allPassed = false;
  });

  console.log('\n' + '='.repeat(40));

  if (allPassed) {
    console.log('🎉 Firebase is healthy and ready!');
    process.exit(0);
  } else {
    console.log('⚠️ Firebase has issues that need attention');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Firebase health check failed:', error);
    process.exit(1);
  });
}
