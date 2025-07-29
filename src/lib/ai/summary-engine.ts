import ZAI from 'z-ai-web-dev-sdk';

interface SummaryRequest {
  title: string;
  description: string;
  content?: string;
}

interface ImpactAnalysis {
  student?: string;
  employee?: string;
  investor?: string;
  homemaker?: string;
}

export class SummaryEngine {
  private static instance: SummaryEngine;
  private zai: any;

  private constructor() {}

  public static getInstance(): SummaryEngine {
    if (!SummaryEngine.instance) {
      SummaryEngine.instance = new SummaryEngine();
    }
    return SummaryEngine.instance;
  }

  private async initializeZAI() {
    if (!this.zai) {
      try {
        this.zai = await ZAI.create();
      } catch (error) {
        console.error('Failed to initialize ZAI:', error);
        throw new Error('Failed to initialize AI service');
      }
    }
    return this.zai;
  }

  async generateSummary(article: SummaryRequest): Promise<string> {
    try {
      const zai = await this.initializeZAI();
      
      const prompt = `
        You are an expert news analyst. Please provide a concise summary of the following news article:
        
        Title: ${article.title}
        Description: ${article.description}
        ${article.content ? `Content: ${article.content}` : ''}
        
        Please provide a 2-3 sentence summary that captures the key points and significance of this news.
      `;

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert news analyst providing concise, accurate summaries of news articles.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'Unable to generate summary.';
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Summary generation failed. Please try again later.';
    }
  }

  async generateImpactAnalysis(article: SummaryRequest): Promise<ImpactAnalysis> {
    try {
      const zai = await this.initializeZAI();
      
      const prompt = `
        You are an expert analyst specializing in understanding how news impacts different demographics. 
        Analyze the following news article and provide specific impact assessments for:
        
        1. Students (education, learning, career development)
        2. Employees (work, career, job security)
        3. Investors (markets, investments, financial impact)
        4. Homemakers (daily life, family, household management)
        
        Article:
        Title: ${article.title}
        Description: ${article.description}
        ${article.content ? `Content: ${article.content}` : ''}
        
        Please provide a JSON response with the following structure:
        {
          "student": "Impact assessment for students...",
          "employee": "Impact assessment for employees...",
          "investor": "Impact assessment for investors...",
          "homemaker": "Impact assessment for homemakers..."
        }
        
        Each assessment should be 1-2 sentences specific to that demographic.
      `;

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert demographic impact analyst providing specific, actionable insights for different user groups.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (response) {
        try {
          return JSON.parse(response);
        } catch (parseError) {
          console.error('Error parsing impact analysis JSON:', parseError);
          // Return a fallback structure
          return {
            student: 'This news may have implications for education and learning opportunities.',
            employee: 'This could affect workplace dynamics and career development.',
            investor: 'This news may impact market conditions and investment decisions.',
            homemaker: 'This could influence daily life and family planning decisions.',
          };
        }
      }
      
      throw new Error('No response from AI service');
    } catch (error) {
      console.error('Error generating impact analysis:', error);
      return {
        student: 'Unable to generate specific impact analysis for students at this time.',
        employee: 'Unable to generate specific impact analysis for employees at this time.',
        investor: 'Unable to generate specific impact analysis for investors at this time.',
        homemaker: 'Unable to generate specific impact analysis for homemakers at this time.',
      };
    }
  }

  async processArticle(article: SummaryRequest): Promise<{
    summary: string;
    impact: ImpactAnalysis;
  }> {
    try {
      const [summary, impact] = await Promise.all([
        this.generateSummary(article),
        this.generateImpactAnalysis(article),
      ]);

      return { summary, impact };
    } catch (error) {
      console.error('Error processing article:', error);
      return {
        summary: 'Unable to process this article at this time.',
        impact: {
          student: 'Analysis unavailable.',
          employee: 'Analysis unavailable.',
          investor: 'Analysis unavailable.',
          homemaker: 'Analysis unavailable.',
        },
      };
    }
  }
}
