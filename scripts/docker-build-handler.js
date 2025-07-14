#!/usr/bin/env node

/**
 * Docker Build Error Handler
 * Comprehensive error handling for Docker builds with detailed logging
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DockerBuildHandler {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.buildLogs = [];
    this.startTime = Date.now();
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message };
    this.buildLogs.push(logEntry);

    const colors = {
      error: '\x1b[31m',
      warn: '\x1b[33m',
      info: '\x1b[36m',
      success: '\x1b[32m',
      reset: '\x1b[0m',
    };

    console.log(
      `${colors[level] || colors.info}[${timestamp}] ${message}${colors.reset}`
    );
  }

  async checkDockerAvailability() {
    this.log('🐳 Checking Docker availability...');

    try {
      const dockerVersion = execSync('docker --version', { encoding: 'utf8' });
      this.log(`✅ Docker found: ${dockerVersion.trim()}`, 'success');
      return true;
    } catch (error) {
      this.log(
        '❌ Docker not available. Please install Docker first.',
        'error'
      );
      this.errors.push({
        context: 'Docker Availability',
        message: 'Docker is not installed or not accessible',
        solution: 'Install Docker Desktop or Docker Engine',
      });
      return false;
    }
  }

  async validateDockerfile() {
    this.log('📄 Validating Dockerfile...');

    if (!fs.existsSync('Dockerfile')) {
      this.log('❌ Dockerfile not found', 'error');
      this.errors.push({
        context: 'Dockerfile Validation',
        message: 'Dockerfile not found in current directory',
        solution: 'Create a Dockerfile for containerization',
      });
      return false;
    }

    try {
      const dockerfile = fs.readFileSync('Dockerfile', 'utf8');

      // Check for common issues
      if (!dockerfile.includes('FROM')) {
        this.warnings.push({
          context: 'Dockerfile Analysis',
          message: 'No FROM instruction found',
          suggestion: 'Dockerfile should start with a FROM instruction',
        });
      }

      if (!dockerfile.includes('WORKDIR')) {
        this.warnings.push({
          context: 'Dockerfile Analysis',
          message: 'No WORKDIR instruction found',
          suggestion: 'Consider setting a WORKDIR for better organization',
        });
      }

      if (!dockerfile.includes('USER') && dockerfile.includes('RUN')) {
        this.warnings.push({
          context: 'Security Analysis',
          message: 'Running as root user',
          suggestion:
            'Consider creating and using a non-root user for security',
        });
      }

      this.log('✅ Dockerfile validation passed', 'success');
      return true;
    } catch (error) {
      this.log(`❌ Error reading Dockerfile: ${error.message}`, 'error');
      this.errors.push({
        context: 'Dockerfile Validation',
        message: error.message,
        solution: 'Check Dockerfile permissions and syntax',
      });
      return false;
    }
  }

  async validateDockerignore() {
    this.log('📄 Checking .dockerignore...');

    if (!fs.existsSync('.dockerignore')) {
      this.warnings.push({
        context: 'Docker Optimization',
        message: '.dockerignore file not found',
        suggestion: 'Create .dockerignore to reduce build context size',
      });
    } else {
      const dockerignore = fs.readFileSync('.dockerignore', 'utf8');

      // Check for important exclusions
      const importantExclusions = ['node_modules', '.git', '*.log', '.env'];
      const missingExclusions = importantExclusions.filter(
        item => !dockerignore.includes(item)
      );

      if (missingExclusions.length > 0) {
        this.warnings.push({
          context: 'Docker Optimization',
          message: `Missing recommended exclusions: ${missingExclusions.join(', ')}`,
          suggestion: 'Add common exclusions to .dockerignore',
        });
      }

      this.log('✅ .dockerignore checked', 'success');
    }
  }

  async buildDockerImage(imageName = 'shopify-app', tag = 'latest') {
    this.log(`🔨 Building Docker image: ${imageName}:${tag}...`);

    try {
      const buildCommand = `docker build -t ${imageName}:${tag} .`;
      this.log(`Running: ${buildCommand}`);

      // Use spawn for real-time output
      const buildProcess = spawn(
        'docker',
        ['build', '-t', `${imageName}:${tag}`, '.'],
        {
          stdio: ['pipe', 'pipe', 'pipe'],
          cwd: process.cwd(),
        }
      );

      let buildOutput = '';
      let errorOutput = '';

      buildProcess.stdout.on('data', data => {
        const output = data.toString();
        buildOutput += output;
        // Log real-time output
        output
          .split('\n')
          .filter(line => line.trim())
          .forEach(line => {
            this.log(`📦 ${line}`);
          });
      });

      buildProcess.stderr.on('data', data => {
        const output = data.toString();
        errorOutput += output;
        this.log(`⚠️ ${output}`, 'warn');
      });

      const exitCode = await new Promise(resolve => {
        buildProcess.on('close', resolve);
      });

      if (exitCode === 0) {
        this.log('✅ Docker image built successfully', 'success');

        // Get image size
        try {
          const imageInfo = execSync(
            `docker images ${imageName}:${tag} --format "table {{.Size}}"`,
            { encoding: 'utf8' }
          );
          const size = imageInfo.split('\n')[1];
          this.log(`📊 Image size: ${size}`, 'info');
        } catch (error) {
          this.log('Could not get image size information', 'warn');
        }

        return true;
      } else {
        this.log(`❌ Docker build failed with exit code ${exitCode}`, 'error');

        // Analyze common error patterns
        this.analyzeDockerErrors(buildOutput + errorOutput);

        this.errors.push({
          context: 'Docker Build',
          message: `Build failed with exit code ${exitCode}`,
          details: errorOutput,
          solution: 'Check build logs above for specific errors',
        });

        return false;
      }
    } catch (error) {
      this.log(`❌ Docker build error: ${error.message}`, 'error');
      this.errors.push({
        context: 'Docker Build',
        message: error.message,
        solution: 'Check Docker installation and permissions',
      });
      return false;
    }
  }

  analyzeDockerErrors(output) {
    const commonErrors = [
      {
        pattern: /COPY failed/i,
        message: 'File copy operation failed',
        solution: 'Check if source files exist and paths are correct',
      },
      {
        pattern: /npm ERR!/i,
        message: 'npm installation failed',
        solution: 'Check package.json and network connectivity',
      },
      {
        pattern: /permission denied/i,
        message: 'Permission denied error',
        solution: 'Check file permissions or use non-root user',
      },
      {
        pattern: /No space left on device/i,
        message: 'Insufficient disk space',
        solution: 'Free up disk space or clean Docker cache',
      },
      {
        pattern: /unable to prepare context/i,
        message: 'Docker context preparation failed',
        solution: 'Check .dockerignore and reduce build context size',
      },
    ];

    commonErrors.forEach(({ pattern, message, solution }) => {
      if (pattern.test(output)) {
        this.errors.push({
          context: 'Docker Build Analysis',
          message,
          solution,
        });
      }
    });
  }

  async testDockerImage(imageName = 'shopify-app', tag = 'latest') {
    this.log(`🧪 Testing Docker image: ${imageName}:${tag}...`);

    try {
      // Test if image exists
      execSync(`docker images -q ${imageName}:${tag}`, { encoding: 'utf8' });

      // Try to run a simple command in the container
      const testOutput = execSync(
        `docker run --rm ${imageName}:${tag} node --version`,
        { encoding: 'utf8', timeout: 30000 }
      );

      this.log(
        `✅ Container test passed: Node.js ${testOutput.trim()}`,
        'success'
      );
      return true;
    } catch (error) {
      this.log(`❌ Container test failed: ${error.message}`, 'error');
      this.errors.push({
        context: 'Docker Test',
        message: 'Container failed basic functionality test',
        solution: 'Check Dockerfile and ensure proper Node.js setup',
      });
      return false;
    }
  }

  generateReport() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('🐳 DOCKER BUILD REPORT');
    console.log('='.repeat(60));
    console.log(`⏱️  Build time: ${duration}s`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);

    if (this.warnings.length > 0) {
      console.log('\n🔸 WARNINGS:');
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. [${warning.context}] ${warning.message}`);
        if (warning.suggestion) {
          console.log(`     💡 ${warning.suggestion}`);
        }
      });
    }

    if (this.errors.length > 0) {
      console.log('\n🔸 ERRORS:');
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. [${error.context}] ${error.message}`);
        if (error.solution) {
          console.log(`     🔧 ${error.solution}`);
        }
        if (error.details) {
          console.log(`     📝 Details: ${error.details.substring(0, 200)}...`);
        }
      });
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      warnings: this.warnings,
      errors: this.errors,
      buildLogs: this.buildLogs,
      success: this.errors.length === 0,
    };

    try {
      fs.writeFileSync(
        'docker-build-report.json',
        JSON.stringify(report, null, 2)
      );
      console.log('\n📄 Detailed report saved to docker-build-report.json');
    } catch (error) {
      console.log('⚠️ Could not save build report to file');
    }

    console.log('='.repeat(60));

    return this.errors.length === 0;
  }

  async runFullDockerBuild(
    imageName = 'shopify-app',
    tag = 'latest',
    options = {}
  ) {
    const { skipTest = false } = options;

    console.log('\n🚀 Starting Docker build process...');

    // Check Docker availability
    const dockerAvailable = await this.checkDockerAvailability();
    if (!dockerAvailable) {
      return false;
    }

    // Validate Dockerfile
    const dockerfileValid = await this.validateDockerfile();
    if (!dockerfileValid) {
      return false;
    }

    // Check .dockerignore
    await this.validateDockerignore();

    // Build image
    const buildSuccess = await this.buildDockerImage(imageName, tag);
    if (!buildSuccess) {
      return false;
    }

    // Test image
    if (!skipTest) {
      await this.testDockerImage(imageName, tag);
    }

    const success = this.generateReport();

    if (success) {
      console.log('\n🎉 Docker build completed successfully!');
    } else {
      console.log('\n💥 Docker build completed with errors!');
    }

    return success;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const imageName = args[0] || 'shopify-app';
  const tag = args[1] || 'latest';

  const options = {};
  if (args.includes('--skip-test')) {
    options.skipTest = true;
  }

  if (args.includes('--help')) {
    console.log(`
Usage: node docker-build-handler.js [imageName] [tag] [options]

Arguments:
  imageName    Docker image name (default: shopify-app)
  tag          Docker image tag (default: latest)

Options:
  --skip-test  Skip container testing
  --help       Show this help message

Examples:
  node docker-build-handler.js                          # Build shopify-app:latest
  node docker-build-handler.js my-app v1.0             # Build my-app:v1.0
  node docker-build-handler.js shopify-app dev --skip-test  # Build without testing
    `);
    process.exit(0);
  }

  const handler = new DockerBuildHandler();
  const success = await handler.runFullDockerBuild(imageName, tag, options);

  process.exit(success ? 0 : 1);
}

// Check if this is the main module (ES module equivalent)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Docker build script failed:', error);
    process.exit(1);
  });
}

export { DockerBuildHandler };
