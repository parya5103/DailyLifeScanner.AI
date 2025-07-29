import { NextRequest, NextResponse } from 'next/server';
import { TelegramBot } from '@/lib/telegram/setup';

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const { action, webhookUrl } = await request.json();

    if (action === 'setWebhook') {
      if (!webhookUrl) {
        return NextResponse.json(
          { success: false, message: 'Webhook URL is required' },
          { status: 400 }
        );
      }

      const bot = new TelegramBot();
      
      if (!bot.isValidToken()) {
        return NextResponse.json(
          { success: false, message: 'Telegram bot token is not configured' },
          { status: 500 }
        );
      }

      await bot.setWebhook(webhookUrl);

      return NextResponse.json({
        success: true,
        message: 'Telegram webhook set successfully',
      });
    }

    if (action === 'getWebhookInfo') {
      const bot = new TelegramBot();
      
      if (!bot.isValidToken()) {
        return NextResponse.json(
          { success: false, message: 'Telegram bot token is not configured' },
          { status: 500 }
        );
      }

      const webhookInfo = await bot.getWebhookInfo();

      return NextResponse.json({
        success: true,
        data: webhookInfo,
      });
    }

    if (action === 'deleteWebhook') {
      const bot = new TelegramBot();
      
      if (!bot.isValidToken()) {
        return NextResponse.json(
          { success: false, message: 'Telegram bot token is not configured' },
          { status: 500 }
        );
      }

      await bot.deleteWebhook();

      return NextResponse.json({
        success: true,
        message: 'Telegram webhook deleted successfully',
      });
    }

    if (action === 'getMe') {
      const bot = new TelegramBot();
      
      if (!bot.isValidToken()) {
        return NextResponse.json(
          { success: false, message: 'Telegram bot token is not configured' },
          { status: 500 }
        );
      }

      const botInfo = await bot.getMe();

      return NextResponse.json({
        success: true,
        data: botInfo,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Telegram setup error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while setting up Telegram' },
      { status: 500 }
    );
  }
}
