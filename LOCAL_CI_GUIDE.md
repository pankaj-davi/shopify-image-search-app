# Local CI Testing Guide 🚀

## Overview

This guide shows you how to run all CI checks locally **before pushing** to prevent remote CI failures. No more "❌ CI Pipeline failed" surprises!

## Quick Commands

### 🔍 Before Every Push

```bash
npm run pre-push
```

Quick validation (2-3 seconds) - TypeScript, ESLint, basic checks

### 🧪 Full CI Simulation

```bash
npm run ci:test
```

Complete CI pipeline simulation (30-60 seconds) - mirrors GitHub Actions

### 🔧 Auto-fix Issues

```bash
npm run ci:fix
```

Automatically fixes formatting, ESLint, and common issues

### 📋 Alternative Quick Check

```bash
npm run check
```

Original comprehensive check command

## Detailed Workflow

### 1. Before Making Changes

```bash
# Start with clean state
npm run pre-push
```

### 2. After Making Changes

```bash
# Quick validation
npm run pre-push

# If issues found, auto-fix what you can
npm run ci:fix

# Verify fixes
npm run pre-push
```

### 3. Before Pushing (Comprehensive)

```bash
# Full CI simulation
npm run ci:test

# If any failures, fix and re-run
npm run ci:fix
npm run ci:test
```

### 4. Safe to Push

```bash
git add .
git commit -m "your changes"
git push origin develop
```

## What Each Check Does

### `npm run pre-push` (Quick - 2-3 seconds)

- ✅ TypeScript syntax validation
- ✅ ESLint code quality
- ✅ Git status check
- ✅ Build directory exists
- ✅ package-lock.json exists

**Use when:** Quick validation before commits

### `npm run ci:test` (Full - 30-60 seconds)

- 🎨 Code formatting (Prettier)
- 🔍 ESLint linting
- 🔧 TypeScript compilation
- 🔒 Security audit (npm audit)
- 🧪 Test suite execution
- 🏗️ Build system validation
- 🗄️ Database health check

**Use when:** Before pushing, after major changes

### `npm run ci:fix` (Auto-repair)

- 🎨 Fix code formatting with Prettier
- 🔍 Auto-fix ESLint issues
- 📦 Generate package-lock.json if missing
- 🔧 Regenerate Prisma types
- 🗑️ Clear build caches

**Use when:** CI tests show fixable issues

## Understanding Results

### ✅ All Green - Safe to Push

```
📊 Summary: 7 passed, 0 failed, 0 skipped
🎉 ALL CHECKS PASSED! Safe to push to remote.
```

### ⚠️ Warnings - Consider Fixing

```
⚠️ 1 warning(s):
   • Uncommitted changes detected
💡 Consider fixing warnings before pushing
🚀 Or proceed with push if warnings are acceptable
```

### ❌ Errors - Must Fix Before Pushing

```
📈 Summary: 4 passed, 3 failed, 0 skipped
⚠️ 3 check(s) failed - fix before pushing

🔧 Common fixes:
   npm run ci:fix     - Auto-fix formatting and lint issues
   npm run lint --fix - Fix ESLint issues
   npx prettier --write . - Fix formatting
```

## Common Issues & Solutions

### 🎨 Formatting Errors

```bash
# Auto-fix
npm run ci:fix

# Or manually
npx prettier --write .
```

### 🔍 ESLint Errors

```bash
# Auto-fix what's possible
npm run lint -- --fix

# Or via auto-fix
npm run ci:fix
```

### 🔒 Security Vulnerabilities

```bash
# Check what's vulnerable
npm audit

# Auto-fix if safe
npm audit fix

# Note: Dev dependencies (like esbuild) are often safe to ignore
```

### 🧪 Test Failures

```bash
# Run tests to see failures
npm test

# Fix the failing tests in your code
# Then verify
npm run ci:test
```

### 🗄️ Database Issues

```bash
# Check database health
npm run db:health

# Check environment variables
# Ensure Firebase/DB credentials are set
```

## Advanced Usage

### Custom Checks

You can run individual checks:

```bash
npx prettier --check .           # Formatting
npm run lint                     # ESLint
npx tsc --noEmit                 # TypeScript
npm audit --audit-level moderate # Security
npm test                         # Tests
npm run build:check              # Build
npm run db:health                # Database
```

### Reports

After running `npm run ci:test`, check `local-ci-report.json` for detailed results.

## Integration Tips

### VS Code Tasks

These commands are available as VS Code tasks via `Ctrl+Shift+P` → "Tasks: Run Task"

### Git Hooks (Optional)

Add to `.git/hooks/pre-push`:

```bash
#!/bin/sh
npm run pre-push
```

### CI/CD Integration

These local checks mirror your GitHub Actions pipeline:

- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`

## Troubleshooting

### Scripts Not Running

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Re-install dependencies
npm install
```

### Permission Issues

```bash
# Windows PowerShell execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Cache Issues

```bash
# Clear npm cache
npm cache clean --force

# Clear build cache
rm -rf build/ node_modules/.cache/
```

## Best Practices

1. **Always run `npm run pre-push` before committing**
2. **Run `npm run ci:test` before important pushes**
3. **Use `npm run ci:fix` to auto-resolve common issues**
4. **Don't ignore warnings - fix them when possible**
5. **Keep your environment variables up to date**

## Summary

| Command            | Speed     | Coverage      | When to Use         |
| ------------------ | --------- | ------------- | ------------------- |
| `npm run pre-push` | ⚡ Fast   | Basic         | Before every commit |
| `npm run ci:test`  | 🐌 Slow   | Complete      | Before pushing      |
| `npm run ci:fix`   | ⚡ Fast   | Auto-fixes    | When issues found   |
| `npm run check`    | 🚀 Medium | Comprehensive | Alternative check   |

**Remember:** These tools prevent CI failures by catching issues locally first! 🎯
