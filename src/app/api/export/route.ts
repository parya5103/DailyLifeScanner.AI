import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, findUserById } from '@/lib/auth/utils';
import { db } from '@/lib/db';

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

    // Get user
    const user = await findUserById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get request body
    const { profile, category } = await request.json();

    // Build where clause
    const where: any = {};
    if (category && category !== 'all') {
      where.category = category;
    }

    // Get articles
    const articles = await db.newsArticle.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: 50, // Limit to 50 articles for export
    });

    // Filter by profile impact if specified
    let filteredArticles = articles;
    if (profile && profile !== 'all') {
      filteredArticles = articles.filter(article => {
        const impactField = `impact${profile.charAt(0).toUpperCase() + profile.slice(1)}`;
        return article[impactField as keyof typeof article] !== null && 
               article[impactField as keyof typeof article] !== undefined;
      });
    }

    // Generate HTML content
    const html = generateHTMLReport(filteredArticles, profile || 'all', category || 'all', user);

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `daily-news-summary-${timestamp}.html`;

    return NextResponse.json({
      success: true,
      message: 'Export generated successfully',
      html,
      filename,
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while generating export' },
      { status: 500 }
    );
  }
}

function generateHTMLReport(articles: any[], profile: string, category: string, user: any): string {
  const profileTitle = profile === 'all' ? 'All Profiles' : profile.charAt(0).toUpperCase() + profile.slice(1) + 's';
  const categoryTitle = category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily News Summary - ${new Date().toLocaleDateString()}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 700;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .meta-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .meta-info h2 {
            margin: 0 0 15px 0;
            color: #4f46e5;
            font-size: 1.3em;
        }
        .meta-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .meta-item {
            padding: 10px;
            background: #f8fafc;
            border-radius: 6px;
        }
        .meta-item strong {
            color: #6366f1;
        }
        .article {
            background: white;
            margin-bottom: 25px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .article-header {
            padding: 20px;
            border-bottom: 1px solid #e5e7eb;
        }
        .article-title {
            margin: 0 0 10px 0;
            font-size: 1.4em;
            color: #1f2937;
        }
        .article-title a {
            color: #4f46e5;
            text-decoration: none;
        }
        .article-title a:hover {
            text-decoration: underline;
        }
        .article-meta {
            display: flex;
            gap: 15px;
            font-size: 0.9em;
            color: #6b7280;
        }
        .article-content {
            padding: 20px;
        }
        .article-description {
            margin: 0 0 15px 0;
            color: #4b5563;
        }
        .article-summary {
            background: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            padding: 15px;
            margin: 15px 0;
            border-radius: 0 4px 4px 0;
        }
        .article-summary strong {
            color: #0369a1;
        }
        .article-impact {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 15px 0;
            border-radius: 0 4px 4px 0;
        }
        .article-impact strong {
            color: #d97706;
        }
        .category-badge {
            display: inline-block;
            padding: 4px 8px;
            background: #e0e7ff;
            color: #4338ca;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: 500;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #6b7280;
            font-size: 0.9em;
        }
        @media print {
            body {
                background: white;
                max-width: none;
                margin: 0;
                padding: 20px;
            }
            .article {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📰 Daily News Summary</h1>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        <p>Powered by DailyLifeScanner.AI</p>
    </div>

    <div class="meta-info">
        <h2>📊 Report Information</h2>
        <div class="meta-grid">
            <div class="meta-item">
                <strong>User:</strong> ${user.name || user.email}
            </div>
            <div class="meta-item">
                <strong>Profile:</strong> ${profileTitle}
            </div>
            <div class="meta-item">
                <strong>Category:</strong> ${categoryTitle}
            </div>
            <div class="meta-item">
                <strong>Articles:</strong> ${articles.length}
            </div>
        </div>
    </div>

    ${articles.map(article => `
        <div class="article">
            <div class="article-header">
                <h3 class="article-title">
                    <a href="${article.url}" target="_blank">${article.title}</a>
                </h3>
                <div class="article-meta">
                    <span>📅 ${new Date(article.publishedAt).toLocaleDateString()}</span>
                    <span>📰 ${article.source}</span>
                    <span class="category-badge">${article.category}</span>
                </div>
            </div>
            <div class="article-content">
                <p class="article-description">${article.description}</p>
                
                ${article.summary ? `
                    <div class="article-summary">
                        <strong>🤖 AI Summary:</strong><br>
                        ${article.summary}
                    </div>
                ` : ''}
                
                ${profile !== 'all' && article[`impact${profile.charAt(0).toUpperCase() + profile.slice(1)}`] ? `
                    <div class="article-impact">
                        <strong>💡 Impact on ${profileTitle}:</strong><br>
                        ${article[`impact${profile.charAt(0).toUpperCase() + profile.slice(1)}`]}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('')}

    <div class="footer">
        <p>This report was generated by DailyLifeScanner.AI - Your personalized news intelligence platform.</p>
        <p>Visit us at https://dailylifescanner.ai for more insights and analysis.</p>
    </div>
</body>
</html>
  `;
}
