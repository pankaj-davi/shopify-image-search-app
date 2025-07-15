#!/usr/bin/env node

/**
 * Auto-fix Common CI Issues
 * Fix what can be automatically fixed before running CI tests
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔧 Auto-fixing Common CI Issues');
console.log('================================');

let fixCount = 0;

function runFix(description, command, options = {}) {
  console.log(`\n🔄 ${description}...`);

  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent
        ? ['pipe', 'pipe', 'pipe']
        : ['inherit', 'pipe', 'pipe'],
      cwd: process.cwd(),
    });

    console.log(`✅ ${description} - FIXED`);
    fixCount++;

    if (output && !options.silent && output.trim().length < 200) {
      console.log(`📄 ${output.trim()}`);
    }
  } catch (error) {
    console.log(`⚠️ ${description} - Could not auto-fix`);
    if (error.stderr && error.stderr.length < 200) {
      console.log(`🚨 ${error.stderr}`);
    }
  }
}

// 1. Fix code formatting
runFix('Code formatting', 'npx prettier --write .');

// 2. Fix ESLint issues that can be auto-fixed
runFix('ESLint auto-fixable issues', 'npm run lint -- --fix');

// 3. Generate package-lock.json if missing
if (!fs.existsSync('package-lock.json')) {
  runFix('Missing package-lock.json', 'npm install');
} else {
  console.log('✅ package-lock.json already exists');
}

// 4. Try to fix TypeScript issues by regenerating types
try {
  if (fs.existsSync('prisma/schema.prisma')) {
    runFix('Regenerate Prisma types', 'npx prisma generate');
  }
} catch (error) {
  console.log('⚠️ Could not regenerate Prisma types');
}

// 5. Clear caches that might cause issues
try {
  runFix(
    'Clear build cache',
    'rm -rf build/* || rmdir /s build 2>nul || true',
    { silent: true }
  );
  runFix(
    'Clear TypeScript cache',
    'rm -rf .tsbuildinfo || del .tsbuildinfo 2>nul || true',
    { silent: true }
  );
} catch (error) {
  // Cache clearing is optional
}

console.log('\n📊 Auto-fix Results');
console.log('===================');
console.log(`🔧 ${fixCount} issues auto-fixed`);

if (fixCount > 0) {
  console.log('\n🔄 Run these commands to verify fixes:');
  console.log('   npm run ci:test    - Run full CI tests again');
  console.log('   npm run pre-push   - Quick validation');
} else {
  console.log('\n💡 No issues were auto-fixable');
  console.log('   Check the CI test output for manual fixes needed');
}

console.log('\n📝 Common manual fixes:');
console.log('   • TypeScript errors: Fix syntax issues in your code');
console.log('   • Test failures: Fix failing tests');
console.log('   • Security issues: Review and update vulnerable packages');
console.log('   • Database issues: Check connection and environment variables');

console.log('\n✅ Auto-fix completed!');
