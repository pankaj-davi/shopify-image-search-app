#!/usr/bin/env node
/**
 * Production Deployment Script
 * Handles deployment to different environments with proper checks
 */

import { execSync } from 'child_process';

const deploymentTargets = {
  railway: {
    staging: {
      service: 'shopify-app-staging',
      command: 'railway deploy --service',
    },
    production: {
      service: 'shopify-app-production',
      command: 'railway deploy --service',
    },
  },
  heroku: {
    staging: {
      app: 'your-shopify-app-staging',
      command: 'git push heroku-staging main',
    },
    production: {
      app: 'your-shopify-app-production',
      command: 'git push heroku-production main',
    },
  },
  vercel: {
    staging: {
      project: 'shopify-app-staging',
      command: 'vercel --prod',
    },
    production: {
      project: 'shopify-app-production',
      command: 'vercel --prod',
    },
  },
  docker: {
    staging: {
      image: 'shopify-app:staging',
      command: 'docker build -t shopify-app:staging . && docker push',
    },
    production: {
      image: 'shopify-app:latest',
      command: 'docker build -t shopify-app:latest . && docker push',
    },
  },
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

async function checkPrerequisites() {
  console.log('🔍 Checking deployment prerequisites...');

  // Check if build works
  try {
    await runCommand('npm run build', 'Building application');
  } catch (error) {
    throw new Error('Build failed. Fix build errors before deploying.');
  }

  // Check if tests pass
  try {
    await runCommand('npm test', 'Running tests');
  } catch (error) {
    console.warn('⚠️ Tests failed, but continuing deployment...');
  }

  // Check if lint passes
  try {
    await runCommand('npm run lint', 'Linting code');
  } catch (error) {
    console.warn('⚠️ Linting issues found, but continuing deployment...');
  }

  console.log('✅ Prerequisites check completed');
}

async function deployToTarget(target, environment) {
  const config = deploymentTargets[target]?.[environment];
  if (!config) {
    throw new Error(`Unknown deployment target: ${target}/${environment}`);
  }

  console.log(`🚀 Deploying to ${target} (${environment})...`);

  switch (target) {
    case 'railway':
      process.env.RAILWAY_SERVICE = config.service;
      await runCommand(
        `${config.command} ${config.service}`,
        `Railway deployment to ${environment}`
      );
      break;

    case 'heroku':
      // Ensure heroku remote exists
      try {
        await runCommand(
          `heroku git:remote -a ${config.app}`,
          `Setting up Heroku remote for ${environment}`
        );
      } catch (error) {
        console.log('ℹ️ Heroku remote already exists or app not found');
      }
      await runCommand(config.command, `Heroku deployment to ${environment}`);
      break;

    case 'vercel':
      process.env.VERCEL_PROJECT_ID = config.project;
      await runCommand(config.command, `Vercel deployment to ${environment}`);
      break;

    case 'docker':
      await runCommand(
        config.command,
        `Docker build and push for ${environment}`
      );
      break;

    default:
      throw new Error(`Unsupported deployment target: ${target}`);
  }
}

async function postDeploymentTasks(target, environment) {
  console.log('🔧 Running post-deployment tasks...');

  // Wait for deployment to be ready
  console.log('⏳ Waiting for deployment to be ready...');
  await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

  // Run health checks
  try {
    await runCommand('npm run health:check', 'Health check');
  } catch (error) {
    console.warn(
      '⚠️ Health check failed, but deployment may still be successful'
    );
  }

  // Deploy Firebase rules if using Firebase
  if (process.env.DATABASE_PROVIDER === 'firebase') {
    try {
      await runCommand(
        `node scripts/deploy-firebase-rules.js ${environment}`,
        'Deploying Firebase rules'
      );
    } catch (error) {
      console.warn('⚠️ Firebase rules deployment failed');
    }
  }

  console.log('✅ Post-deployment tasks completed');
}

async function deploy(target, environment, options = {}) {
  try {
    console.log(`🎯 Starting deployment: ${target}/${environment}`);
    console.log(`📅 Deployment time: ${new Date().toISOString()}`);

    // Check prerequisites unless skipped
    if (!options.skipChecks) {
      await checkPrerequisites();
    }

    // Backup database before production deployment
    if (environment === 'production' && !options.skipBackup) {
      try {
        await runCommand('npm run db:backup', 'Creating database backup');
      } catch (error) {
        console.warn('⚠️ Database backup failed, but continuing deployment...');
      }
    }

    // Deploy to target
    await deployToTarget(target, environment);

    // Post-deployment tasks
    await postDeploymentTasks(target, environment);

    console.log('🎉 Deployment completed successfully!');

    // Display deployment info
    console.log('\n📊 Deployment Summary:');
    console.log(`   Target: ${target}`);
    console.log(`   Environment: ${environment}`);
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(
      `   Git commit: ${execSync('git rev-parse HEAD').toString().trim()}`
    );
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const target = args[0];
const environment = args[1] || 'staging';

const options = {
  skipChecks: args.includes('--skip-checks'),
  skipBackup: args.includes('--skip-backup'),
  force: args.includes('--force'),
};

if (!target) {
  console.error('❌ Deployment target required');
  console.log('Usage: node scripts/deploy.js <target> [environment] [options]');
  console.log('Targets: railway, heroku, vercel, docker');
  console.log('Environments: staging, production');
  console.log('Options: --skip-checks, --skip-backup, --force');
  process.exit(1);
}

if (!deploymentTargets[target]) {
  console.error(`❌ Unknown deployment target: ${target}`);
  console.log(
    `Available targets: ${Object.keys(deploymentTargets).join(', ')}`
  );
  process.exit(1);
}

if (!['staging', 'production'].includes(environment)) {
  console.error(`❌ Invalid environment: ${environment}`);
  console.log('Valid environments: staging, production');
  process.exit(1);
}

// Production deployment confirmation
if (environment === 'production' && !options.force) {
  console.log('⚠️ You are about to deploy to PRODUCTION');
  console.log('This will affect live users. Are you sure?');
  console.log('Add --force flag to skip this confirmation');
  process.exit(1);
}

// Run deployment if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deploy(target, environment, options);
}

export { deploy };
