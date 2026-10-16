// lib/telegram-notify.ts - optional Telegram notifier (NO-OP unless the owner
// provides TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID in the environment).
// Secrets never printed; failures silent (never breaks the calling action).

export function telegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export async function telegramNotify(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 3500), parse_mode: "HTML" }),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
