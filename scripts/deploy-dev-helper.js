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
  console.log('   - Manual trigger available');
  console.log('   - Full CI/CD pipeline with testing');
  console.log('');

  console.log('2. 🖥️  **Local Script Deployment**');
  console.log('   - npm run deploy:dev (Railway - default)');
  console.log('   - npm run deploy:dev:railway');
  console.log('   - npm run deploy:dev:heroku');
  console.log('   - npm run deploy:dev:vercel');
  console.log('   - npm run deploy:dev:docker');
  console.log('');

  console.log('3. 🐳 **Docker Deployment**');
  console.log('   - npm run docker:build');
  console.log('   - npm run deploy:dev:docker');
  console.log('');

  console.log('4. 🏪 **Shopify CLI Development**');
  console.log('   - npm run dev (starts local development server)');
  console.log('   - shopify app dev (alternative)');
}

async function deployToRailway() {
  logInfo('🚂 Deploying to Railway...');

  try {
    // Check if railway CLI is available
    execSync('railway --version', { stdio: 'pipe' });
    logSuccess('Railway CLI found');

    // Deploy using npm script
    execSync('npm run deploy:dev:railway', { stdio: 'inherit' });
    logSuccess('Railway deployment completed!');

    logInfo(
      '🔗 Your development app should be available at your Railway domain'
    );
  } catch (error) {
    if (error.message.includes('railway')) {
      logError('Railway CLI not found. Please install it first:');
      console.log('   npm install -g @railway/cli');
      console.log('   railway login');
    } else {
      logError(`Railway deployment failed: ${error.message}`);
    }
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
  help        Show this help

Examples:
  node deploy-dev-helper.js check
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
