import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      success: true,
      message: 'Health check passed',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        api: 'healthy',
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
        services: {
          database: 'unhealthy',
          api: 'healthy',
        },
      },
      { status: 500 }
    );
  }
}
