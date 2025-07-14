#!/usr/bin/env node

/**
 * Simple Build Error Catcher
 * Catches and reports common build errors with solutions
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('\n🚀 Starting build with error catching...\n');

const errors = [];
const warnings = [];

function logError(message, solution = '') {
  console.log(`❌ ERROR: ${message}`);
  if (solution) console.log(`   💡 Solution: ${solution}`);
  errors.push({ message, solution });
}

function logWarning(message) {
  console.log(`⚠️  WARNING: ${message}`);
  warnings.push(message);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

async function runCommand(command, context) {
  try {
    logInfo(`Running ${context}...`);
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd(),
    });

    // Check for warnings in output
    if (result.includes('warning') || result.includes('WARNING')) {
      const warnings = result
        .split('\n')
        .filter(line => line.toLowerCase().includes('warning'));
      warnings.forEach(warning => logWarning(`${context}: ${warning.trim()}`));
    }

    logSuccess(`${context} completed`);
    return { success: true, output: result };
  } catch (error) {
    const errorMessage = error.message || error.toString();
    const stdout = error.stdout || '';
    const stderr = error.stderr || '';

    // Analyze specific error types
    if (context === 'TypeScript Check') {
      if (errorMessage.includes('error TS')) {
        logError(
          `TypeScript compilation failed: ${stderr}`,
          'Fix TypeScript errors shown above. Run "npx tsc --noEmit" for details.'
        );
      }
    } else if (context === 'Linting') {
      if (errorMessage.includes('ESLint')) {
        logError(
          `ESLint found issues: ${stderr}`,
          'Fix linting errors or run "npm run lint -- --fix" to auto-fix.'
        );
      }
    } else if (context === 'Build') {
      if (errorMessage.includes('MODULE_NOT_FOUND')) {
        logError(
          'Missing dependencies detected',
          'Run "npm install" to install missing packages.'
        );
      } else if (errorMessage.includes('out of memory')) {
        logError(
          'Build failed due to memory issues',
          'Try "export NODE_OPTIONS=--max-old-space-size=4096" before building.'
        );
      } else if (errorMessage.includes('Permission denied')) {
        logError(
          'Permission denied during build',
          'Check file permissions and ensure you have write access to build directory.'
        );
      }
    }

    logError(
      `${context} failed: ${errorMessage}`,
      'Check the error details above'
    );
    return { success: false, error: errorMessage, stdout, stderr };
  }
}

// Main build process
async function main() {
  const startTime = Date.now();

  logInfo('Checking environment...');

  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    logError(
      'package.json not found',
      'Ensure you are in a valid Node.js project directory'
    );
    process.exit(1);
  }

  // Check if node_modules exists
  if (!fs.existsSync('node_modules')) {
    logWarning(
      'node_modules not found - dependencies may need to be installed'
    );
  }

  logSuccess('Environment check passed');

  // Run TypeScript check
  await runCommand('npx tsc --noEmit', 'TypeScript Check');

  // Run linting
  await runCommand('npm run lint', 'Linting');

  // Run build
  const buildResult = await runCommand('npm run build', 'Build');

  // Report results
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(50));
  console.log('📊 BUILD SUMMARY');
  console.log('='.repeat(50));
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`⚠️  Warnings: ${warnings.length}`);
  console.log(`❌ Errors: ${errors.length}`);

  if (warnings.length > 0) {
    console.log('\n🔸 WARNINGS:');
    warnings.forEach((warning, i) => console.log(`  ${i + 1}. ${warning}`));
  }

  if (errors.length > 0) {
    console.log('\n🔸 ERRORS:');
    errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error.message}`);
      if (error.solution) {
        console.log(`     💡 ${error.solution}`);
      }
    });
    console.log('\n💥 Build failed with errors!');
    process.exit(1);
  } else {
    console.log('\n🎉 Build completed successfully!');
  }

  console.log('='.repeat(50));
}

main().catch(error => {
  console.error('\n💥 Build script crashed:', error.message);
  process.exit(1);
});
