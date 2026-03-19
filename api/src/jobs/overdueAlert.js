const API_BASE = `http://localhost:${process.env.PORT || 3200}/api/v1`;
const API_KEY = process.env.AGENT_API_KEY;

function daysOverdue(dueDate) {
  const due = new Date(dueDate);
  const now = new Date();
  return Math.floor((now - due) / (1000 * 60 * 60 * 24));
}

function formatMessage(tasks) {
  const lines = tasks.map(
    (t) => `• <b>${t.task}</b> · ${t.domain || '—'} · ${daysOverdue(t.dueDate)}d overdue`
  );
  return `⚠️ <b>Overdue Tasks</b>\n\n${lines.join('\n')}`;
}

export async function run() {
  console.log('[overdueAlert] Running...');

  const res = await fetch(`${API_BASE}/tasks/overdue`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  if (!res.ok) {
    console.error('[overdueAlert] API call failed:', res.status, await res.text());
    return;
  }

  const tasks = await res.json();

  if (tasks.length === 0) {
    console.log('[overdueAlert] No overdue tasks — silent.');
    return;
  }

  console.log(`[overdueAlert] ${tasks.length} overdue task(s) found.`);
}
