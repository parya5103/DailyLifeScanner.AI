export class TelegramBot {
  private token: string;
  private baseUrl: string;

  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN || '';
    this.baseUrl = `https://api.telegram.org/bot${this.token}`;
  }

  async sendMessage(chatId: number, text: string, options: any = {}): Promise<void> {
    try {
      const url = `${this.baseUrl}/sendMessage`;
      const payload = {
        chat_id: chatId,
        text,
        parse_mode: options.parse_mode || 'HTML',
        disable_web_page_preview: options.disable_web_page_preview || false,
        ...options,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Telegram API error: ${error}`);
      }
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      throw error;
    }
  }

  async setWebhook(url: string): Promise<void> {
    try {
      const webhookUrl = `${this.baseUrl}/setWebhook`;
      const payload = {
        url,
        allowed_updates: ['message', 'callback_query'],
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to set webhook: ${error}`);
      }

      console.log('Telegram webhook set successfully');
    } catch (error) {
      console.error('Error setting Telegram webhook:', error);
      throw error;
    }
  }

  async getWebhookInfo(): Promise<any> {
    try {
      const url = `${this.baseUrl}/getWebhookInfo`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to get webhook info');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting webhook info:', error);
      throw error;
    }
  }

  async deleteWebhook(): Promise<void> {
    try {
      const url = `${this.baseUrl}/deleteWebhook`;
      const response = await fetch(url, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to delete webhook');
      }

      console.log('Telegram webhook deleted successfully');
    } catch (error) {
      console.error('Error deleting Telegram webhook:', error);
      throw error;
    }
  }

  async getMe(): Promise<any> {
    try {
      const url = `${this.baseUrl}/getMe`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to get bot info');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting bot info:', error);
      throw error;
    }
  }

  isValidToken(): boolean {
    return this.token.length > 0;
  }
}
