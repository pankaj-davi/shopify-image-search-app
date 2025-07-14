#!/usr/bin/env node
/**
 * Monitoring and Alerting Script
 * Monitors application health and sends alerts
 */

import { execSync } from 'child_process';

const monitoringConfig = {
  endpoints: [
    {
      name: 'Health Check',
      url: process.env.APP_URL
        ? `${process.env.APP_URL}/health`
        : 'http://localhost:3000/health',
      timeout: 5000,
      expectedStatus: 200,
    },
    {
      name: 'API Status',
      url: process.env.APP_URL
        ? `${process.env.APP_URL}/api/health`
        : 'http://localhost:3000/api/health',
      timeout: 5000,
      expectedStatus: 200,
    },
  ],
  thresholds: {
    responseTime: 5000, // 5 seconds
    errorRate: 0.1, // 10%
    uptimeMinimum: 0.99, // 99%
  },
  notifications: {
    slack: process.env.SLACK_WEBHOOK_URL,
    discord: process.env.DISCORD_WEBHOOK_URL,
    email: process.env.SMTP_HOST ? true : false,
  },
};

class HealthMonitor {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async checkEndpoint(endpoint) {
    try {
      console.log(`🔍 Checking ${endpoint.name}...`);

      const start = Date.now();
      const response = await fetch(endpoint.url, {
        timeout: endpoint.timeout,
        signal: AbortSignal.timeout(endpoint.timeout),
      });
      const responseTime = Date.now() - start;

      const isHealthy = response.status === endpoint.expectedStatus;
      const result = {
        name: endpoint.name,
        url: endpoint.url,
        status: response.status,
        responseTime,
        healthy: isHealthy,
        timestamp: new Date().toISOString(),
        error: null,
      };

      if (isHealthy) {
        console.log(
          `✅ ${endpoint.name}: ${response.status} (${responseTime}ms)`
        );
      } else {
        console.log(
          `❌ ${endpoint.name}: ${response.status} (${responseTime}ms)`
        );
      }

      return result;
    } catch (error) {
      const result = {
        name: endpoint.name,
        url: endpoint.url,
        status: 0,
        responseTime: Date.now() - Date.now(),
        healthy: false,
        timestamp: new Date().toISOString(),
        error: error.message,
      };

      console.log(`❌ ${endpoint.name}: ${error.message}`);
      return result;
    }
  }

  async checkDatabaseHealth() {
    try {
      console.log('🗄️ Checking database health...');

      const result = await new Promise(resolve => {
        try {
          execSync('npm run health:firebase', { stdio: 'pipe' });
          resolve({ healthy: true, error: null });
        } catch (error) {
          resolve({ healthy: false, error: error.message });
        }
      });

      if (result.healthy) {
        console.log('✅ Database: Connected');
      } else {
        console.log(`❌ Database: ${result.error}`);
      }

      return {
        name: 'Database',
        healthy: result.healthy,
        error: result.error,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.log(`❌ Database: ${error.message}`);
      return {
        name: 'Database',
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async runHealthChecks() {
    console.log('🏥 Starting health monitoring...');
    console.log(`📅 Time: ${new Date().toISOString()}`);

    // Check all endpoints
    for (const endpoint of monitoringConfig.endpoints) {
      const result = await this.checkEndpoint(endpoint);
      this.results.push(result);
    }

    // Check database
    const dbResult = await this.checkDatabaseHealth();
    this.results.push(dbResult);

    return this.results;
  }

  generateReport() {
    const totalChecks = this.results.length;
    const healthyChecks = this.results.filter(r => r.healthy).length;
    const unhealthyChecks = totalChecks - healthyChecks;
    const uptime = healthyChecks / totalChecks;
    const avgResponseTime =
      this.results
        .filter(r => r.responseTime)
        .reduce((sum, r) => sum + r.responseTime, 0) /
      this.results.filter(r => r.responseTime).length;

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalChecks,
        healthyChecks,
        unhealthyChecks,
        uptime: Math.round(uptime * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime || 0),
      },
      details: this.results,
      alerts: this.generateAlerts(),
    };

    return report;
  }

  generateAlerts() {
    const alerts = [];

    // Check for failed endpoints
    const failedEndpoints = this.results.filter(r => !r.healthy);
    if (failedEndpoints.length > 0) {
      alerts.push({
        level: 'critical',
        message: `${failedEndpoints.length} endpoints are down`,
        details: failedEndpoints.map(
          r => `${r.name}: ${r.error || `Status ${r.status}`}`
        ),
      });
    }

    // Check response times
    const slowEndpoints = this.results.filter(
      r =>
        r.responseTime &&
        r.responseTime > monitoringConfig.thresholds.responseTime
    );
    if (slowEndpoints.length > 0) {
      alerts.push({
        level: 'warning',
        message: `${slowEndpoints.length} endpoints are slow`,
        details: slowEndpoints.map(r => `${r.name}: ${r.responseTime}ms`),
      });
    }

    return alerts;
  }

  async sendNotifications(report) {
    if (report.alerts.length === 0) {
      console.log('✅ No alerts to send');
      return;
    }

    console.log('📢 Sending notifications...');

    // Send to Slack
    if (monitoringConfig.notifications.slack) {
      await this.sendSlackNotification(report);
    }

    // Send to Discord
    if (monitoringConfig.notifications.discord) {
      await this.sendDiscordNotification(report);
    }

    // Send email (if configured)
    if (monitoringConfig.notifications.email) {
      await this.sendEmailNotification(report);
    }
  }

  async sendSlackNotification(report) {
    try {
      const color = report.alerts.some(a => a.level === 'critical')
        ? '#ff0000'
        : '#ffa500';
      const payload = {
        text: '🚨 Health Check Alert',
        attachments: [
          {
            color,
            fields: [
              {
                title: 'Summary',
                value: `${report.summary.healthyChecks}/${report.summary.totalChecks} checks passed (${Math.round(report.summary.uptime * 100)}% uptime)`,
                short: true,
              },
              {
                title: 'Average Response Time',
                value: `${report.summary.avgResponseTime}ms`,
                short: true,
              },
            ],
          },
        ],
      };

      await fetch(monitoringConfig.notifications.slack, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('✅ Slack notification sent');
    } catch (error) {
      console.error('❌ Failed to send Slack notification:', error.message);
    }
  }

  async sendDiscordNotification(report) {
    try {
      const color = report.alerts.some(a => a.level === 'critical')
        ? 16711680
        : 16753920; // Red or Orange
      const payload = {
        embeds: [
          {
            title: '🚨 Health Check Alert',
            color,
            fields: [
              {
                name: 'Summary',
                value: `${report.summary.healthyChecks}/${report.summary.totalChecks} checks passed (${Math.round(report.summary.uptime * 100)}% uptime)`,
                inline: true,
              },
              {
                name: 'Average Response Time',
                value: `${report.summary.avgResponseTime}ms`,
                inline: true,
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await fetch(monitoringConfig.notifications.discord, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('✅ Discord notification sent');
    } catch (error) {
      console.error('❌ Failed to send Discord notification:', error.message);
    }
  }

  async sendEmailNotification(_report) {
    console.log('📧 Email notifications not implemented yet');
    // TODO: Implement email notifications using nodemailer
  }
}

async function runMonitoring() {
  try {
    const monitor = new HealthMonitor();

    // Run health checks
    await monitor.runHealthChecks();

    // Generate report
    const report = monitor.generateReport();

    // Display report
    console.log('\n📊 Health Check Report:');
    console.log(`   Total checks: ${report.summary.totalChecks}`);
    console.log(`   Healthy: ${report.summary.healthyChecks}`);
    console.log(`   Unhealthy: ${report.summary.unhealthyChecks}`);
    console.log(`   Uptime: ${Math.round(report.summary.uptime * 100)}%`);
    console.log(
      `   Average response time: ${report.summary.avgResponseTime}ms`
    );

    if (report.alerts.length > 0) {
      console.log('\n🚨 Alerts:');
      report.alerts.forEach(alert => {
        console.log(`   ${alert.level.toUpperCase()}: ${alert.message}`);
        if (alert.details) {
          alert.details.forEach(detail => console.log(`     - ${detail}`));
        }
      });

      // Send notifications
      await monitor.sendNotifications(report);
    } else {
      console.log('\n✅ All systems healthy!');
    }

    // Save report to file
    try {
      const fs = await import('fs');
      const reportPath = `monitoring-report-${Date.now()}.json`;
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📝 Report saved to: ${reportPath}`);
    } catch (error) {
      console.warn('⚠️ Could not save report to file:', error.message);
    }
  } catch (error) {
    console.error('❌ Monitoring failed:', error.message);
    process.exit(1);
  }
}

// Run monitoring if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMonitoring();
}

export { runMonitoring, HealthMonitor };
