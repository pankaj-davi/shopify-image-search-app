#!/usr/bin/env node

/**
 * Railway Token Setup Guide
 * Step-by-step guide to get and configure Railway token
 */

console.log('🚂 Railway Token Setup Guide\n');

function showStep(number, title, details) {
  console.log(`\n${number}. 🎯 ${title}`);
  details.forEach(detail => console.log(`   ${detail}`));
}

function showRailwaySetup() {
  console.log('🚂 **RAILWAY TOKEN SETUP GUIDE**\n');

  showStep('1', 'Create Railway Account', [
    '• Go to: https://railway.app',
    '• Sign up with GitHub (recommended) or email',
    '• Verify your email if needed',
    '• Complete the onboarding flow',
  ]);

  showStep('2', 'Get Your API Token', [
    '• Once logged in, go to: https://railway.app/account/tokens',
    '• Or: Dashboard → Profile (top right) → Account → Tokens',
    '• Click "Create New Token"',
    '• Give it a name like "GitHub Actions Deploy"',
    '• Copy the token (it starts with "ry_")',
    "• ⚠️  Save it immediately - you can't see it again!",
  ]);

  showStep('3', 'Create Railway Project', [
    '• Go to: https://railway.app/new',
    '• Click "Deploy from GitHub repo"',
    '• Connect your GitHub account if needed',
    '• Select: pankaj-davi/shopify-image-search-app',
    '• Choose the "develop" branch',
    "• Railway will auto-detect it's a Node.js app",
  ]);

  showStep('4', 'Add Token to GitHub Secrets', [
    '• Go to: https://github.com/pankaj-davi/shopify-image-search-app/settings/secrets/actions',
    '• Click "New repository secret"',
    '• Name: RAILWAY_TOKEN',
    '• Value: Paste your Railway token (starts with "ry_")',
    '• Click "Add secret"',
  ]);

  showStep('5', 'Test the Deployment', [
    '• Go to: https://github.com/pankaj-davi/shopify-image-search-app/actions',
    '• Click "🧪 Deploy to Development"',
    '• Click "Run workflow"',
    '• Select "railway" as platform',
    '• Click "Run workflow"',
    '• Watch the deployment logs!',
  ]);

  console.log('\n🔗 **Quick Links:**');
  console.log('• Railway Dashboard: https://railway.app/dashboard');
  console.log('• Railway Tokens: https://railway.app/account/tokens');
  console.log(
    '• GitHub Secrets: https://github.com/pankaj-davi/shopify-image-search-app/settings/secrets/actions'
  );
  console.log(
    '• GitHub Actions: https://github.com/pankaj-davi/shopify-image-search-app/actions'
  );

  console.log('\n💡 **Tips:**');
  console.log('• Railway offers 5$ free credits per month');
  console.log('• Your Shopify app will get a custom railway.app domain');
  console.log('• Railway auto-scales and handles HTTPS certificates');
  console.log('• You can add custom domains later');

  console.log('\n🆘 **Need Help?**');
  console.log('• Railway Docs: https://docs.railway.app');
  console.log('• Railway Discord: https://discord.gg/railway');
  console.log('• GitHub Issues: Create an issue in your repo');
}

function showAlternativePlatforms() {
  console.log('\n🌐 **ALTERNATIVE DEPLOYMENT PLATFORMS**\n');

  console.log("If Railway doesn't work, try these other options:\n");

  showStep('1', 'Vercel (Recommended Alternative)', [
    '• Go to: https://vercel.com',
    '• Sign up with GitHub',
    '• Import your GitHub repository',
    '• Get token: https://vercel.com/account/tokens',
    '• Add VERCEL_TOKEN to GitHub secrets',
    '• Perfect for frontend apps and Next.js',
  ]);

  showStep('2', 'Heroku (Traditional Choice)', [
    '• Go to: https://heroku.com',
    '• Create account and verify',
    '• Go to: https://dashboard.heroku.com/account',
    '• Scroll to "API Key" section',
    '• Reveal and copy the API key',
    '• Add HEROKU_API_KEY to GitHub secrets',
  ]);

  showStep('3', 'Docker (Self-Hosted)', [
    '• No external tokens needed',
    '• Uses your own Docker registry',
    '• Can deploy to any VPS or cloud provider',
    '• More control but requires more setup',
  ]);

  console.log('\n🎯 **Recommendation:**');
  console.log('For a Shopify app, Railway is the easiest option because:');
  console.log('• ✅ Automatic Node.js detection');
  console.log('• ✅ Built-in PostgreSQL if needed');
  console.log('• ✅ Custom domains and SSL');
  console.log('• ✅ Great for both dev and production');
}

function showTokenValidation() {
  console.log('\n🔍 **VALIDATE YOUR TOKEN**\n');

  console.log('Once you have your Railway token, test it locally:');
  console.log('');
  console.log('```bash');
  console.log('# Set your token as environment variable');
  console.log('export RAILWAY_TOKEN="your_token_here"');
  console.log('');
  console.log('# Or add to .env file');
  console.log('echo "RAILWAY_TOKEN=your_token_here" >> .env');
  console.log('');
  console.log('# Test the deployment');
  console.log('npm run deploy:dev:railway');
  console.log('```');
  console.log('');
  console.log('If it works locally, it will work in GitHub Actions!');
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'railway':
    case 'token':
      showRailwaySetup();
      break;

    case 'alternatives':
    case 'other':
      showAlternativePlatforms();
      break;

    case 'validate':
    case 'test':
      showTokenValidation();
      break;

    case 'all':
      showRailwaySetup();
      showAlternativePlatforms();
      showTokenValidation();
      break;

    default:
      console.log('Choose a guide:');
      console.log('• node railway-token-guide.js railway    # Railway setup');
      console.log(
        '• node railway-token-guide.js alternatives # Other platforms'
      );
      console.log(
        '• node railway-token-guide.js validate    # Test your token'
      );
      console.log('• node railway-token-guide.js all         # Complete guide');
      showRailwaySetup();
  }
}

main();
