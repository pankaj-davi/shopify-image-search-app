#!/usr/bin/env node
/**
 * Development Deployment Script
 * Quick deployment for development environment
 */

import { execSync } from 'child_process';
import fs from 'fs';

const DEV_CONFIG = {
  environment: 'development',
  platform: process.argv[2] || 'railway', // railway, heroku, vercel, docker
  branch: 'develop',
  skipTests: process.argv.includes('--skip-tests'),
  skipBuild: process.argv.includes('--skip-build'),
  force: process.argv.includes('--force')
};

async function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

async function setupDevEnvironment() {
  console.log('🔧 Setting up development environment...');
  
  // Generate development environment
  await runCommand('npm run setup:env development', 'Generate development environment');
  
  // Check if .env exists, if not copy from .env.example
  if (!fs.existsSync('.env')) {
    if (fs.existsSync('.env.example')) {
      await runCommand('copy .env.example .env', 'Copy environment template');
      console.log('⚠️ Please edit .env file with your development values');
    }
  }
  
  console.log('✅ Development environment setup completed');
}

async function deployToDevelopment() {
  try {
    console.log('🧪 Starting development deployment...');
    console.log(`📅 Deployment time: ${new Date().toISOString()}`);
    console.log(`🎯 Platform: ${DEV_CONFIG.platform}`);
    
    // Setup environment
    await setupDevEnvironment();
    
    // Run tests (unless skipped)
    if (!DEV_CONFIG.skipTests) {
      console.log('🧪 Running tests...');
      try {
        await runCommand('npm run lint', 'Lint code');
        await runCommand('npm test', 'Run tests');
      } catch (error) {
        if (!DEV_CONFIG.force) {
          throw error;
        }
        console.warn('⚠️ Tests failed but continuing due to --force flag');
      }
    }
    
    // Build application (unless skipped)
    if (!DEV_CONFIG.skipBuild) {
      await runCommand('npm run build', 'Build application');
    }
    
    // Setup development database
    console.log('🗄️ Setting up development database...');
    try {
      await runCommand('npm run health:firebase', 'Test Firebase connection');
      await runCommand('npm run db:seed', 'Seed development database');
    } catch (error) {
      console.warn('⚠️ Database setup had issues, but continuing...');
    }
    
    // Deploy based on platform
    await deployToPlatform(DEV_CONFIG.platform);
    
    // Post-deployment tasks
    await postDeploymentTasks();
    
    console.log('🎉 Development deployment completed successfully!');
    
    // Display deployment info
    console.log('\n📊 Development Deployment Summary:');
    console.log(`   Platform: ${DEV_CONFIG.platform}`);
    console.log(`   Environment: ${DEV_CONFIG.environment}`);
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Branch: ${DEV_CONFIG.branch}`);
    
  } catch (error) {
    console.error('❌ Development deployment failed:', error.message);
    process.exit(1);
  }
}

async function deployToPlatform(platform) {
  console.log(`🚀 Deploying to ${platform} (development)...`);
  
  switch (platform) {
    case 'railway':
      await deployToRailway();
      break;
    case 'heroku':
      await deployToHeroku();
      break;
    case 'vercel':
      await deployToVercel();
      break;
    case 'docker':
      await deployToDocker();
      break;
    case 'local':
      await deployLocal();
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

async function deployToRailway() {
  try {
    // Check if Railway CLI is installed
    execSync('railway --version', { stdio: 'pipe' });
  } catch (error) {
    console.log('📦 Installing Railway CLI...');
    await runCommand('npm install -g @railway/cli', 'Install Railway CLI');
  }
  
  await runCommand('railway login', 'Login to Railway');
  await runCommand('railway environment development', 'Set development environment');
  await runCommand('railway up --service shopify-app-dev', 'Deploy to Railway');
}

async function deployToHeroku() {
  try {
    execSync('heroku --version', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('Heroku CLI not installed. Please install it first.');
  }
  
  await runCommand('heroku git:remote -a shopify-app-dev', 'Setup Heroku remote');
  await runCommand('git push heroku develop:main', 'Deploy to Heroku');
}

async function deployToVercel() {
  try {
    execSync('vercel --version', { stdio: 'pipe' });
  } catch (error) {
    console.log('📦 Installing Vercel CLI...');
    await runCommand('npm install -g vercel', 'Install Vercel CLI');
  }
  
  await runCommand('vercel --prod --yes', 'Deploy to Vercel');
}

async function deployToDocker() {
  await runCommand('docker build -f Dockerfile.staging -t shopify-app:dev .', 'Build Docker image');
  await runCommand('docker run -d -p 3000:3000 --name shopify-app-dev shopify-app:dev', 'Run Docker container');
  console.log('🐳 Development app running at http://localhost:3000');
}

async function deployLocal() {
  console.log('🏠 Starting local development server...');
  console.log('📝 Note: This will start the development server locally');
  console.log('🌐 App will be available at http://localhost:3000');
  
  // Start development server in background
  execSync('npm run dev', { stdio: 'inherit' });
}

async function postDeploymentTasks() {
  console.log('🔧 Running post-deployment tasks...');
  
  // Deploy Firebase rules for development
  try {
    await runCommand('npm run firebase:rules development', 'Deploy Firebase rules');
  } catch (error) {
    console.warn('⚠️ Firebase rules deployment failed');
  }
  
  // Wait and run health check
  console.log('⏳ Waiting for deployment to be ready...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  try {
    await runCommand('npm run health:check', 'Health check');
  } catch (error) {
    console.warn('⚠️ Health check failed, but deployment may still be successful');
  }
  
  console.log('✅ Post-deployment tasks completed');
}

// Show usage if no platform specified
if (process.argv.length < 3 && !process.argv.includes('--help')) {
  console.log('🧪 Development Deployment Script');
  console.log('\nUsage: npm run deploy:dev <platform> [options]');
  console.log('\nPlatforms:');
  console.log('  railway    Deploy to Railway (recommended)');
  console.log('  heroku     Deploy to Heroku');
  console.log('  vercel     Deploy to Vercel');
  console.log('  docker     Deploy with Docker locally');
  console.log('  local      Run development server locally');
  console.log('\nOptions:');
  console.log('  --skip-tests   Skip running tests');
  console.log('  --skip-build   Skip building application');
  console.log('  --force        Continue deployment even if tests fail');
  console.log('\nExamples:');
  console.log('  npm run deploy:dev railway');
  console.log('  npm run deploy:dev docker --skip-tests');
  console.log('  npm run deploy:dev local --force');
  process.exit(0);
}

// Run deployment if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployToDevelopment();
}

export { deployToDevelopment };
