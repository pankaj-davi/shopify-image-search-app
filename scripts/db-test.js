#!/usr/bin/env node

/**
 * Simple Database Operation Tester
 * Quick test for database operations with error catching
 */

import fs from 'fs';

console.log('🗄️ Database Operation Test\n');

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message) {
  console.log(`❌ ${message}`);
}

function logWarning(message) {
  console.log(`⚠️  ${message}`);
}

async function testDatabaseEnvironment() {
  logInfo('Testing database environment setup...');
  
  // Check environment variables
  const dbProvider = process.env.DATABASE_PROVIDER || 'firebase';
  logInfo(`Database provider: ${dbProvider}`);
  
  // Check if .env exists
  if (fs.existsSync('.env')) {
    logSuccess('.env file found');
  } else {
    logWarning('.env file not found');
  }
  
  // Check database-specific requirements
  switch (dbProvider) {
    case 'firebase':
      const firebaseVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
      const missingFirebase = firebaseVars.filter(v => !process.env[v]);
      if (missingFirebase.length === 0) {
        logSuccess('Firebase environment variables configured');
      } else {
        logWarning(`Missing Firebase vars: ${missingFirebase.join(', ')}`);
      }
      break;
    case 'prisma':
      if (process.env.DATABASE_URL) {
        logSuccess('Prisma DATABASE_URL configured');
      } else {
        logWarning('DATABASE_URL not set for Prisma');
      }
      break;
  }
  
  // Check if database scripts exist
  const scripts = ['backup-database.js', 'restore-database.js', 'health-check.js'];
  scripts.forEach(script => {
    if (fs.existsSync(`scripts/${script}`)) {
      logSuccess(`Script found: ${script}`);
    } else {
      logWarning(`Script missing: ${script}`);
    }
  });
  
  console.log('\n📊 Environment Test Complete');
  return true;
}

// Run test
testDatabaseEnvironment().catch(error => {
  logError(`Test failed: ${error.message}`);
  process.exit(1);
});
