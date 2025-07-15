#!/usr/bin/env node

/**
 * GitHub Actions Workflow Trigger and Monitor
 * Triggers workflows and monitors their status
 */

import { execSync } from 'child_process';

class WorkflowManager {
  constructor() {
    this.repo = 'shopify-image-search-app';
    this.owner = 'pankaj-davi';
  }

  /**
   * Trigger a specific workflow
   */
  triggerWorkflow(workflowName, inputs = {}) {
    console.log(`🚀 Triggering workflow: ${workflowName}`);

    try {
      // Using GitHub CLI to trigger workflow
      const inputsStr =
        Object.keys(inputs).length > 0
          ? `--field ${Object.entries(inputs)
              .map(([k, v]) => `${k}=${v}`)
              .join(' --field ')}`
          : '';

      const command = `gh workflow run "${workflowName}" ${inputsStr}`;
      console.log(`Running: ${command}`);

      execSync(command, { stdio: 'inherit' });
      console.log(`✅ Workflow "${workflowName}" triggered successfully`);
    } catch (error) {
      console.error(`❌ Failed to trigger workflow: ${error.message}`);
      console.log(
        '💡 Make sure you have GitHub CLI installed and authenticated'
      );
      console.log('💡 Install: https://cli.github.com/');
      console.log('💡 Login: gh auth login');
    }
  }

  /**
   * List recent workflow runs
   */
  listWorkflowRuns(limit = 5) {
    console.log('📋 Recent workflow runs:');

    try {
      const command = `gh run list --limit ${limit}`;
      execSync(command, { stdio: 'inherit' });
    } catch (error) {
      console.error(`❌ Failed to list workflows: ${error.message}`);
    }
  }

  /**
   * Monitor specific workflow status
   */
  monitorWorkflow(workflowId) {
    console.log(`👀 Monitoring workflow: ${workflowId}`);

    try {
      const command = `gh run watch ${workflowId}`;
      execSync(command, { stdio: 'inherit' });
    } catch (error) {
      console.error(`❌ Failed to monitor workflow: ${error.message}`);
    }
  }

  /**
   * Show available workflows
   */
  listWorkflows() {
    console.log('📋 Available workflows:');
    console.log('=======================');
    console.log('1. 🔒 Security Scan');
    console.log('2. 🚀 CI Pipeline');
    console.log('3. 🧪 Deploy to Development');
    console.log('4. 🗄️ Database Management');
    console.log('5. 📊 Monitoring');
    console.log('');
  }

  /**
   * Test security workflow specifically
   */
  testSecurityWorkflow() {
    console.log('🔒 Testing Security Workflow...');
    console.log(
      'This will trigger a manual security scan to test our SARIF fixes'
    );

    this.triggerWorkflow('🔒 Security Scan');

    setTimeout(() => {
      console.log('\n📊 Checking recent runs...');
      this.listWorkflowRuns(3);
    }, 2000);
  }

  /**
   * Manual deployment trigger
   */
  triggerDeployment(environment = 'development') {
    console.log(`🚀 Triggering deployment to ${environment}...`);

    if (environment === 'development') {
      this.triggerWorkflow('🧪 Deploy to Development');
    } else {
      console.log('⚠️ Production deployments should be done carefully');
      console.log('Use the GitHub UI for production deployments');
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  const manager = new WorkflowManager();

  switch (command) {
    case 'security':
      manager.testSecurityWorkflow();
      break;

    case 'deploy':
      const env = args[1] || 'development';
      manager.triggerDeployment(env);
      break;

    case 'list':
      manager.listWorkflows();
      break;

    case 'runs':
      manager.listWorkflowRuns(10);
      break;

    case 'monitor':
      const workflowId = args[1];
      if (!workflowId) {
        console.log(
          '❌ Please provide workflow ID: npm run workflow:monitor <workflow-id>'
        );
        return;
      }
      manager.monitorWorkflow(workflowId);
      break;

    case 'help':
    default:
      console.log('🔧 GitHub Actions Workflow Manager');
      console.log('==================================');
      console.log('');
      console.log('Usage: node scripts/workflow-manager.js [command]');
      console.log('');
      console.log('Commands:');
      console.log('  security  - Test security workflow with SARIF fixes');
      console.log('  deploy    - Trigger development deployment');
      console.log('  list      - Show available workflows');
      console.log('  runs      - Show recent workflow runs');
      console.log('  monitor   - Monitor specific workflow run');
      console.log('  help      - Show this help message');
      console.log('');
      console.log('Examples:');
      console.log('  npm run workflow:security');
      console.log('  npm run workflow:deploy');
      console.log('  npm run workflow:runs');
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default WorkflowManager;
