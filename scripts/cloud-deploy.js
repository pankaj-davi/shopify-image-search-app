#!/usr/bin/env node

/**
 * Simple Cloud Deployment Trigger
 * Triggers GitHub Actions deployment without requiring external tokens
 */

import { execSync } from 'child_process';

console.log('🌐 Cloud Deployment Trigger\n');

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message) {
  console.log(`❌ ${message}`);
}

async function triggerGitHubDeployment() {
  logInfo('🚀 Triggering GitHub Actions deployment...');

  try {
    // Check if we have any pending changes
    const status = execSync('git status --porcelain', { encoding: 'utf8' });

    if (status.trim() !== '') {
      logInfo('📝 Found uncommitted changes. Committing them first...');

      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "feat: trigger development deployment"', {
        stdio: 'inherit',
      });

      logSuccess('Changes committed');
    }

    // Push to trigger deployment
    logInfo('📤 Pushing to GitHub to trigger deployment...');
    execSync('git push origin develop', { stdio: 'inherit' });

    logSuccess('Deployment triggered!');

    // Provide next steps
    console.log('\n🎯 Next Steps:');
    console.log(
      '1. 🔗 Monitor deployment: https://github.com/pankaj-davi/shopify-image-search-app/actions'
    );
    console.log('2. 📋 Check the "🧪 Deploy to Development" workflow');
    console.log('3. ⏱️  Deployment typically takes 2-3 minutes');
    console.log("4. 🔔 You'll get notified when it's complete");

    return true;
  } catch (error) {
    logError(`Failed to trigger deployment: ${error.message}`);

    console.log('\n💡 Alternative options:');
    console.log(
      '1. 🌐 Manual trigger: Go to GitHub Actions and click "Run workflow"'
    );
    console.log('2. 🔧 Check repository secrets if platform deployment fails');
    console.log('3. 📞 Contact your DevOps team for platform-specific tokens');

    return false;
  }
}

async function showDeploymentStatus() {
  logInfo('📊 Checking current deployment status...');

  try {
    // Get the latest commit
    const latestCommit = execSync('git rev-parse HEAD', {
      encoding: 'utf8',
    }).trim();
    const commitMessage = execSync('git log -1 --pretty=%B', {
      encoding: 'utf8',
    }).trim();
    const branch = execSync('git branch --show-current', {
      encoding: 'utf8',
    }).trim();

    console.log('\n📋 Current Status:');
    console.log(`🌿 Branch: ${branch}`);
    console.log(`📝 Latest commit: ${latestCommit.substring(0, 8)}`);
    console.log(`💬 Message: ${commitMessage}`);

    // Check if we're on develop branch
    if (branch === 'develop') {
      logSuccess('On develop branch - auto-deployment will trigger on push');
    } else {
      logInfo(
        `Current branch: ${branch}. Switch to develop for auto-deployment.`
      );
    }

    console.log('\n🔗 Useful Links:');
    console.log(
      '• GitHub Actions: https://github.com/pankaj-davi/shopify-image-search-app/actions'
    );
    console.log(
      '• Repository: https://github.com/pankaj-davi/shopify-image-search-app'
    );
    console.log(
      '• Latest Workflows: Check the Actions tab for deployment status'
    );
  } catch (error) {
    logError(`Could not check status: ${error.message}`);
  }
}

async function showManualTriggerInstructions() {
  console.log('\n🎮 Manual Deployment Trigger Instructions:\n');

  console.log('1. 🌐 **Via GitHub Web Interface:**');
  console.log(
    '   • Go to: https://github.com/pankaj-davi/shopify-image-search-app/actions'
  );
  console.log('   • Click on "🧪 Deploy to Development" workflow');
  console.log('   • Click "Run workflow" button');
  console.log('   • Select platform: railway, heroku, vercel, or docker');
  console.log('   • Click "Run workflow"');
  console.log('');

  console.log('2. 📝 **Via Git Push (Automatic):**');
  console.log('   • Any push to develop branch triggers deployment');
  console.log('   • Current status: Ready to deploy on next push');
  console.log('');

  console.log('3. 🔧 **Platform Requirements:**');
  console.log('   • Railway: Needs RAILWAY_TOKEN secret');
  console.log('   • Heroku: Needs HEROKU_API_KEY secret');
  console.log('   • Vercel: Needs VERCEL_TOKEN secret');
  console.log('   • Docker: Needs DOCKER_REGISTRY secrets (optional)');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'trigger':
    case 'deploy':
      await triggerGitHubDeployment();
      break;

    case 'status':
      await showDeploymentStatus();
      break;

    case 'manual':
    case 'instructions':
      await showManualTriggerInstructions();
      break;

    case 'help':
    case '--help':
      console.log(`
Cloud Deployment Trigger

Usage:
  node cloud-deploy.js [command]

Commands:
  trigger     Trigger deployment by pushing to GitHub
  status      Show current deployment status
  manual      Show manual trigger instructions
  help        Show this help

Examples:
  node cloud-deploy.js trigger
  node cloud-deploy.js status
  node cloud-deploy.js manual
      `);
      break;

    default:
      console.log('🌐 Current deployment status:');
      await showDeploymentStatus();
      console.log('\n🚀 To deploy:');
      console.log('• Run: node cloud-deploy.js trigger');
      console.log('• Or: node cloud-deploy.js manual');
  }
}

main().catch(error => {
  console.error(`❌ Script failed: ${error.message}`);
  process.exit(1);
});
