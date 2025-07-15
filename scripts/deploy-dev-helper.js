#!/usr/bin/env node

/**
 * Development Deployment Helper
 * Quick deployment manager for development environment
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Development Deployment Helper\n');

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

async function checkDeploymentReadiness() {
  logInfo('🔍 Checking deployment readiness...');

  let ready = true;
  const issues = [];

  // Check if we're on develop branch
  try {
    const branch = execSync('git branch --show-current', {
      encoding: 'utf8',
    }).trim();
    if (branch === 'develop') {
      logSuccess(`On correct branch: ${branch}`);
    } else {
      logWarning(
        `Currently on branch: ${branch}. Consider switching to develop.`
      );
      issues.push('Not on develop branch');
    }
  } catch (error) {
    logError('Could not determine git branch');
    ready = false;
  }

  // Check if there are uncommitted changes
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim() === '') {
      logSuccess('No uncommitted changes');
    } else {
      logWarning('You have uncommitted changes:');
      console.log(status);
      issues.push('Uncommitted changes');
    }
  } catch (error) {
    logWarning('Could not check git status');
  }

  // Check if local is ahead of remote
  try {
    const ahead = execSync('git rev-list --count HEAD...origin/develop', {
      encoding: 'utf8',
    }).trim();
    if (ahead === '0') {
      logSuccess('Local branch is synced with remote');
    } else {
      logWarning(`Local branch is ${ahead} commits ahead of remote`);
      issues.push('Local ahead of remote');
    }
  } catch (error) {
    logWarning('Could not check remote sync status');
  }

  // Check build status
  try {
    logInfo('Running quick build check...');
    execSync('npm run build:check', { stdio: 'inherit' });
    logSuccess('Build check passed');
  } catch (error) {
    logError('Build check failed');
    ready = false;
    issues.push('Build failures');
  }

  // Check database environment
  try {
    logInfo('Running database environment check...');
    execSync('npm run db:test', { stdio: 'inherit' });
    logSuccess('Database environment check passed');
  } catch (error) {
    logWarning('Database environment check had warnings');
    issues.push('Database environment issues');
  }

  console.log('\n📊 Deployment Readiness Report:');
  console.log(`Ready to deploy: ${ready ? '✅ YES' : '❌ NO'}`);

  if (issues.length > 0) {
    console.log('\n⚠️  Issues to consider:');
    issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
  }

  return ready;
}

async function showDeploymentOptions() {
  console.log('\n🎯 Deployment Options:\n');

  console.log('1. 🌐 **GitHub Actions Deployment (Recommended)**');
  console.log('   - Automatic on push to develop branch');
  console.log('   - Manual trigger available at: https://github.com/pankaj-davi/shopify-image-search-app/actions');
  console.log('   - Full CI/CD pipeline with testing');
  console.log('');

  console.log('2. 🏠 **Local Development (Quick Start)**');
  console.log('   - npm run dev (starts local Shopify development server)');
  console.log('   - Perfect for testing and development');
  console.log('   - Auto-reloading and live updates');
  console.log('');

  console.log('3. 🚂 **Railway Deployment**');
  console.log('   - npm run deploy:dev:railway');
  console.log('   - Requires RAILWAY_TOKEN environment variable');
  console.log('   - Fast and easy deployment');
  console.log('');

  console.log('4. � **Other Platforms**');
  console.log('   - npm run deploy:dev:heroku (Heroku)');
  console.log('   - npm run deploy:dev:vercel (Vercel)');
  console.log('   - npm run deploy:dev:docker (Docker)');
  console.log('');

  console.log('5. 🐳 **Docker Deployment**');
  console.log('   - npm run docker:build');
  console.log('   - npm run deploy:dev:docker');
  console.log('   - Great for local testing or self-hosting');
}

async function deployToRailway() {
  logInfo('🚂 Deploying to Railway...');

  try {
    // Check if railway CLI is available
    try {
      execSync('railway --version', { stdio: 'pipe' });
      logSuccess('Railway CLI found');
    } catch (error) {
      logError('Railway CLI not found. Installing...');
      execSync('npm install -g @railway/cli', { stdio: 'inherit' });
      logSuccess('Railway CLI installed');
    }

    // Check for Railway token
    if (!process.env.RAILWAY_TOKEN) {
      logError('RAILWAY_TOKEN environment variable not set');
      console.log('To deploy to Railway:');
      console.log('1. Get your token from: https://railway.app/account/tokens');
      console.log('2. Set it as environment variable: export RAILWAY_TOKEN=your_token');
      console.log('3. Or add it to your .env file: RAILWAY_TOKEN=your_token');
      return false;
    }

    // Login to Railway
    logInfo('Authenticating with Railway...');
    execSync(`echo "${process.env.RAILWAY_TOKEN}" | railway login --token`, { stdio: 'inherit' });

    // Set environment
    logInfo('Setting development environment...');
    execSync('railway environment development || railway environment create development', { stdio: 'inherit' });

    // Deploy
    logInfo('Deploying application...');
    execSync('railway up --detach', { stdio: 'inherit' });

    logSuccess('Railway deployment completed!');
    logInfo('🔗 Check your deployment at: https://railway.app');
    
    return true;

  } catch (error) {
    logError(`Railway deployment failed: ${error.message}`);
    
    // Provide helpful suggestions
    console.log('\n💡 Troubleshooting suggestions:');
    console.log('1. Make sure you have a Railway account and project set up');
    console.log('2. Verify your RAILWAY_TOKEN is correct');
    console.log('3. Check if your project has the correct Git remote');
    console.log('4. Try deploying manually with: railway up');
    
    return false;
  }
}

async function startLocalDev() {
  logInfo('🏠 Starting local development server...');

  try {
    logInfo('Starting Shopify development server...');
    console.log('\n🔗 This will start your app locally with live reloading');
    console.log('Press Ctrl+C to stop the server\n');

    execSync('npm run dev', { stdio: 'inherit' });
  } catch (error) {
    logError(`Local development failed: ${error.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === '--help' || command === '-h') {
    console.log(`
Development Deployment Helper

Usage:
  node deploy-dev-helper.js [command]

Commands:
  check       Check if ready for deployment
  options     Show all deployment options
  railway     Deploy to Railway
  local       Start local development server
  quick       Quick setup and start local development
  help        Show this help

Examples:
  node deploy-dev-helper.js check
  node deploy-dev-helper.js quick
  node deploy-dev-helper.js railway
  node deploy-dev-helper.js local
    `);
    return;
  }

  switch (command) {
    case 'check':
      await checkDeploymentReadiness();
      break;

    case 'options':
      await showDeploymentOptions();
      break;

    case 'railway':
      const ready = await checkDeploymentReadiness();
      if (ready) {
        await deployToRailway();
      } else {
        logError('Please fix the issues above before deploying');
      }
      break;

    case 'local':
      await startLocalDev();
      break;
      
    case 'quick':
      logInfo('🚀 Quick local development setup...');
      const quickReady = await checkDeploymentReadiness();
      if (quickReady) {
        logInfo('Environment is ready! Starting local development...');
        await startLocalDev();
      } else {
        logError('Please fix the issues above before starting development');
      }
      break;

    default:
      logInfo('🔍 Checking deployment readiness...');
      await checkDeploymentReadiness();
      console.log('');
      await showDeploymentOptions();
      console.log('\n💡 Run with --help for more options');
  }
}

main().catch(error => {
  logError(`Deployment helper failed: ${error.message}`);
  process.exit(1);
});
