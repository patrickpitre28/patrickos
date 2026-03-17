import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '..', '.env') });

const GRANT_BOT_TOKEN = process.env.TELEGRAM_GRANT_BOT_TOKEN;
const PETIT_BOT_TOKEN = process.env.TELEGRAM_PETIT_BOT_TOKEN;
const GRANT_CHANNEL = process.env.TELEGRAM_GRANT_CHANNEL_ID;
const PETIT_CHANNEL = process.env.TELEGRAM_PETIT_CHANNEL_ID;

function resolveBot(agentId) {
  if (agentId === 'Petit') {
    return { token: PETIT_BOT_TOKEN, chatId: PETIT_CHANNEL };
  }
  // grant, claude-code, ChatGPT, Notion AI → Grant bot + Grant channel
  return { token: GRANT_BOT_TOKEN, chatId: GRANT_CHANNEL };
}

export async function sendAlert(message, agentId) {
  const { token, chatId } = resolveBot(agentId);

  if (!token) {
    console.warn(`Telegram bot token not set for agent: ${agentId} — skipping notification`);
    return;
  }
  if (!chatId) {
    console.warn(`Telegram channel ID not set for agent: ${agentId} — skipping notification`);
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('Telegram send failed:', body);
  }
}

export async function sendToAll(message) {
  await Promise.all([
    sendAlert(message, 'grant'),
    sendAlert(message, 'Petit'),
  ]);
}
