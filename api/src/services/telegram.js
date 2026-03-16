const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GRANT_CHANNEL = process.env.TELEGRAM_GRANT_CHANNEL_ID;
const PETIT_CHANNEL = process.env.TELEGRAM_PETIT_CHANNEL_ID;

function resolveChannel(agentId) {
  if (agentId === 'Petit') return PETIT_CHANNEL;
  // grant, claude-code, ChatGPT, Notion AI → Grant channel
  return GRANT_CHANNEL;
}

export async function sendAlert(message, agentId) {
  if (!BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN not set — skipping notification');
    return;
  }

  const chatId = resolveChannel(agentId);
  if (!chatId) {
    console.warn(`No Telegram channel configured for agent: ${agentId}`);
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
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
