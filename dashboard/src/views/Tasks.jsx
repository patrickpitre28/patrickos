import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api/v1';

const SECTIONS = [
  { key: 'escalated', title: 'Escalated', emoji: '\u{1F534}', filter: t => t.escalated && t.status !== 'Done' && t.status !== 'Dropped' },
  { key: 'inProgress', title: 'In Progress', emoji: '\u26A1', filter: t => t.status === 'In Progress' },
  { key: 'next', title: 'Next Up', emoji: '\u{1F4CB}', filter: t => t.status === 'Next' },
  { key: 'overdue', title: 'Overdue', emoji: '\u{1F550}', filter: t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done' && t.status !== 'Dropped' },
  { key: 'inbox', title: 'Inbox', emoji: '\u{1F4E5}', filter: t => t.status === 'Inbox' },
];

const priorityColors = { P1: '#ff4d4f', P2: '#faad14', P3: '#52c41a' };
const domainColors = { IBM: '#1d8cf8', 'Job Search': '#f5a623', Creative: '#bd10e0', PatrickOS: '#7c8aff' };

function Badge({ label, color }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 600, background: color + '22', color, marginRight: 6,
    }}>
      {label}
    </span>
  );
}

function TaskCard({ task }) {
  return (
    <div style={{
      background: '#1e2030', borderRadius: 8, padding: '14px 16px', marginBottom: 8,
      border: task.escalated ? '1px solid #ff4d4f' : '1px solid #2a2d3a',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{task.task}</div>
      <div>
        {task.priority && <Badge label={task.priority} color={priorityColors[task.priority] || '#888'} />}
        {task.domain && <Badge label={task.domain} color={domainColors[task.domain] || '#888'} />}
        {task.agentId && <Badge label={task.agentId} color="#7c8aff" />}
        {task.dueDate && (
          <span style={{ fontSize: 12, color: '#8b8fa3', marginLeft: 4 }}>
            Due: {task.dueDate}{task.daysOut != null ? ` (${task.daysOut}d)` : ''}
          </span>
        )}
      </div>
      {task.escalated && task.escalationNotes && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#ff4d4f', fontStyle: 'italic' }}>
          {task.escalationNotes}
        </div>
      )}
    </div>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/tasks`, {
        headers: { 'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}` },
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      setTasks(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 60_000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Tasks</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#8b8fa3' }}>{new Date().toLocaleDateString()}</span>
          <button
            onClick={() => { setLoading(true); fetchTasks(); }}
            style={{
              background: '#7c8aff', color: '#fff', border: 'none', borderRadius: 6,
              padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && <p style={{ color: '#8b8fa3' }}>Loading tasks...</p>}
      {error && <p style={{ color: '#ff4d4f' }}>Error: {error}</p>}

      {!loading && SECTIONS.map(({ key, title, emoji, filter }) => {
        const items = tasks.filter(filter);
        if (items.length === 0) return null;
        return (
          <div key={key} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: '#c9cdd8' }}>
              {emoji} {title} <span style={{ color: '#8b8fa3', fontWeight: 400 }}>({items.length})</span>
            </h2>
            {items.map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        );
      })}
    </div>
  );
}
