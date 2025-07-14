# 🧪 Development Environment CI/CD Deployment Guide

This guide shows you how to deploy your Shopify app to development environment using CI/CD.

## 🚀 Quick Start: Development Deployment

### **Method 1: GitHub Actions (Recommended)**

#### **Automatic Deployment**

Push to your development branch to trigger automatic deployment:

```bash
# Create and switch to develop branch
git checkout -b develop

# Make your changes
git add .
git commit -m "feat: development changes"
git push origin develop
```

This will automatically trigger the development deployment workflow.

#### **Manual Deployment via GitHub Actions**

1. Go to your GitHub repository
2. Click on **"Actions"** tab
3. Select **"Deploy to Development"** workflow
4. Click **"Run workflow"**
5. Choose your options:
   - **Environment**: `development`
   - **Platform**: `railway` (recommended), `heroku`, `vercel`, or `docker`
6. Click **"Run workflow"**

### **Method 2: Command Line Deployment**

#### **Quick Development Deployment**

```bash
# Deploy to Railway (recommended)
npm run deploy:dev:railway

# Deploy to Heroku
npm run deploy:dev:heroku

# Deploy to Vercel
npm run deploy:dev:vercel

# Deploy with Docker locally
npm run deploy:dev:docker

# Run locally (development server)
npm run deploy:dev:local
```

#### **Custom Platform Deployment**

```bash
# General command with options
npm run deploy:dev <platform> [options]

# Examples:
npm run deploy:dev railway
npm run deploy:dev docker --skip-tests
npm run deploy:dev local --force
```

#### **Available Options**

- `--skip-tests` - Skip running tests
- `--skip-build` - Skip building application
- `--force` - Continue even if tests fail

## 🔧 Setup Development Environment

### **1. Configure Environment Variables**

First, set up your development environment variables:

```bash
# Generate development environment template
npm run setup:env development
```

Then edit `.env` with your development values:

```bash
# Development Configuration
NODE_ENV=development
DATABASE_PROVIDER=firebase

# Firebase Development Project
FIREBASE_PROJECT_ID=your-dev-firebase-project
FIREBASE_CLIENT_EMAIL=dev-service@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Shopify Development App
SHOPIFY_API_KEY=your-dev-api-key
SHOPIFY_API_SECRET=your-dev-api-secret
SHOPIFY_APP_URL=https://your-dev-app.railway.app
SCOPES=read_products,write_script_tags,read_themes

# Development Platform (choose one)
RAILWAY_TOKEN=your-railway-token
# HEROKU_API_KEY=your-heroku-key
# VERCEL_TOKEN=your-vercel-token
```

### **2. Set Up GitHub Secrets (For CI/CD)**

In your GitHub repository settings, add these secrets for development:

```
DEV_FIREBASE_PROJECT_ID=your-dev-firebase-project
DEV_FIREBASE_CLIENT_EMAIL=dev-service@your-project.iam.gserviceaccount.com
DEV_FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----
DEV_SHOPIFY_API_KEY=your-dev-api-key
DEV_SHOPIFY_API_SECRET=your-dev-api-secret
DEV_APP_URL=https://your-dev-app.railway.app

# Platform-specific secrets (choose one)
RAILWAY_TOKEN=your-railway-token
HEROKU_API_KEY=your-heroku-key
VERCEL_TOKEN=your-vercel-token
DOCKER_REGISTRY=your-registry-url
DOCKER_REGISTRY_USER=your-username
DOCKER_REGISTRY_TOKEN=your-token

# Optional: Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

## 📊 Development Deployment Platforms

### **🚂 Railway (Recommended)**

**Pros**: Easy setup, automatic deployments, built-in databases
**Cons**: Limited free tier

```bash
# Setup Railway
npm install -g @railway/cli
railway login
railway init
railway environment development

# Deploy
npm run deploy:dev:railway
```

**Configuration:**

- Create a Railway project
- Set environment variables in Railway dashboard
- Connect your GitHub repository for automatic deployments

### **🟣 Heroku**

**Pros**: Mature platform, extensive add-ons
**Cons**: No free tier, more complex setup

```bash
# Setup Heroku
heroku create shopify-app-dev
heroku config:set NODE_ENV=development
heroku config:set DATABASE_PROVIDER=firebase
# ... set other environment variables

# Deploy
npm run deploy:dev:heroku
```

### **▲ Vercel**

**Pros**: Excellent for frontend, serverless functions
**Cons**: Limited for full-stack apps

```bash
# Setup Vercel
npm install -g vercel
vercel login
vercel --prod

# Deploy
npm run deploy:dev:vercel
```

### **🐳 Docker**

**Pros**: Consistent environment, works anywhere
**Cons**: Requires Docker knowledge

```bash
# Deploy with Docker
npm run deploy:dev:docker

# Access at http://localhost:3000
```

### **🏠 Local Development**

**Pros**: Fastest for development, no external dependencies
**Cons**: Not accessible externally

```bash
# Run locally
npm run deploy:dev:local
# or simply
npm run dev
```

## 🔄 CI/CD Workflow Details

### **Development Branch Workflow**

1. **Push to `develop` or `feature/*` branch**
2. **GitHub Actions triggers automatically**
3. **Runs development deployment workflow**:
   - ✅ Setup Node.js environment
   - ✅ Install dependencies
   - ✅ Run linting and tests
   - ✅ Build application
   - ✅ Setup development database
   - ✅ Deploy to chosen platform
   - ✅ Deploy Firebase rules
   - ✅ Run health checks
   - ✅ Send notifications

### **Manual Workflow**

1. **Go to GitHub Actions**
2. **Select "Deploy to Development"**
3. **Choose platform and options**
4. **Monitor deployment progress**
5. **Check deployment summary**

## 🗄️ Database Management

### **Development Database Setup**

```bash
# Test Firebase connection
npm run health:firebase

# Seed development database
npm run db:seed

# Create backup
npm run db:backup

# Deploy Firebase rules
npm run firebase:rules development
```

### **Database Isolation**

Development uses a separate Firebase project to ensure:

- ✅ Data isolation from staging/production
- ✅ Safe testing of database changes
- ✅ Independent security rules
- ✅ Separate backup policies

## 📊 Monitoring Development Deployments

### **Health Checks**

```bash
# Manual health check
npm run health:check

# Monitoring with alerts
npm run monitoring
```

### **Deployment Status**

Check deployment status in:

- GitHub Actions tabs
- Platform-specific dashboards (Railway, Heroku, etc.)
- Application health endpoints

### **Logs and Debugging**

```bash
# View deployment logs in GitHub Actions
# Platform-specific log commands:

# Railway
railway logs

# Heroku
heroku logs --tail --app shopify-app-dev

# Docker
docker logs shopify-app-dev
```

## 🚨 Troubleshooting

### **Common Issues**

#### **Build Failures**

```bash
# Check linting
npm run lint

# Check TypeScript
npx tsc --noEmit

# Check tests
npm test
```

#### **Environment Issues**

```bash
# Regenerate environment
npm run setup:env development

# Check Firebase connection
npm run health:firebase

# Verify secrets in GitHub/platform
```

#### **Deployment Failures**

```bash
# Force deployment (skip tests)
npm run deploy:dev railway --force

# Check platform-specific issues
railway status  # for Railway
heroku ps --app shopify-app-dev  # for Heroku
```

### **Getting Help**

1. **Check GitHub Actions logs** for detailed error messages
2. **Review platform-specific logs** (Railway, Heroku, etc.)
3. **Verify environment variables** are set correctly
4. **Test locally first** with `npm run dev`
5. **Check Firebase console** for database issues

## 🎯 Development Workflow Best Practices

### **Branch Strategy**

```bash
# Feature development
git checkout -b feature/new-feature
# ... make changes ...
git push origin feature/new-feature  # Triggers dev deployment

# Development integration
git checkout develop
git merge feature/new-feature
git push origin develop  # Triggers dev deployment
```

### **Testing Strategy**

1. **Local testing** first with `npm run dev`
2. **Automated testing** via CI/CD pipeline
3. **Manual testing** on deployed development environment
4. **Database testing** with seeded data

### **Environment Promotion**

```
Development → Staging → Production
     ↓            ↓         ↓
  feature/*    main      v1.0.0
   branches    branch     tags
```

## 🎉 You're Ready!

Your development environment CI/CD is now configured! You can:

✅ **Deploy automatically** by pushing to development branches
✅ **Deploy manually** via GitHub Actions or command line
✅ **Test safely** with isolated development database
✅ **Monitor deployments** with health checks and alerts
✅ **Debug easily** with comprehensive logging

**Happy development!** 🚀

---

### 📚 Related Documentation

- [Complete CI/CD Guide](CI_CD_GUIDE.md)
- [Database Setup](DATABASE_SETUP.md)
- [Firebase Setup](FIREBASE_SETUP.md)
- [Quick Start Guide](QUICK_START_CICD.md)
