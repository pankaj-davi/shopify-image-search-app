#!/usr/bin/env node

/**
 * Security Monitoring and Vulnerability Management Script
 * Monitors npm audit, dependency vulnerabilities, and security scan results
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class SecurityMonitor {
  constructor() {
    this.vulnerabilities = [];
    this.securityReport = {
      timestamp: new Date().toISOString(),
      npm_audit: {},
      dependency_scan: {},
      recommendations: [],
      action_required: false,
    };
  }

  /**
   * Run comprehensive security scan
   */
  async runSecurityScan() {
    console.log('🔒 Starting comprehensive security scan...');

    try {
      // Run npm audit
      await this.runNpmAudit();

      // Check for known vulnerable packages
      await this.checkVulnerablePackages();

      // Generate security report
      await this.generateSecurityReport();

      // Display results
      this.displayResults();

      return this.securityReport;
    } catch (error) {
      console.error('❌ Security scan failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Run npm audit and parse results
   */
  async runNpmAudit() {
    console.log('📋 Running npm audit...');

    try {
      const auditResult = execSync('npm audit --json', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const auditData = JSON.parse(auditResult);
      this.securityReport.npm_audit = auditData;

      if (auditData.metadata && auditData.metadata.vulnerabilities) {
        const vulns = auditData.metadata.vulnerabilities;
        console.log(`📊 Found vulnerabilities:`);
        console.log(`   Critical: ${vulns.critical || 0}`);
        console.log(`   High: ${vulns.high || 0}`);
        console.log(`   Moderate: ${vulns.moderate || 0}`);
        console.log(`   Low: ${vulns.low || 0}`);

        if (vulns.critical > 0 || vulns.high > 0) {
          this.securityReport.action_required = true;
        }
      }
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities found
      if (error.stdout) {
        try {
          const auditData = JSON.parse(error.stdout);
          this.securityReport.npm_audit = auditData;
          console.log('⚠️ npm audit found vulnerabilities');
        } catch (parseError) {
          console.log('⚠️ npm audit completed with warnings');
        }
      }
    }
  }

  /**
   * Check for specific vulnerable packages
   */
  async checkVulnerablePackages() {
    console.log('🔍 Checking for known vulnerable packages...');

    const vulnerablePackages = [
      { name: 'esbuild', versions: '<=0.24.2', severity: 'moderate' },
      {
        name: 'estree-util-value-to-estree',
        versions: '<3.3.3',
        severity: 'moderate',
      },
      {
        name: '@vanilla-extract/integration',
        versions: '*',
        severity: 'moderate',
      },
      {
        name: 'remark-mdx-frontmatter',
        versions: '<=2.1.1',
        severity: 'moderate',
      },
    ];

    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
      );

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      const foundVulnerable = [];

      for (const vuln of vulnerablePackages) {
        if (allDeps[vuln.name]) {
          foundVulnerable.push({
            package: vuln.name,
            current_version: allDeps[vuln.name],
            vulnerable_versions: vuln.versions,
            severity: vuln.severity,
          });
        }
      }

      this.securityReport.dependency_scan = {
        scanned_packages: Object.keys(allDeps).length,
        vulnerable_found: foundVulnerable.length,
        vulnerabilities: foundVulnerable,
      };

      if (foundVulnerable.length > 0) {
        console.log(
          `⚠️ Found ${foundVulnerable.length} known vulnerable packages`
        );
        this.securityReport.action_required = true;
      } else {
        console.log(
          '✅ No known vulnerable packages found in direct dependencies'
        );
      }
    } catch (error) {
      console.error('❌ Error checking vulnerable packages:', error.message);
    }
  }

  /**
   * Generate security recommendations
   */
  async generateSecurityReport() {
    console.log('📝 Generating security recommendations...');

    const recommendations = [];

    // NPM audit recommendations
    if (this.securityReport.npm_audit.metadata?.vulnerabilities) {
      const vulns = this.securityReport.npm_audit.metadata.vulnerabilities;

      if (vulns.critical > 0) {
        recommendations.push({
          priority: 'CRITICAL',
          action: "Run 'npm audit fix --force' immediately",
          description: 'Critical vulnerabilities require immediate attention',
        });
      }

      if (vulns.high > 0) {
        recommendations.push({
          priority: 'HIGH',
          action: 'Review and update affected packages',
          description: 'High severity vulnerabilities should be fixed promptly',
        });
      }

      if (vulns.moderate > 0) {
        recommendations.push({
          priority: 'MODERATE',
          action: 'Schedule dependency updates',
          description:
            'Moderate vulnerabilities should be addressed in next maintenance window',
        });
      }
    }

    // Specific package recommendations
    if (this.securityReport.dependency_scan.vulnerable_found > 0) {
      recommendations.push({
        priority: 'MODERATE',
        action: 'Update vulnerable dependencies',
        description: 'Some dependencies have known security issues',
        commands: [
          'npm update estree-util-value-to-estree',
          'npm audit fix',
          'Review @remix-run dependencies for updates',
        ],
      });
    }

    // General security recommendations
    recommendations.push({
      priority: 'LOW',
      action: 'Enable automated security monitoring',
      description: 'Set up dependabot or similar automated dependency updates',
    });

    this.securityReport.recommendations = recommendations;
  }

  /**
   * Display security scan results
   */
  displayResults() {
    console.log('\n🔒 Security Scan Results');
    console.log('========================');

    if (this.securityReport.action_required) {
      console.log('🚨 ACTION REQUIRED: Security issues found');
    } else {
      console.log('✅ No critical security issues found');
    }

    if (this.securityReport.recommendations.length > 0) {
      console.log('\n📋 Recommendations:');
      this.securityReport.recommendations.forEach((rec, index) => {
        console.log(`\n${index + 1}. [${rec.priority}] ${rec.action}`);
        console.log(`   ${rec.description}`);
        if (rec.commands) {
          rec.commands.forEach(cmd => {
            console.log(`   💻 ${cmd}`);
          });
        }
      });
    }

    // Save report to file
    const reportPath = path.join(process.cwd(), 'security-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.securityReport, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  /**
   * Fix common security issues automatically
   */
  async autoFix() {
    console.log('🔧 Attempting automatic security fixes...');

    try {
      // Try npm audit fix first
      console.log('Running npm audit fix...');
      execSync('npm audit fix', { stdio: 'inherit' });

      // Update specific vulnerable packages
      console.log('Updating known vulnerable packages...');
      const updateCommands = [
        'npm update estree-util-value-to-estree',
        'npm update @types/estree', // Related package
      ];

      for (const cmd of updateCommands) {
        try {
          console.log(`Running: ${cmd}`);
          execSync(cmd, { stdio: 'inherit' });
        } catch (error) {
          console.log(`⚠️ Could not run: ${cmd}`);
        }
      }

      console.log('✅ Automatic fixes completed');
      console.log('🔄 Run security scan again to verify fixes');
    } catch (error) {
      console.error('❌ Automatic fix failed:', error.message);
      console.log('📋 Manual intervention required');
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'scan';

  const monitor = new SecurityMonitor();

  switch (command) {
    case 'scan':
      await monitor.runSecurityScan();
      break;

    case 'fix':
      await monitor.autoFix();
      break;

    case 'both':
      await monitor.runSecurityScan();
      if (monitor.securityReport.action_required) {
        console.log('\n🔧 Attempting automatic fixes...');
        await monitor.autoFix();
      }
      break;

    default:
      console.log('Usage: node security-monitor.js [scan|fix|both]');
      console.log('  scan - Run security scan only');
      console.log('  fix  - Attempt automatic fixes');
      console.log('  both - Scan and fix if needed');
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default SecurityMonitor;
