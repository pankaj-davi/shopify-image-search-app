#!/usr/bin/env node

/**
 * 🏥 Health Check Script
 * Verifies the health of the application and its dependencies
 */

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadConfig() {
  try {
    // Load environment variables
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
    console.error('❌ Error loading configuration:', error.message);
  }
}

async function checkDatabaseHealth() {
  console.log('🗄️ Checking database health...');
  
  const provider = process.env.DATABASE_PROVIDER || 'firebase';
  
  try {
    switch (provider) {
      case 'firebase':
        return await checkFirebaseHealth();
      case 'prisma':
        return await checkPrismaHealth();
      default:
        console.log(`ℹ️ Health check not implemented for ${provider}`);
        return { healthy: true, message: 'Health check not implemented' };
    }
  } catch (error) {
    return { healthy: false, message: error.message };
  }
}

async function checkFirebaseHealth() {
  try {
    const { initializeApp, cert } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID not configured');
    }
    
    let app;
    try {
      // Try to initialize Firebase app
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
      
      // Test connection with a simple read
      const testDoc = await firestore.collection('health-check').doc('test').get();
      
      return { 
        healthy: true, 
        message: 'Firebase connection successful',
        details: { projectId, hasCredentials: !!(clientEmail && privateKey) }
      };
    } catch (error) {
      throw new Error(`Firebase connection failed: ${error.message}`);
    }
  } catch (error) {
    throw new Error(`Firebase module error: ${error.message}`);
  }
}

async function checkPrismaHealth() {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test database connection
    await prisma.$connect();
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    await prisma.$disconnect();
    
    return { 
      healthy: true, 
      message: 'Prisma database connection successful',
      details: { databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@') }
    };
  } catch (error) {
    throw new Error(`Prisma connection failed: ${error.message}`);
  }
}

async function checkEnvironmentVariables() {
  console.log('🔧 Checking environment variables...');
  
  const required = [
    'DATABASE_PROVIDER',
    'SHOPIFY_API_KEY',
    'SHOPIFY_API_SECRET',
    'SHOPIFY_APP_URL'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    return {
      healthy: false,
      message: `Missing required environment variables: ${missing.join(', ')}`
    };
  }
  
  return {
    healthy: true,
    message: 'All required environment variables are set',
    details: {
      provider: process.env.DATABASE_PROVIDER,
      hasFirebaseConfig: !!(process.env.FIREBASE_PROJECT_ID),
      hasPrismaConfig: !!(process.env.DATABASE_URL)
    }
  };
}

async function checkDependencies() {
  console.log('📦 Checking dependencies...');
  
  try {
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    
    const criticalDeps = [
      '@remix-run/node',
      '@shopify/shopify-app-remix',
      'firebase-admin'
    ];
    
    const missing = criticalDeps.filter(dep => 
      !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
    );
    
    if (missing.length > 0) {
      return {
        healthy: false,
        message: `Missing critical dependencies: ${missing.join(', ')}`
      };
    }
    
    return {
      healthy: true,
      message: 'All critical dependencies are present',
      details: {
        totalDependencies: Object.keys(packageJson.dependencies || {}).length,
        totalDevDependencies: Object.keys(packageJson.devDependencies || {}).length
      }
    };
  } catch (error) {
    return {
      healthy: false,
      message: `Error checking dependencies: ${error.message}`
    };
  }
}

async function checkBuildArtifacts() {
  console.log('🏗️ Checking build artifacts...');
  
  try {
    const buildPath = join(__dirname, '..', 'build');
    const buildExists = await fs.access(buildPath).then(() => true).catch(() => false);
    
    if (!buildExists) {
      return {
        healthy: false,
        message: 'Build artifacts not found. Run "npm run build" first.'
      };
    }
    
    const serverIndexPath = join(buildPath, 'server', 'index.js');
    const serverIndexExists = await fs.access(serverIndexPath).then(() => true).catch(() => false);
    
    if (!serverIndexExists) {
      return {
        healthy: false,
        message: 'Server build artifacts incomplete'
      };
    }
    
    return {
      healthy: true,
      message: 'Build artifacts are present and valid'
    };
  } catch (error) {
    return {
      healthy: false,
      message: `Error checking build artifacts: ${error.message}`
    };
  }
}

async function main() {
  console.log('🏥 Starting health check...\n');
  
  await loadConfig();
  
  const checks = [
    { name: 'Environment Variables', fn: checkEnvironmentVariables },
    { name: 'Dependencies', fn: checkDependencies },
    { name: 'Database', fn: checkDatabaseHealth },
    { name: 'Build Artifacts', fn: checkBuildArtifacts }
  ];
  
  const results = [];
  let allHealthy = true;
  
  for (const check of checks) {
    console.log(`\n🔍 ${check.name}:`);
    try {
      const result = await check.fn();
      results.push({ name: check.name, ...result });
      
      if (result.healthy) {
        console.log(`✅ ${result.message}`);
        if (result.details) {
          console.log(`   Details:`, result.details);
        }
      } else {
        console.log(`❌ ${result.message}`);
        allHealthy = false;
      }
    } catch (error) {
      console.log(`❌ ${error.message}`);
      results.push({ name: check.name, healthy: false, message: error.message });
      allHealthy = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 HEALTH CHECK SUMMARY');
  console.log('='.repeat(50));
  
  results.forEach(result => {
    const status = result.healthy ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.message}`);
  });
  
  console.log('\n' + '='.repeat(50));
  
  if (allHealthy) {
    console.log('🎉 All systems healthy!');
    process.exit(0);
  } else {
    console.log('⚠️ Some systems need attention');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Health check failed:', error);
    process.exit(1);
  });
}
