#!/usr/bin/env node

/**
 * Simplified Local CI Testing Script
 * Run all CI checks locally before pushing to prevent failures
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Local CI Testing - Preventing Remote Failures');
console.log('=================================================');
console.log(`📅 Started: ${new Date().toLocaleString()}`);

const results = {};
let totalErrors = 0;

function runCheck(name, command, description) {
  console.log(`\n🔄 ${description}...`);
  console.log(`💻 Command: ${command}`);
  console.log('─'.repeat(60));

  const start = Date.now();

  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe'],
      cwd: process.cwd(),
    });

    const duration = Date.now() - start;
    results[name] = { status: 'PASS', duration };
    console.log(`✅ ${description} passed (${duration}ms)`);

    if (output && output.trim().length < 200) {
      console.log(`📄 Output: ${output.trim()}`);
    }
  } catch (error) {
    const duration = Date.now() - start;
    results[name] = { status: 'FAIL', duration, error: error.message };
    totalErrors++;

    console.log(`❌ ${description} failed (${duration}ms)`);
    if (error.stdout) {
      console.log(`📄 Output: ${error.stdout.slice(0, 300)}`);
    }
    if (error.stderr) {
      console.log(`🚨 Error: ${error.stderr.slice(0, 300)}`);
    }
  }
}

// Prerequisites check
console.log('\n📋 Checking Prerequisites:');
const files = [
  { file: 'package.json', desc: 'package.json' },
  { file: 'package-lock.json', desc: 'package-lock.json' },
  { file: '.eslintrc.json', desc: 'ESLint config' },
  { file: 'tsconfig.json', desc: 'TypeScript config' },
];

files.forEach(({ file, desc }) => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${desc} exists`);
  } else {
    console.log(`⚠️ ${desc} missing`);
  }
});

// Run CI checks
console.log('\n🔍 Running CI Checks:');

// 1. Code formatting
runCheck('format', 'npx prettier --check .', '🎨 Code Formatting Check');

// 2. Linting
runCheck('lint', 'npm run lint', '🔍 ESLint Code Quality Check');

// 3. TypeScript
runCheck('typecheck', 'npx tsc --noEmit', '🔧 TypeScript Compilation Check');

// 4. Security (focusing on high/critical vulnerabilities)
try {
  runCheck(
    'security',
    'npm audit --audit-level high',
    '🔒 Security Vulnerability Check (High/Critical)'
  );
} catch (error) {
  console.log(
    '📝 Note: Only moderate dev dependencies found - focusing on high/critical'
  );
}

// 5. Tests
runCheck('tests', 'npm test', '🧪 Test Suite Execution');

// 6. Build
runCheck('build', 'npm run build:check', '🏗️ Build System Validation');

// 7. Database health
if (fs.existsSync('scripts/health-check.js')) {
  runCheck('database', 'npm run db:health', '🗄️ Database Health Check');
} else {
  results.database = { status: 'SKIP', duration: 0 };
  console.log('⏭️ Database health check skipped (script not found)');
}

// Generate report
console.log('\n📊 LOCAL CI TEST RESULTS');
console.log('========================');

const passed = Object.values(results).filter(r => r.status === 'PASS').length;
const failed = Object.values(results).filter(r => r.status === 'FAIL').length;
const skipped = Object.values(results).filter(r => r.status === 'SKIP').length;

console.log(
  `📈 Summary: ${passed} passed, ${failed} failed, ${skipped} skipped`
);

if (failed === 0) {
  console.log('\n🎉 ALL CHECKS PASSED! Safe to push to remote.');
  console.log('\n🚀 Ready to push:');
  console.log('   git add .');
  console.log("   git commit -m 'your message'");
  console.log('   git push origin develop');
} else {
  console.log(`\n⚠️ ${failed} check(s) failed - fix before pushing`);
  console.log('\n🔧 Common fixes:');
  console.log('   npm run ci:fix     - Auto-fix formatting and lint issues');
  console.log('   npm run lint --fix - Fix ESLint issues');
  console.log('   npx prettier --write . - Fix formatting');
}

console.log('\n📋 Detailed Results:');
Object.entries(results).forEach(([name, result]) => {
  const status =
    result.status === 'PASS'
      ? '✅ PASS'
      : result.status === 'FAIL'
        ? '❌ FAIL'
        : '⏭️ SKIP';
  const time = result.duration ? `(${result.duration}ms)` : '';
  console.log(`${status} ${name.padEnd(12)} ${time}`);
});

// Save report
try {
  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: { passed, failed, skipped },
  };
  fs.writeFileSync('local-ci-report.json', JSON.stringify(report, null, 2));
  console.log('\n💾 Report saved to: local-ci-report.json');
} catch (error) {
  console.log('\n⚠️ Could not save report');
}

console.log('\n📖 Available Commands:');
console.log('   npm run ci:test    - Run this comprehensive test');
console.log('   npm run ci:fix     - Auto-fix common issues');
console.log('   npm run pre-push   - Quick validation before push');
console.log('   npm run check      - Alternative quick check');

// Exit with error if any checks failed
if (totalErrors > 0) {
  console.log(`\n❌ Exiting with ${totalErrors} error(s)`);
  process.exit(1);
} else {
  console.log('\n✅ All checks passed!');
}
