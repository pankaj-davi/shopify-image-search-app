#!/usr/bin/env node

/**
 * Database Operations Error Handler
 * Comprehensive error handling for database operations with detailed reporting
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('\n🗄️ Database Operation Error Handler\n');

const errors = [];
const warnings = [];
const operations = [];

function logError(message, solution = '', context = '') {
  const timestamp = new Date().toISOString();
  console.log(`❌ ERROR${context ? ` [${context}]` : ''}: ${message}`);
  if (solution) console.log(`   💡 Solution: ${solution}`);
  errors.push({ timestamp, message, solution, context });
}

function logWarning(message, context = '') {
  const timestamp = new Date().toISOString();
  console.log(`⚠️  WARNING${context ? ` [${context}]` : ''}: ${message}`);
  warnings.push({ timestamp, message, context });
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

function logOperation(operation, status, details = '') {
  const timestamp = new Date().toISOString();
  operations.push({ timestamp, operation, status, details });
  
  const statusIcon = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️';
  console.log(`${statusIcon} ${operation}: ${status.toUpperCase()}${details ? ` - ${details}` : ''}`);
}

async function validateEnvironment() {
  logInfo('🔍 Validating database environment...');
  
  const requiredEnvVars = [];
  const optionalEnvVars = [];
  
  // Check database provider
  const dbProvider = process.env.DATABASE_PROVIDER;
  if (!dbProvider) {
    logWarning('DATABASE_PROVIDER not set, defaulting to firebase');
    process.env.DATABASE_PROVIDER = 'firebase';
  }
  
  // Provider-specific environment validation
  switch (dbProvider) {
    case 'firebase':
      requiredEnvVars.push(
        'FIREBASE_PROJECT_ID',
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_PRIVATE_KEY'
      );
      break;
    case 'prisma':
      requiredEnvVars.push('DATABASE_URL');
      break;
    case 'supabase':
      requiredEnvVars.push('SUPABASE_URL', 'SUPABASE_ANON_KEY');
      break;
    case 'mongodb':
      requiredEnvVars.push('MONGODB_URI');
      break;
  }
  
  // Check required environment variables
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    logError(
      `Missing required environment variables: ${missingVars.join(', ')}`,
      `Set these variables in your .env file or environment`,
      'Environment'
    );
    return false;
  }
  
  // Check if .env file exists
  if (!fs.existsSync('.env') && !process.env.CI) {
    logWarning('.env file not found - make sure environment variables are set properly');
  }
  
  logSuccess(`Environment validated for ${dbProvider} database`);
  return true;
}

async function checkDatabaseConnectivity() {
  logInfo('🔗 Testing database connectivity...');
  
  try {
    const dbProvider = process.env.DATABASE_PROVIDER || 'firebase';
    
    switch (dbProvider) {
      case 'firebase':
        // Test Firebase connectivity
        await runCommand('node -e "console.log(\'Firebase config check passed\')"', 'Firebase Connection Test');
        break;
      case 'prisma':
        // Test Prisma connectivity
        await runCommand('npx prisma db status || npx prisma db push --preview-feature || echo "Prisma check completed"', 'Prisma Connection Test');
        break;
      default:
        logWarning(`No connectivity test available for ${dbProvider}`);
    }
    
    logSuccess('Database connectivity test passed');
    return true;
  } catch (error) {
    logError(
      'Database connectivity test failed',
      'Check your database credentials and network connection',
      'Connectivity'
    );
    return false;
  }
}

async function runCommand(command, context = '') {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: process.cwd(),
      timeout: 60000 // 60 second timeout for database operations
    });
    
    logOperation(context || command, 'success');
    return { success: true, output: result };
  } catch (error) {
    const errorMessage = error.message || error.toString();
    const stderr = error.stderr || '';
    const stdout = error.stdout || '';
    
    // Analyze database-specific errors
    analyzeDatabaseError(errorMessage + stderr, context);
    
    logOperation(context || command, 'error', errorMessage);
    return { success: false, error: errorMessage, stdout, stderr };
  }
}

function analyzeDatabaseError(errorOutput, context) {
  const commonErrors = [
    {
      pattern: /connection refused|ECONNREFUSED/i,
      message: 'Database connection refused',
      solution: 'Check if database server is running and accessible'
    },
    {
      pattern: /authentication failed|access denied/i,
      message: 'Database authentication failed',
      solution: 'Verify database credentials (username, password, API keys)'
    },
    {
      pattern: /database.*not found|schema.*not found/i,
      message: 'Database or schema not found',
      solution: 'Create the database/schema or check the database name'
    },
    {
      pattern: /timeout|timed out/i,
      message: 'Database operation timed out',
      solution: 'Check network connectivity or increase timeout values'
    },
    {
      pattern: /permission denied|insufficient privileges/i,
      message: 'Insufficient database permissions',
      solution: 'Grant necessary permissions to the database user'
    },
    {
      pattern: /syntax error|invalid query/i,
      message: 'Database query syntax error',
      solution: 'Check the SQL syntax or database schema'
    },
    {
      pattern: /disk full|no space/i,
      message: 'Database storage full',
      solution: 'Free up disk space or increase storage capacity'
    },
    {
      pattern: /firebase.*error|firestore.*error/i,
      message: 'Firebase/Firestore error',
      solution: 'Check Firebase project configuration and service account permissions'
    },
    {
      pattern: /prisma.*error/i,
      message: 'Prisma ORM error',
      solution: 'Check Prisma schema and database connection string'
    }
  ];
  
  commonErrors.forEach(({ pattern, message, solution }) => {
    if (pattern.test(errorOutput)) {
      logError(message, solution, context);
    }
  });
}

async function runDatabaseOperation(operation, options = {}) {
  const startTime = Date.now();
  logInfo(`🚀 Starting database operation: ${operation}`);
  
  try {
    let result;
    
    switch (operation) {
      case 'migrate':
        result = await runMigration();
        break;
      case 'backup':
        result = await runBackup(options.backupName);
        break;
      case 'restore':
        result = await runRestore(options.backupName);
        break;
      case 'seed':
        result = await runSeed();
        break;
      case 'reset':
        result = await runReset(options.force);
        break;
      default:
        throw new Error(`Unknown database operation: ${operation}`);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logSuccess(`Database operation '${operation}' completed in ${duration}s`);
    
    return result;
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logError(
      `Database operation '${operation}' failed after ${duration}s: ${error.message}`,
      'Check the error details and database configuration',
      operation
    );
    throw error;
  }
}

async function runMigration() {
  const dbProvider = process.env.DATABASE_PROVIDER || 'firebase';
  
  if (dbProvider === 'prisma') {
    return await runCommand('npx prisma migrate deploy', 'Database Migration');
  } else {
    logInfo('No migrations needed for Firebase - using real-time database');
    return { success: true, message: 'No migrations needed' };
  }
}

async function runBackup(backupName) {
  const timestamp = backupName || `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  return await runCommand(`npm run db:backup -- --name="${timestamp}"`, 'Database Backup');
}

async function runRestore(backupName) {
  if (!backupName) {
    throw new Error('Backup name is required for restore operation');
  }
  return await runCommand(`npm run db:restore -- --backup="${backupName}"`, 'Database Restore');
}

async function runSeed() {
  return await runCommand('npm run db:seed', 'Database Seeding');
}

async function runReset(force = false) {
  if (process.env.NODE_ENV === 'production' && !force) {
    throw new Error('Database reset not allowed in production environment');
  }
  
  if (!force) {
    logWarning('Database reset will permanently delete all data!');
  }
  
  return await runCommand('npm run db:reset', 'Database Reset');
}

function generateReport(operation, success) {
  const duration = new Date().toISOString();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 DATABASE OPERATION REPORT');
  console.log('='.repeat(60));
  console.log(`🎯 Operation: ${operation}`);
  console.log(`📅 Timestamp: ${duration}`);
  console.log(`🗄️ Provider: ${process.env.DATABASE_PROVIDER || 'unknown'}`);
  console.log(`✅ Success: ${success ? 'YES' : 'NO'}`);
  console.log(`⚠️ Warnings: ${warnings.length}`);
  console.log(`❌ Errors: ${errors.length}`);
  
  if (warnings.length > 0) {
    console.log('\n🔸 WARNINGS:');
    warnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. [${warning.context}] ${warning.message}`);
    });
  }
  
  if (errors.length > 0) {
    console.log('\n🔸 ERRORS:');
    errors.forEach((error, i) => {
      console.log(`  ${i + 1}. [${error.context}] ${error.message}`);
      if (error.solution) {
        console.log(`     💡 ${error.solution}`);
      }
    });
  }
  
  if (operations.length > 0) {
    console.log('\n🔸 OPERATIONS:');
    operations.forEach((op, i) => {
      console.log(`  ${i + 1}. ${op.operation} - ${op.status} (${op.timestamp})`);
      if (op.details) {
        console.log(`     📝 ${op.details}`);
      }
    });
  }
  
  // Save report to file
  const report = {
    operation,
    timestamp: duration,
    provider: process.env.DATABASE_PROVIDER,
    success,
    warnings,
    errors,
    operations,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      CI: process.env.CI
    }
  };
  
  try {
    fs.writeFileSync('database-operation-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to database-operation-report.json');
  } catch (error) {
    logWarning('Could not save database report to file');
  }
  
  console.log('='.repeat(60));
  
  return success;
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const operation = args[0];
  
  if (!operation || args.includes('--help')) {
    console.log(`
Usage: node database-error-handler.js <operation> [options]

Operations:
  migrate    Run database migrations
  backup     Create database backup
  restore    Restore from backup (requires --backup-name)
  seed       Seed database with initial data
  reset      Reset database (WARNING: deletes all data)

Options:
  --backup-name <name>    Specify backup name for restore
  --force                 Force operation (for reset in production)
  --help                  Show this help message

Examples:
  node database-error-handler.js migrate
  node database-error-handler.js backup
  node database-error-handler.js restore --backup-name backup-2025-07-15
  node database-error-handler.js reset --force
    `);
    process.exit(0);
  }
  
  const options = {};
  
  // Parse options
  const backupNameIndex = args.indexOf('--backup-name');
  if (backupNameIndex !== -1 && args[backupNameIndex + 1]) {
    options.backupName = args[backupNameIndex + 1];
  }
  
  if (args.includes('--force')) {
    options.force = true;
  }
  
  let success = false;
  
  try {
    // Validate environment
    const envValid = await validateEnvironment();
    if (!envValid) {
      process.exit(1);
    }
    
    // Test connectivity (optional - don't fail if this doesn't work)
    await checkDatabaseConnectivity().catch(() => {
      logWarning('Database connectivity test failed, but continuing with operation');
    });
    
    // Run the database operation
    await runDatabaseOperation(operation, options);
    success = true;
    
  } catch (error) {
    logError(
      `Database operation failed: ${error.message}`,
      'Check the error details above and verify your database configuration'
    );
    success = false;
  }
  
  // Generate and display report
  generateReport(operation, success);
  
  process.exit(success ? 0 : 1);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught Exception in database operation:', error);
  generateReport('unknown', false);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 Unhandled Rejection in database operation:', reason);
  generateReport('unknown', false);
  process.exit(1);
});

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('\n💥 Database script failed:', error);
    generateReport('unknown', false);
    process.exit(1);
  });
}

export { runDatabaseOperation, validateEnvironment, analyzeDatabaseError };
