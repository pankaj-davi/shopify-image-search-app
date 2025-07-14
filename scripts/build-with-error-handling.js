#!/usr/bin/env node

/**
 * Build script with comprehensive error handling and reporting
 * This script catches and reports build errors for both local and Docker builds
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bright: '\x1b[1m',
};

class BuildErrorHandler {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.startTime = Date.now();
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logError(error, context = '') {
    const errorInfo = {
      message: error.message || error,
      context,
      timestamp: new Date().toISOString(),
      stack: error.stack,
    };
    this.errors.push(errorInfo);

    this.log(
      `❌ ERROR${context ? ` (${context})` : ''}: ${errorInfo.message}`,
      'red'
    );
    if (errorInfo.stack) {
      this.log(`Stack trace: ${errorInfo.stack}`, 'red');
    }
  }

  logWarning(warning, context = '') {
    const warningInfo = {
      message: warning.message || warning,
      context,
      timestamp: new Date().toISOString(),
    };
    this.warnings.push(warningInfo);

    this.log(
      `⚠️  WARNING${context ? ` (${context})` : ''}: ${warningInfo.message}`,
      'yellow'
    );
  }

  logSuccess(message) {
    this.log(`✅ ${message}`, 'green');
  }

  logInfo(message) {
    this.log(`ℹ️  ${message}`, 'blue');
  }

  async runCommand(command, context = '', options = {}) {
    this.logInfo(`Running: ${command}`);

    try {
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe',
        cwd: process.cwd(),
        ...options,
      });

      // Check for warnings in output
      if (result.includes('warning') || result.includes('WARNING')) {
        const warnings = result
          .split('\n')
          .filter(line => line.toLowerCase().includes('warning'));
        warnings.forEach(warning => this.logWarning(warning, context));
      }

      return result;
    } catch (error) {
      this.logError(error, context);
      throw error;
    }
  }

  async validateEnvironment() {
    this.logInfo('🔍 Validating build environment...');

    try {
      // Check Node.js version
      const nodeVersion = await this.runCommand(
        'node --version',
        'Node.js Version Check'
      );
      this.logSuccess(`Node.js version: ${nodeVersion.trim()}`);

      // Check npm version
      const npmVersion = await this.runCommand(
        'npm --version',
        'npm Version Check'
      );
      this.logSuccess(`npm version: ${npmVersion.trim()}`);

      // Check if package.json exists
      if (!fs.existsSync('package.json')) {
        throw new Error('package.json not found in current directory');
      }
      this.logSuccess('package.json found');

      // Check if package-lock.json exists
      if (!fs.existsSync('package-lock.json')) {
        this.logWarning(
          'package-lock.json not found - this may cause inconsistent builds'
        );
      } else {
        this.logSuccess('package-lock.json found');
      }

      return true;
    } catch (error) {
      this.logError(error, 'Environment Validation');
      return false;
    }
  }

  async installDependencies() {
    this.logInfo('📦 Installing dependencies...');

    try {
      if (fs.existsSync('package-lock.json')) {
        await this.runCommand('npm ci', 'Dependency Installation');
      } else {
        await this.runCommand('npm install', 'Dependency Installation');
      }
      this.logSuccess('Dependencies installed successfully');
      return true;
    } catch (error) {
      this.logError(error, 'Dependency Installation');
      return false;
    }
  }

  async runLinting() {
    this.logInfo('🧹 Running linting...');

    try {
      await this.runCommand('npm run lint', 'ESLint');
      this.logSuccess('Linting passed');
      return true;
    } catch (error) {
      this.logError(error, 'Linting');
      return false;
    }
  }

  async runTypeCheck() {
    this.logInfo('🔍 Running TypeScript type check...');

    try {
      await this.runCommand('npx tsc --noEmit', 'TypeScript');
      this.logSuccess('Type checking passed');
      return true;
    } catch (error) {
      this.logError(error, 'TypeScript');
      return false;
    }
  }

  async runBuild() {
    this.logInfo('🏗️  Building application...');

    try {
      const buildOutput = await this.runCommand(
        'npm run build',
        'Application Build'
      );

      // Check for specific build warnings
      if (buildOutput.includes('Generated an empty chunk')) {
        this.logWarning(
          'Empty chunks detected in build output - this may indicate unused routes'
        );
      }

      if (buildOutput.includes('dynamically imported')) {
        this.logWarning(
          'Dynamic import warnings detected - consider code splitting optimization'
        );
      }

      this.logSuccess('Application built successfully');
      return true;
    } catch (error) {
      this.logError(error, 'Application Build');
      return false;
    }
  }

  async runTests() {
    this.logInfo('🧪 Running tests...');

    try {
      await this.runCommand('npm test', 'Tests');
      this.logSuccess('Tests passed');
      return true;
    } catch (error) {
      this.logError(error, 'Tests');
      return false;
    }
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    const durationStr = `${(duration / 1000).toFixed(2)}s`;

    this.log('\n' + '='.repeat(60), 'cyan');
    this.log('📊 BUILD REPORT', 'cyan');
    this.log('='.repeat(60), 'cyan');

    this.log(`⏱️  Total build time: ${durationStr}`, 'blue');
    this.log(`⚠️  Warnings: ${this.warnings.length}`, 'yellow');
    this.log(`❌ Errors: ${this.errors.length}`, 'red');

    if (this.warnings.length > 0) {
      this.log('\n🔸 WARNINGS:', 'yellow');
      this.warnings.forEach((warning, index) => {
        this.log(
          `  ${index + 1}. [${warning.context}] ${warning.message}`,
          'yellow'
        );
      });
    }

    if (this.errors.length > 0) {
      this.log('\n🔸 ERRORS:', 'red');
      this.errors.forEach((error, index) => {
        this.log(`  ${index + 1}. [${error.context}] ${error.message}`, 'red');
      });
    }

    // Save detailed report to file
    const report = {
      timestamp: new Date().toISOString(),
      duration: durationStr,
      warnings: this.warnings,
      errors: this.errors,
      success: this.errors.length === 0,
    };

    try {
      fs.writeFileSync('build-report.json', JSON.stringify(report, null, 2));
      this.log('\n📄 Detailed report saved to build-report.json', 'blue');
    } catch (error) {
      this.logWarning('Could not save build report to file');
    }

    this.log('='.repeat(60), 'cyan');

    return this.errors.length === 0;
  }

  async runFullBuild(options = {}) {
    const {
      skipDeps = false,
      skipLint = false,
      skipTypeCheck = false,
      skipTests = false,
      skipBuild = false,
    } = options;

    this.log('\n🚀 Starting comprehensive build process...', 'bright');

    // Environment validation
    const envValid = await this.validateEnvironment();
    if (!envValid) {
      this.log('\n❌ Environment validation failed. Aborting build.', 'red');
      return false;
    }

    // Install dependencies
    if (!skipDeps) {
      const depsInstalled = await this.installDependencies();
      if (!depsInstalled) {
        this.log('\n❌ Dependency installation failed. Aborting build.', 'red');
        return false;
      }
    }

    // Run linting
    if (!skipLint) {
      await this.runLinting(); // Don't abort on lint errors, just warn
    }

    // Run type checking
    if (!skipTypeCheck) {
      const typeCheckPassed = await this.runTypeCheck();
      if (!typeCheckPassed) {
        this.log('\n❌ Type checking failed. Aborting build.', 'red');
        return false;
      }
    }

    // Run tests
    if (!skipTests) {
      await this.runTests(); // Don't abort on test failures, just warn
    }

    // Build application
    if (!skipBuild) {
      const buildPassed = await this.runBuild();
      if (!buildPassed) {
        this.log('\n❌ Application build failed. Aborting.', 'red');
        return false;
      }
    }

    const success = this.generateReport();

    if (success) {
      this.log('\n🎉 Build completed successfully!', 'green');
    } else {
      this.log('\n💥 Build completed with errors!', 'red');
    }

    return success;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  args.forEach(arg => {
    switch (arg) {
      case '--skip-deps':
        options.skipDeps = true;
        break;
      case '--skip-lint':
        options.skipLint = true;
        break;
      case '--skip-type-check':
        options.skipTypeCheck = true;
        break;
      case '--skip-tests':
        options.skipTests = true;
        break;
      case '--skip-build':
        options.skipBuild = true;
        break;
      case '--help':
        console.log(`
Usage: node build-with-error-handling.js [options]

Options:
  --skip-deps         Skip dependency installation
  --skip-lint         Skip linting
  --skip-type-check   Skip TypeScript type checking
  --skip-tests        Skip running tests
  --skip-build        Skip application build
  --help             Show this help message

Examples:
  node build-with-error-handling.js                    # Full build
  node build-with-error-handling.js --skip-tests       # Build without tests
  node build-with-error-handling.js --skip-deps        # Build assuming deps are installed
        `);
        process.exit(0);
        break;
    }
  });

  const handler = new BuildErrorHandler();
  const success = await handler.runFullBuild(options);

  process.exit(success ? 0 : 1);
}

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Check if this is the main module (ES module equivalent of require.main === module)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Build script failed:', error);
    process.exit(1);
  });
}

export { BuildErrorHandler };
