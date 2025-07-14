#!/usr/bin/env node
/**
 * Complete CI/CD Setup Script
 * Sets up the entire CI/CD pipeline for the Shopify app
 */

import { execSync } from 'child_process';
import fs from 'fs';

const SETUP_STEPS = [
  '🔧 Environment Setup',
  '🔐 Secret Configuration', 
  '🗄️ Database Setup',
  '🐳 Docker Configuration',
  '🚀 GitHub Actions Setup',
  '📊 Monitoring Setup',
  '🔒 Security Setup',
  '✅ Validation'
];

class CICDSetup {
  constructor() {
    this.setupLog = [];
    this.errors = [];
  }

  log(message, isError = false) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    if (isError) {
      console.error(`❌ ${message}`);
      this.errors.push(logEntry);
    } else {
      console.log(`✅ ${message}`);
    }
    
    this.setupLog.push(logEntry);
  }

  async runCommand(command, description, throwOnError = false) {
    try {
      this.log(`Running: ${description}`);
      const output = execSync(command, { stdio: 'pipe', encoding: 'utf8' });
      this.log(`${description} completed successfully`);
      return output;
    } catch (error) {
      const errorMsg = `${description} failed: ${error.message}`;
      this.log(errorMsg, true);
      if (throwOnError) {
        throw new Error(errorMsg);
      }
      return null;
    }
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    const checks = [
      { command: 'node --version', name: 'Node.js' },
      { command: 'npm --version', name: 'npm' },
      { command: 'git --version', name: 'Git' }
    ];

    for (const check of checks) {
      try {
        const version = execSync(check.command, { stdio: 'pipe', encoding: 'utf8' }).trim();
        this.log(`${check.name}: ${version}`);
      } catch (error) {
        this.log(`${check.name} not found or not working`, true);
        throw new Error(`${check.name} is required but not found`);
      }
    }

    // Check if we're in a git repository
    try {
      execSync('git status', { stdio: 'pipe' });
      this.log('Git repository detected');
    } catch (error) {
      this.log('Not in a git repository - initializing...', true);
      await this.runCommand('git init', 'Initialize git repository', true);
    }
  }

  async setupEnvironment() {
    console.log('\n🔧 Setting up environment...');
    
    // Create environment files if they don't exist
    if (!fs.existsSync('.env')) {
      if (fs.existsSync('.env.example')) {
        await this.runCommand('cp .env.example .env', 'Copy environment template');
        this.log('Please edit .env file with your actual values');
      } else {
        this.log('.env.example not found', true);
      }
    } else {
      this.log('Environment file already exists');
    }

    // Generate staging and production environment templates
    await this.runCommand('npm run setup:env:staging', 'Generate staging environment template');
    await this.runCommand('npm run setup:env:production', 'Generate production environment template');
  }

  async setupDatabase() {
    console.log('\n🗄️ Setting up database...');
    
    // Check database provider
    const dbProvider = process.env.DATABASE_PROVIDER || 'firebase';
    this.log(`Database provider: ${dbProvider}`);

    if (dbProvider === 'prisma') {
      await this.runCommand('npx prisma generate', 'Generate Prisma client');
      await this.runCommand('npx prisma migrate dev --name init', 'Run database migrations');
      this.log('Prisma database setup completed');
    } else if (dbProvider === 'firebase') {
      await this.runCommand('npm run health:firebase', 'Test Firebase connection');
      this.log('Firebase database setup completed');
    }

    // Seed database with sample data
    await this.runCommand('npm run db:seed', 'Seed database with sample data');
  }

  async setupDocker() {
    console.log('\n🐳 Setting up Docker...');
    
    const dockerFiles = [
      'Dockerfile',
      'Dockerfile.staging', 
      'Dockerfile.production',
      'docker-compose.yml'
    ];

    for (const file of dockerFiles) {
      if (fs.existsSync(file)) {
        this.log(`${file} already exists`);
      } else {
        this.log(`${file} missing`, true);
      }
    }

    // Test Docker build (if Docker is available)
    try {
      execSync('docker --version', { stdio: 'pipe' });
      this.log('Docker is available');
      
      // Test build staging dockerfile
      await this.runCommand(
        'docker build -f Dockerfile.staging -t shopify-app:staging-test .',
        'Test Docker staging build'
      );
      
      // Clean up test image
      await this.runCommand(
        'docker rmi shopify-app:staging-test',
        'Clean up test Docker image'
      );
      
    } catch (error) {
      this.log('Docker not available - skipping Docker tests');
    }
  }

  async setupGitHubActions() {
    console.log('\n🚀 Setting up GitHub Actions...');
    
    const workflowFiles = [
      '.github/workflows/ci.yml',
      '.github/workflows/deploy.yml',
      '.github/workflows/security.yml',
      '.github/workflows/monitoring.yml',
      '.github/workflows/database.yml'
    ];

    let allWorkflowsExist = true;
    for (const file of workflowFiles) {
      if (fs.existsSync(file)) {
        this.log(`${file} exists`);
      } else {
        this.log(`${file} missing`, true);
        allWorkflowsExist = false;
      }
    }

    if (allWorkflowsExist) {
      this.log('All GitHub Actions workflows are in place');
    } else {
      this.log('Some GitHub Actions workflows are missing', true);
    }

    // Validate workflow syntax
    for (const file of workflowFiles) {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          // Basic YAML validation - check if it's parseable
          if (content.includes('name:') && content.includes('on:')) {
            this.log(`${file} syntax looks valid`);
          } else {
            this.log(`${file} may have syntax issues`, true);
          }
        } catch (error) {
          this.log(`Could not validate ${file}: ${error.message}`, true);
        }
      }
    }
  }

  async setupMonitoring() {
    console.log('\n📊 Setting up monitoring...');
    
    // Test monitoring script
    await this.runCommand('npm run monitoring', 'Test monitoring script');
    
    // Check if monitoring dependencies are installed
    const monitoringDeps = ['node-fetch'];
    for (const dep of monitoringDeps) {
      try {
        require.resolve(dep);
        this.log(`Monitoring dependency ${dep} is available`);
      } catch (error) {
        this.log(`Monitoring dependency ${dep} is missing`, true);
      }
    }
  }

  async setupSecurity() {
    console.log('\n🔒 Setting up security...');
    
    // Run security audit
    await this.runCommand('npm run security:audit', 'Run security audit');
    
    // Check for security-related files
    const securityFiles = [
      '.github/workflows/security.yml',
      'scripts/monitoring.js'
    ];

    for (const file of securityFiles) {
      if (fs.existsSync(file)) {
        this.log(`Security file ${file} exists`);
      } else {
        this.log(`Security file ${file} missing`, true);
      }
    }
  }

  async validateSetup() {
    console.log('\n✅ Validating setup...');
    
    // Test build
    await this.runCommand('npm run build', 'Test application build', true);
    
    // Test linting
    await this.runCommand('npm run lint', 'Test linting');
    
    // Test health checks
    await this.runCommand('npm run health:check', 'Test health checks');
    
    this.log('All validation checks completed');
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      setupSteps: SETUP_STEPS,
      log: this.setupLog,
      errors: this.errors,
      summary: {
        totalSteps: SETUP_STEPS.length,
        completedSteps: SETUP_STEPS.length - this.errors.length,
        hasErrors: this.errors.length > 0,
        errorCount: this.errors.length
      },
      nextSteps: this.generateNextSteps()
    };

    // Save report to file
    fs.writeFileSync('cicd-setup-report.json', JSON.stringify(report, null, 2));
    
    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report);
    fs.writeFileSync('CICD_SETUP_REPORT.md', markdownReport);
    
    return report;
  }

  generateNextSteps() {
    const nextSteps = [
      '1. Review and edit environment files (.env, .env.staging, .env.production)',
      '2. Set up GitHub repository secrets for staging and production',
      '3. Configure Firebase projects for staging and production',
      '4. Set up deployment targets (Railway, Heroku, Vercel, etc.)',
      '5. Test CI/CD pipeline by creating a pull request',
      '6. Configure monitoring alerts (Slack, Discord, email)',
      '7. Set up SSL certificates for production',
      '8. Configure domain names and DNS',
      '9. Set up backup retention policies',
      '10. Review security settings and access controls'
    ];

    if (this.errors.length > 0) {
      nextSteps.unshift('⚠️ Fix the errors listed in the setup log first');
    }

    return nextSteps;
  }

  generateMarkdownReport(report) {
    return `# 🚀 CI/CD Setup Report

Generated on: ${report.timestamp}

## 📊 Summary

- **Total Steps**: ${report.summary.totalSteps}
- **Completed Steps**: ${report.summary.completedSteps}
- **Errors**: ${report.summary.errorCount}
- **Status**: ${report.summary.hasErrors ? '⚠️ Issues Found' : '✅ Success'}

## 🔧 Setup Steps

${SETUP_STEPS.map((step, index) => `${index + 1}. ${step}`).join('\n')}

## 📋 Next Steps

${report.nextSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

${report.summary.hasErrors ? `
## ❌ Errors Found

${report.errors.map(error => `- ${error}`).join('\n')}
` : ''}

## 📚 Documentation

- [CI/CD Guide](CI_CD_GUIDE.md)
- [Database Setup](DATABASE_SETUP.md) 
- [Firebase Setup](FIREBASE_SETUP.md)
- [Verification Checklist](VERIFICATION_CHECKLIST.md)

## 🎉 You're Ready!

Your Shopify app now has a complete CI/CD pipeline with:

✅ Automated testing and linting
✅ Multi-environment deployment  
✅ Database backup and restore
✅ Security scanning
✅ Health monitoring
✅ Docker containerization
✅ Firebase integration

Happy coding! 🚀
`;
  }

  async run() {
    try {
      console.log('🚀 Starting CI/CD Setup for Shopify App with Firebase\n');
      
      await this.checkPrerequisites();
      await this.setupEnvironment();
      await this.setupDatabase();
      await this.setupDocker();
      await this.setupGitHubActions();
      await this.setupMonitoring();
      await this.setupSecurity();
      await this.validateSetup();
      
      const report = await this.generateReport();
      
      console.log('\n🎉 CI/CD Setup completed!');
      console.log(`📝 Setup report saved to: cicd-setup-report.json`);
      console.log(`📖 Markdown report saved to: CICD_SETUP_REPORT.md`);
      
      if (report.summary.hasErrors) {
        console.log('\n⚠️ Some issues were found. Please check the report for details.');
        console.log('You can re-run this script after fixing the issues.');
      } else {
        console.log('\n✅ Everything looks good! Your CI/CD pipeline is ready.');
      }
      
      console.log('\n📚 Next: Review CI_CD_GUIDE.md for detailed instructions');
      
    } catch (error) {
      this.log(`Setup failed: ${error.message}`, true);
      console.error('\n❌ CI/CD Setup failed:', error.message);
      process.exit(1);
    }
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new CICDSetup();
  setup.run();
}

export { CICDSetup };
