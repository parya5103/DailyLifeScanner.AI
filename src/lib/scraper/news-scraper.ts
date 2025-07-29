import Parser from 'rss-parser';
import { db } from '@/lib/db';
import { SummaryEngine } from '@/lib/ai/summary-engine';

const RSS_FEEDS = {
  technology: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB',
  business: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB',
  science: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB',
  health: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB',
  sports: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB',
  entertainment: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB',
};

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  contentSnippet: string;
  guid: string;
  categories?: string[];
  creator?: string;
}

interface ProcessedArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  category: string;
  publishedAt: Date;
  content?: string;
}

export class NewsScraper {
  private parser: Parser;
  private summaryEngine: SummaryEngine;

  constructor() {
    this.parser = new Parser();
    this.summaryEngine = SummaryEngine.getInstance();
  }

  async scrapeCategory(category: string): Promise<ProcessedArticle[]> {
    try {
      const feedUrl = RSS_FEEDS[category as keyof typeof RSS_FEEDS];
      if (!feedUrl) {
        throw new Error(`Invalid category: ${category}`);
      }

      const feed = await this.parser.parseURL(feedUrl);
      const articles: ProcessedArticle[] = [];

      for (const item of feed.items as RSSItem[]) {
        try {
          // Skip if article already exists
          const existing = await db.newsArticle.findUnique({
            where: { url: item.link },
          });

          if (existing) {
            continue;
          }

          const processedArticle: ProcessedArticle = {
            title: item.title || 'Untitled',
            description: item.contentSnippet || item.content || '',
            url: item.link,
            source: item.creator || 'Unknown Source',
            category,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            content: item.content,
          };

          articles.push(processedArticle);
        } catch (error) {
          console.error(`Error processing article ${item.link}:`, error);
        }
      }

      return articles.slice(0, 10); // Limit to 10 articles per category
    } catch (error) {
      console.error(`Error scraping category ${category}:`, error);
      return [];
    }
  }

  async scrapeAllCategories(): Promise<ProcessedArticle[]> {
    const categories = Object.keys(RSS_FEEDS);
    const allArticles: ProcessedArticle[] = [];

    for (const category of categories) {
      try {
        const categoryArticles = await this.scrapeCategory(category);
        allArticles.push(...categoryArticles);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error scraping category ${category}:`, error);
      }
    }

    return allArticles;
  }

  async processAndSaveArticles(articles: ProcessedArticle[]): Promise<void> {
    for (const article of articles) {
      try {
        // Check if article already exists
        const existing = await db.newsArticle.findUnique({
          where: { url: article.url },
        });

        if (existing) {
          continue;
        }

        // Generate AI summary and impact analysis
        const aiResult = await this.summaryEngine.processArticle({
          title: article.title,
          description: article.description,
          content: article.content,
        });

        // Save to database
        await db.newsArticle.create({
          data: {
            title: article.title,
            description: article.description,
            url: article.url,
            source: article.source,
            category: article.category,
            publishedAt: article.publishedAt,
            summary: aiResult.summary,
            impactStudent: aiResult.impact.student,
            impactEmployee: aiResult.impact.employee,
            impactInvestor: aiResult.impact.investor,
            impactHomemaker: aiResult.impact.homemaker,
          },
        });

        console.log(`Processed and saved: ${article.title}`);
      } catch (error) {
        console.error(`Error processing article ${article.title}:`, error);
      }
    }
  }

  async scrapeAndProcess(): Promise<{ success: boolean; processed: number; error?: string }> {
    try {
      console.log('Starting news scraping process...');
      
      // Scrape articles from all categories
      const articles = await this.scrapeAllCategories();
      
      if (articles.length === 0) {
        return {
          success: false,
          processed: 0,
          error: 'No articles found to scrape',
        };
      }

      console.log(`Found ${articles.length} articles to process`);

      // Process and save articles with AI analysis
      await this.processAndSaveArticles(articles);

      console.log(`Successfully processed ${articles.length} articles`);

      return {
        success: true,
        processed: articles.length,
      };
    } catch (error) {
      console.error('Error in scrape and process:', error);
      return {
        success: false,
        processed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getRecentArticles(limit: number = 20, category?: string): Promise<any[]> {
    try {
      const where = category ? { category } : {};
      
      return await db.newsArticle.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      console.error('Error getting recent articles:', error);
      return [];
    }
  }
}
