# Use Node.js 20 (LTS) for better security
FROM node:20-alpine

# Install security updates and necessary packages
RUN apk update && apk upgrade && \
    apk add --no-cache openssl curl && \
    rm -rf /var/cache/apk/*

EXPOSE 3000

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S shopify -u 1001 -G nodejs

ENV NODE_ENV=production

# Copy package files with proper ownership
COPY --chown=shopify:nodejs package.json package-lock.json* ./

# Install dependencies with security audit
RUN npm ci --omit=dev --audit && npm cache clean --force

# Remove CLI packages since we don't need them in production by default.
# Remove this line if you want to run CLI commands in your container.
RUN npm remove @shopify/cli 2>/dev/null || echo "CLI package not found, skipping removal"

# Copy source code with proper ownership
COPY --chown=shopify:nodejs . .

# Build the application
RUN npm run build

# Switch to non-root user
USER shopify

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "run", "docker-start"]
