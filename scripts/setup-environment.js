#!/usr/bin/env node
/**
 * Environment Setup Script
 * Sets up environment variables for different deployment environments
 */

import fs from 'fs';

const environments = {
  development: {
    NODE_ENV: 'development',
    DATABASE_PROVIDER: 'firebase',
    SHOPIFY_APP_URL: 'https://localhost:3000',
    LOG_LEVEL: 'debug'
  },
  staging: {
    NODE_ENV: 'staging',
    DATABASE_PROVIDER: 'firebase',
    LOG_LEVEL: 'info'
  },
  production: {
    NODE_ENV: 'production',
    DATABASE_PROVIDER: 'firebase',
    LOG_LEVEL: 'warn'
  }
};

function createEnvFile(environment, secrets = {}) {
  const baseConfig = environments[environment];
  if (!baseConfig) {
    throw new Error(`Unknown environment: ${environment}`);
  }
  
  const envContent = [
    `# Environment: ${environment.toUpperCase()}`,
    `# Generated on: ${new Date().toISOString()}`,
    '',
    '# ===================================',
    '# 🗄️ DATABASE CONFIGURATION',
    '# ===================================',
    `DATABASE_PROVIDER=${baseConfig.DATABASE_PROVIDER}`,
    '',
    '# 🔥 Firebase Configuration',
    `FIREBASE_PROJECT_ID=${secrets.FIREBASE_PROJECT_ID || 'your-firebase-project-id'}`,
    `FIREBASE_CLIENT_EMAIL=${secrets.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com'}`,
    `FIREBASE_PRIVATE_KEY="${secrets.FIREBASE_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----'}"`,
    `FIREBASE_DATABASE_URL=${secrets.FIREBASE_DATABASE_URL || 'https://your-project-default-rtdb.firebaseio.com'}`,
    '',
    '# 🛍️ Shopify Configuration',
    `SHOPIFY_API_KEY=${secrets.SHOPIFY_API_KEY || 'your-shopify-api-key'}`,
    `SHOPIFY_API_SECRET=${secrets.SHOPIFY_API_SECRET || 'your-shopify-api-secret'}`,
    `SCOPES=${secrets.SCOPES || 'read_products,write_script_tags,read_themes'}`,
    `SHOPIFY_APP_URL=${secrets.SHOPIFY_APP_URL || baseConfig.SHOPIFY_APP_URL || 'https://your-app-url.com'}`,
    '',
    '# 🌍 Environment Configuration',
    `NODE_ENV=${baseConfig.NODE_ENV}`,
    `LOG_LEVEL=${baseConfig.LOG_LEVEL}`,
    '',
    '# 🗄️ Prisma Configuration (Alternative)',
    'DATABASE_URL="file:./prisma/dev.sqlite"',
    '',
    '# 🔒 Security',
    `SESSION_SECRET=${secrets.SESSION_SECRET || 'your-session-secret-key-minimum-32-characters'}`,
    '',
    '# 📊 Monitoring (Optional)',
    `SENTRY_DSN=${secrets.SENTRY_DSN || ''}`,
    `GA_TRACKING_ID=${secrets.GA_TRACKING_ID || ''}`,
    '',
    '# 🔔 Notifications (Optional)',
    `SLACK_WEBHOOK_URL=${secrets.SLACK_WEBHOOK_URL || ''}`,
    `DISCORD_WEBHOOK_URL=${secrets.DISCORD_WEBHOOK_URL || ''}`,
    ''
  ].join('\n');
  
  return envContent;
}

async function setupEnvironment(environment, options = {}) {
  try {
    console.log(`🔧 Setting up ${environment} environment...`);
    
    // Read secrets from environment variables or options
    const secrets = {
      // Firebase
      FIREBASE_PROJECT_ID: process.env[`${environment.toUpperCase()}_FIREBASE_PROJECT_ID`] || options.firebaseProjectId,
      FIREBASE_CLIENT_EMAIL: process.env[`${environment.toUpperCase()}_FIREBASE_CLIENT_EMAIL`] || options.firebaseClientEmail,
      FIREBASE_PRIVATE_KEY: process.env[`${environment.toUpperCase()}_FIREBASE_PRIVATE_KEY`] || options.firebasePrivateKey,
      FIREBASE_DATABASE_URL: process.env[`${environment.toUpperCase()}_FIREBASE_DATABASE_URL`] || options.firebaseDatabaseUrl,
      
      // Shopify
      SHOPIFY_API_KEY: process.env[`${environment.toUpperCase()}_SHOPIFY_API_KEY`] || options.shopifyApiKey,
      SHOPIFY_API_SECRET: process.env[`${environment.toUpperCase()}_SHOPIFY_API_SECRET`] || options.shopifyApiSecret,
      SHOPIFY_APP_URL: process.env[`${environment.toUpperCase()}_APP_URL`] || options.shopifyAppUrl,
      SCOPES: process.env.SCOPES || options.scopes,
      
      // Security
      SESSION_SECRET: process.env.SESSION_SECRET || options.sessionSecret,
      
      // Monitoring
      SENTRY_DSN: process.env.SENTRY_DSN || options.sentryDsn,
      GA_TRACKING_ID: process.env.GA_TRACKING_ID || options.gaTrackingId,
      
      // Notifications
      SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || options.slackWebhookUrl,
      DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL || options.discordWebhookUrl,
    };
    
    // Generate .env file content
    const envContent = createEnvFile(environment, secrets);
    
    // Write to appropriate file
    const envFileName = environment === 'development' ? '.env' : `.env.${environment}`;
    fs.writeFileSync(envFileName, envContent);
    
    console.log(`✅ Environment file created: ${envFileName}`);
    
    // Create docker-compose environment file if needed
    if (options.createDockerCompose) {
      const dockerEnvContent = envContent
        .split('\n')
        .filter(line => !line.startsWith('#') && line.trim() !== '')
        .join('\n');
      
      fs.writeFileSync(`.env.${environment}.docker`, dockerEnvContent);
      console.log(`✅ Docker environment file created: .env.${environment}.docker`);
    }
    
    // Validate required fields
    const requiredFields = ['FIREBASE_PROJECT_ID', 'SHOPIFY_API_KEY', 'SHOPIFY_API_SECRET'];
    const missingFields = requiredFields.filter(field => 
      !secrets[field] || secrets[field].includes('your-') || secrets[field].includes('YOUR_')
    );
    
    if (missingFields.length > 0) {
      console.warn('⚠️ Warning: The following fields need to be configured:');
      missingFields.forEach(field => console.warn(`   - ${field}`));
      console.log(`💡 Edit ${envFileName} with your actual values`);
    }
    
    console.log(`🎉 ${environment} environment setup complete!`);
    
  } catch (error) {
    console.error(`❌ Error setting up environment: ${error.message}`);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args[0] || 'development';

const validEnvironments = Object.keys(environments);
if (!validEnvironments.includes(environment)) {
  console.error(`❌ Invalid environment: ${environment}`);
  console.log(`Valid environments: ${validEnvironments.join(', ')}`);
  process.exit(1);
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupEnvironment(environment, {
    createDockerCompose: args.includes('--docker')
  });
}

export { setupEnvironment, createEnvFile };
