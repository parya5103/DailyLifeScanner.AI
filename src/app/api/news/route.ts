import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, findUserById } from '@/lib/auth/utils';
import { NewsScraper } from '@/lib/scraper/news-scraper';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const profile = searchParams.get('profile') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const where: any = {};
    if (category !== 'all') {
      where.category = category;
    }

    // Get articles
    let articles = await db.newsArticle.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    // Filter by profile impact if specified
    if (profile !== 'all') {
      articles = articles.filter(article => {
        const impactField = `impact${profile.charAt(0).toUpperCase() + profile.slice(1)}`;
        return article[impactField as keyof typeof article] !== null && 
               article[impactField as keyof typeof article] !== undefined;
      });
    }

    return NextResponse.json({
      success: true,
      data: articles,
    });
  } catch (error) {
    console.error('Get news error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching news' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get request body
    const { action } = await request.json();

    if (action === 'scrape') {
      // Initialize news scraper
      const scraper = new NewsScraper();
      
      // Scrape and process news
      const result = await scraper.scrapeAndProcess();

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `Successfully scraped and processed ${result.processed} articles`,
          processed: result.processed,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: result.error || 'Failed to scrape news',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('News action error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while processing news action' },
      { status: 500 }
    );
  }
}
