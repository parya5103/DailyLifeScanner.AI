import { TelegramBot } from './setup';

export class TelegramBotHandler {
  private bot: TelegramBot;

  constructor() {
    this.bot = new TelegramBot();
  }

  async handleMessage(message: any): Promise<void> {
    try {
      const chatId = message.chat.id;
      const text = message.text;

      if (!text) return;

      // Handle different commands
      if (text.startsWith('/start')) {
        await this.handleStart(chatId);
      } else if (text.startsWith('/help')) {
        await this.handleHelp(chatId);
      } else if (text.startsWith('/news')) {
        await this.handleNews(chatId);
      } else if (text.startsWith('/summary')) {
        await this.handleSummary(chatId);
      } else if (text.startsWith('/profile')) {
        await this.handleProfile(chatId);
      } else {
        await this.handleUnknownCommand(chatId);
      }
    } catch (error) {
      console.error('Error handling Telegram message:', error);
    }
  }

  private async handleStart(chatId: number): Promise<void> {
    const message = `
🤖 Welcome to DailyLifeScanner.AI Bot!

I'm here to keep you updated with personalized news insights. Here's what I can do:

📰 /news - Get latest news updates
📝 /summary - Get daily news summary
👤 /profile - Manage your profile preferences
❓ /help - Show this help message

To get started, please make sure you're registered on our website and have connected your Telegram account in your profile settings.

Stay informed with AI-powered news analysis! 🚀
    `;

    await this.bot.sendMessage(chatId, message);
  }

  private async handleHelp(chatId: number): Promise<void> {
    const message = `
📚 DailyLifeScanner.AI Bot Help

Available commands:

📰 /news - Get the latest news updates based on your profile
📝 /summary - Receive a daily summary of important news
👤 /profile - Update your profile and preferences
❓ /help - Show this help message

💡 Tips:
• Make sure your Telegram chat ID is connected to your website account
• News updates are personalized based on your profile (student, employee, investor, homemaker)
• You can customize your preferred news categories in your profile

Need more help? Visit our website or contact support! 🌟
    `;

    await this.bot.sendMessage(chatId, message);
  }

  private async handleNews(chatId: number): Promise<void> {
    try {
      // This would typically fetch user-specific news based on their profile
      // For now, we'll send a placeholder message
      const message = `
📰 Latest News Updates

Here are the latest headlines:

• Technology sector sees major breakthrough in AI development
• Global markets respond to new economic policies
• Health research shows promising results in medical treatments
• Educational reforms announced for upcoming academic year

For detailed analysis and personalized insights, please visit our website dashboard.

Want to customize your news preferences? Use /profile to update your settings! 📊
      `;

      await this.bot.sendMessage(chatId, message);
    } catch (error) {
      console.error('Error handling news command:', error);
      await this.bot.sendMessage(chatId, 'Sorry, I couldn\'t fetch the latest news. Please try again later.');
    }
  }

  private async handleSummary(chatId: number): Promise<void> {
    try {
      const message = `
📝 Daily News Summary

Here's your personalized news summary for today:

🔍 Top Stories:
• Major technological advancement impacts multiple industries
• Economic indicators show positive trends for investors
• Health sector innovations benefit patients and professionals
• Educational updates affect students and teachers

💡 Personalized Insights:
Based on your profile, these developments may have specific implications for your daily life and decisions.

For detailed analysis and full articles, visit your dashboard on our website.

Stay tuned for more updates! 📈
      `;

      await this.bot.sendMessage(chatId, message);
    } catch (error) {
      console.error('Error handling summary command:', error);
      await this.bot.sendMessage(chatId, 'Sorry, I couldn\'t generate the summary. Please try again later.');
    }
  }

  private async handleProfile(chatId: number): Promise<void> {
    try {
      const message = `
👤 Profile Management

To manage your profile and preferences:

1. Visit our website: DailyLifeScanner.AI
2. Log in to your account
3. Go to Profile Settings
4. Add your Telegram Chat ID: ${chatId}
5. Customize your news categories and preferences

Once connected, you'll receive:
• Personalized news updates
• AI-powered impact analysis
• Customized notifications
• Daily summaries

Your current Chat ID is: ${chatId}

Update your profile now to get the most out of our service! ⚙️
      `;

      await this.bot.sendMessage(chatId, message);
    } catch (error) {
      console.error('Error handling profile command:', error);
      await this.bot.sendMessage(chatId, 'Sorry, I couldn\'t process your profile request. Please try again later.');
    }
  }

  private async handleUnknownCommand(chatId: number): Promise<void> {
    const message = `
❓ Unknown Command

I didn't recognize that command. Here's what I can help you with:

📰 /news - Get latest news updates
📝 /summary - Get daily news summary
👤 /profile - Manage your profile
❓ /help - Show all available commands

Type /help to see all available commands and their descriptions! 🤖
    `;

    await this.bot.sendMessage(chatId, message);
  }

  async sendNewsAlert(chatId: number, article: any): Promise<void> {
    try {
      const message = `
📰 *News Alert*

*${article.title}*

${article.description}

📂 *Category:* ${article.category}
📅 *Published:* ${new Date(article.publishedAt).toLocaleDateString()}

🤖 *AI Summary:* ${article.summary || 'Summary not available'}

Read more: ${article.url}

---
*Powered by DailyLifeScanner.AI*
      `;

      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error sending news alert:', error);
    }
  }

  async sendDailySummary(chatId: number, articles: any[]): Promise<void> {
    try {
      const articleList = articles.slice(0, 5).map(article => 
        `• ${article.title}`
      ).join('\n');

      const message = `
📝 *Daily News Summary*

Here are today's top stories:

${articleList}

📊 *Total Articles:* ${articles.length}
🤖 *AI Analysis:* Personalized insights available on your dashboard

Visit DailyLifeScanner.AI for detailed analysis and personalized impact assessments.

Have a great day! 🌟
      `;

      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error sending daily summary:', error);
    }
  }
}
