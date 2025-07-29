import { NextRequest, NextResponse } from 'next/server';
import { TelegramBotHandler } from '@/lib/telegram/bot';

export async function POST(request: NextRequest) {
  try {
    // Get the update from Telegram
    const update = await request.json();

    // Initialize bot handler
    const botHandler = new TelegramBotHandler();

    // Handle the message
    if (update.message) {
      await botHandler.handleMessage(update.message);
    }

    // Always return success to Telegram
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    // Still return success to avoid Telegram retrying
    return NextResponse.json({ ok: true });
  }
}

// Handle GET requests for webhook verification
export async function GET() {
  return NextResponse.json({
    message: 'Telegram webhook is active',
    timestamp: new Date().toISOString(),
  });
}
