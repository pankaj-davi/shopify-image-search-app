#!/usr/bin/env node

/**
 * Pre-Push Validation Script
 * Quick validation before pushing to prevent CI failures
 */

import { execSync } from 'child_process';
import fs from 'fs';

class PrePushValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    }[type];

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  runCommand(command, description, options = {}) {
    this.log(`Running: ${description}`);

    try {
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: options.silent
          ? ['pipe', 'pipe', 'pipe']
          : ['inherit', 'pipe', 'pipe'],
      });

      this.log(`${description} - PASSED`, 'success');
      return { success: true, output: result };
    } catch (error) {
      const message = `${description} - FAILED`;
      this.log(message, 'error');
      this.errors.push({ check: description, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async quickValidation() {
    console.log('🚀 Pre-Push Quick Validation');
    console.log('============================');

    // 1. Check for uncommitted changes
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        this.log('You have uncommitted changes', 'warning');
        this.warnings.push('Uncommitted changes detected');
      } else {
        this.log('Git working directory is clean', 'success');
      }
    } catch (error) {
      this.log('Could not check git status', 'warning');
    }

    // 2. Quick syntax check
    const syntaxCheck = this.runCommand(
      'npx tsc --noEmit --skipLibCheck',
      'TypeScript syntax check',
      { silent: true }
    );

    // 3. Quick lint check
    const lintCheck = this.runCommand('npm run lint', 'ESLint check', {
      silent: true,
    });

    // 4. Check if build files exist
    if (fs.existsSync('build')) {
      this.log('Build directory exists', 'success');
    } else {
      this.log(
        "Build directory missing - consider running 'npm run build'",
        'warning'
      );
      this.warnings.push('No build directory found');
    }

    // 5. Check package-lock.json
    if (fs.existsSync('package-lock.json')) {
      this.log('package-lock.json exists', 'success');
    } else {
      this.log('package-lock.json missing', 'error');
      this.errors.push({ check: 'package-lock.json', error: 'File missing' });
    }

    return this.generateQuickReport();
  }

  generateQuickReport() {
    console.log('\n📊 Quick Validation Results');
    console.log('===========================');

    if (this.errors.length === 0 && this.warnings.length === 0) {
      this.log('🎉 ALL CHECKS PASSED! Safe to push.', 'success');
      console.log('\n🚀 Ready to push:');
      console.log('   git push origin develop');
      return true;
    }

    if (this.errors.length > 0) {
      this.log(`❌ ${this.errors.length} error(s) found:`, 'error');
      this.errors.forEach(error => {
        console.log(`   • ${error.check}: ${error.error}`);
      });
      console.log('\n🔧 Run full validation:');
      console.log('   npm run ci:test');
      return false;
    }

    if (this.warnings.length > 0) {
      this.log(`⚠️ ${this.warnings.length} warning(s):`, 'warning');
      this.warnings.forEach(warning => {
        console.log(`   • ${warning}`);
      });
      console.log('\n💡 Consider fixing warnings before pushing');
      console.log('🚀 Or proceed with push if warnings are acceptable');
      return true;
    }

    return true;
  }
}

// Run validation
async function main() {
  const validator = new PrePushValidator();
  const result = await validator.quickValidation();

  // Exit with error code if validation failed
  if (!result) {
    process.exit(1);
  }
}

main().catch(console.error);

export default PrePushValidator;
