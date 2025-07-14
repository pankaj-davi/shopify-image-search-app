#!/usr/bin/env node
/**
 * Firebase Rules Deployment Script
 * Deploys Firestore security rules for different environments
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const environments = {
  development: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    rules: 'firestore-dev.rules',
  },
  staging: {
    projectId: process.env.STAGING_FIREBASE_PROJECT_ID,
    rules: 'firestore-staging.rules',
  },
  production: {
    projectId: process.env.PRODUCTION_FIREBASE_PROJECT_ID,
    rules: 'firestore-production.rules',
  },
};

function createFirestoreRules(environment) {
  const rules = {
    development: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Development: Allow all operations for easier testing
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`,
    staging: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Staging: Basic auth required
    match /stores/{shopDomain} {
      allow read, write: if request.auth != null;
    }
    
    match /products/{productId} {
      allow read, write: if request.auth != null;
    }
    
    match /storeEvents/{eventId} {
      allow read, write: if request.auth != null;
    }
  }
}`,
    production: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Production: Strict security rules
    match /stores/{shopDomain} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.shopDomain == shopDomain;
    }
    
    match /products/{productId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.shopDomain == resource.data.shopDomain;
    }
    
    match /storeEvents/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}`,
  };

  return rules[environment] || rules.production;
}

async function deployRules(environment = 'development') {
  try {
    console.log(`🔒 Deploying Firestore rules for ${environment}...`);

    const config = environments[environment];
    if (!config || !config.projectId) {
      throw new Error(
        `Invalid environment or missing project ID for ${environment}`
      );
    }

    // Create rules directory if it doesn't exist
    const rulesDir = 'firestore-rules';
    if (!fs.existsSync(rulesDir)) {
      fs.mkdirSync(rulesDir);
    }

    // Create rules file
    const rulesPath = path.join(rulesDir, config.rules);
    const rulesContent = createFirestoreRules(environment);
    fs.writeFileSync(rulesPath, rulesContent);

    console.log(`📝 Rules file created: ${rulesPath}`);

    // Deploy rules using Firebase CLI
    try {
      execSync(
        `firebase deploy --only firestore:rules --project ${config.projectId}`,
        {
          stdio: 'inherit',
          cwd: process.cwd(),
        }
      );

      console.log(`✅ Firestore rules deployed successfully to ${environment}`);
    } catch (deployError) {
      console.error(`❌ Failed to deploy rules: ${deployError.message}`);
      console.log(
        '💡 Make sure Firebase CLI is installed and you are authenticated'
      );
      console.log('💡 Run: npm install -g firebase-tools && firebase login');
    }
  } catch (error) {
    console.error(`❌ Error deploying Firestore rules: ${error.message}`);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args[0] || 'development';

if (!environments[environment]) {
  console.error(`❌ Invalid environment: ${environment}`);
  console.log('Valid environments: development, staging, production');
  process.exit(1);
}

// Run deployment if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployRules(environment);
}

export { deployRules };
