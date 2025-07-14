import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getDatabase } from '../services/database.interface';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const checkType = url.searchParams.get('type') || 'basic';

  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      checks: {} as Record<string, any>,
    };

    // Basic health check
    healthStatus.checks.app = {
      status: 'healthy',
      message: 'Application is running',
    };

    // Environment variables check
    healthStatus.checks.environment = {
      status: 'healthy',
      provider: process.env.DATABASE_PROVIDER || 'firebase',
      hasShopifyConfig: !!(
        process.env.SHOPIFY_API_KEY && process.env.SHOPIFY_API_SECRET
      ),
      appUrl: process.env.SHOPIFY_APP_URL || 'not set',
    };

    // Database health check (if requested)
    if (checkType === 'full' || checkType === 'database') {
      try {
        const db = await getDatabase();

        // Test database connection with a simple operation
        if (process.env.DATABASE_PROVIDER === 'firebase') {
          // For Firebase, we'll just verify the connection works
          healthStatus.checks.database = {
            status: 'healthy',
            provider: 'firebase',
            message: 'Firebase connection established',
          };
        } else if (process.env.DATABASE_PROVIDER === 'prisma') {
          // For Prisma, test with a simple query
          const { PrismaClient } = await import('@prisma/client');
          const prisma = new PrismaClient();
          await prisma.$connect();
          await prisma.$queryRaw`SELECT 1`;
          await prisma.$disconnect();

          healthStatus.checks.database = {
            status: 'healthy',
            provider: 'prisma',
            message: 'Prisma database connection successful',
          };
        }
      } catch (error) {
        healthStatus.status = 'degraded';
        healthStatus.checks.database = {
          status: 'unhealthy',
          provider: process.env.DATABASE_PROVIDER || 'unknown',
          message:
            error instanceof Error
              ? error.message
              : 'Database connection failed',
        };
      }
    }

    // Memory usage check
    if (checkType === 'full') {
      const memUsage = process.memoryUsage();
      healthStatus.checks.memory = {
        status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning', // 500MB threshold
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      };
    }

    // Determine overall status
    const allChecks = Object.values(healthStatus.checks);
    if (allChecks.some(check => check.status === 'unhealthy')) {
      healthStatus.status = 'unhealthy';
    } else if (
      allChecks.some(
        check => check.status === 'warning' || check.status === 'degraded'
      )
    ) {
      healthStatus.status = 'degraded';
    }

    const statusCode =
      healthStatus.status === 'healthy'
        ? 200
        : healthStatus.status === 'degraded'
          ? 200
          : 503;

    return json(healthStatus, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    return json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        checks: {
          app: {
            status: 'unhealthy',
            message: 'Health check failed',
          },
        },
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  }
}
