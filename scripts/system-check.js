#!/usr/bin/env node

/**
 * Comprehensive System Check Script
 * Runs all important checks in sequence and reports results
 */

import { execSync } from 'child_process';

class SystemChecker {
  constructor() {
    this.results = {
      lint: { status: 'pending', output: '' },
      security: { status: 'pending', output: '' },
      tests: { status: 'pending', output: '' },
      build: { status: 'pending', output: '' },
      database: { status: 'pending', output: '' },
    };
  }

  /**
   * Run a command and capture results
   */
  runCheck(name, command, description) {
    console.log(`\n🔄 Running ${description}...`);
    console.log(`Command: ${command}`);
    console.log('─'.repeat(50));

    try {
      const output = execSync(command, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.results[name] = {
        status: 'passed',
        output: output.trim(),
      };

      console.log(`✅ ${description} passed`);
      if (output.trim()) {
        console.log(
          'Output:',
          output.slice(0, 500) + (output.length > 500 ? '...' : '')
        );
      }
    } catch (error) {
      this.results[name] = {
        status: 'failed',
        output: error.stdout || error.message,
        error: error.stderr || error.message,
      };

      console.log(`❌ ${description} failed`);
      if (error.stdout) {
        console.log(
          'Output:',
          error.stdout.slice(0, 500) + (error.stdout.length > 500 ? '...' : '')
        );
      }
      if (error.stderr) {
        console.log(
          'Error:',
          error.stderr.slice(0, 300) + (error.stderr.length > 300 ? '...' : '')
        );
      }
    }
  }

  /**
   * Run all system checks
   */
  async runAllChecks() {
    console.log('🔍 Starting Comprehensive System Check');
    console.log('=====================================');
    console.log(`Timestamp: ${new Date().toISOString()}`);

    // 1. Lint check
    this.runCheck('lint', 'npm run lint', 'ESLint Code Quality Check');

    // 2. Security audit
    this.runCheck(
      'security',
      'npm audit --audit-level moderate',
      'Security Vulnerability Audit'
    );

    // 3. Tests
    this.runCheck('tests', 'npm test', 'Unit and Integration Tests');

    // 4. Build check
    this.runCheck('build', 'npm run build:check', 'Build System Check');

    // 5. Database health
    this.runCheck('database', 'npm run db:health', 'Database Health Check');

    // Generate summary
    this.generateSummary();
  }

  /**
   * Generate comprehensive summary
   */
  generateSummary() {
    console.log('\n📊 COMPREHENSIVE SYSTEM CHECK SUMMARY');
    console.log('====================================');

    const passed = Object.values(this.results).filter(
      r => r.status === 'passed'
    ).length;
    const failed = Object.values(this.results).filter(
      r => r.status === 'failed'
    ).length;
    const total = Object.values(this.results).length;

    console.log(`\n📈 Overall Status: ${passed}/${total} checks passed`);

    if (failed === 0) {
      console.log('🎉 All checks passed! System is healthy.');
    } else {
      console.log(`⚠️ ${failed} check(s) failed - review needed.`);
    }

    console.log('\n📋 Detailed Results:');
    console.log('───────────────────');

    Object.entries(this.results).forEach(([name, result]) => {
      const status =
        result.status === 'passed'
          ? '✅ PASS'
          : result.status === 'failed'
            ? '❌ FAIL'
            : '⏳ PENDING';

      console.log(
        `${status} ${name.padEnd(10)} - ${this.getCheckDescription(name)}`
      );

      if (result.status === 'failed' && result.error) {
        console.log(`     Issue: ${result.error.slice(0, 100)}...`);
      }
    });

    // Next steps
    this.showNextSteps();
  }

  /**
   * Get description for each check type
   */
  getCheckDescription(name) {
    const descriptions = {
      lint: 'Code quality and style consistency',
      security: 'Dependency vulnerability scanning',
      tests: 'Unit and integration test execution',
      build: 'Build system validation',
      database: 'Database connectivity and health',
    };
    return descriptions[name] || name;
  }

  /**
   * Show recommended next steps
   */
  showNextSteps() {
    console.log('\n🎯 Recommended Next Steps:');
    console.log('──────────────────────────');

    const failedChecks = Object.entries(this.results)
      .filter(([_, result]) => result.status === 'failed')
      .map(([name, _]) => name);

    if (failedChecks.length === 0) {
      console.log('✅ System is ready for deployment!');
      console.log('💡 You can proceed with:');
      console.log('   npm run deploy:dev');
      console.log('   npm run workflow:test-deploy');
    } else {
      console.log('🔧 Fix the following issues before deployment:');

      failedChecks.forEach(check => {
        switch (check) {
          case 'lint':
            console.log('   • Run: npm run lint --fix');
            break;
          case 'security':
            console.log('   • Run: npm audit fix');
            console.log('   • Review: npm run security:check');
            break;
          case 'tests':
            console.log('   • Fix failing tests and run: npm test');
            break;
          case 'build':
            console.log('   • Fix build issues and run: npm run build');
            break;
          case 'database':
            console.log(
              '   • Check database connection: npm run health:firebase'
            );
            break;
        }
      });
    }

    console.log('\n📊 Monitoring commands:');
    console.log('   npm run workflow:status  - Check GitHub Actions');
    console.log('   npm run deploy:status    - Check deployment status');
    console.log('   npm run health:check     - Overall health check');
  }
}

// CLI interface
async function main() {
  const checker = new SystemChecker();
  await checker.runAllChecks();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default SystemChecker;
