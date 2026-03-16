import { Router } from 'express';
import * as notion from '../services/notion.js';
import { sendAlert } from '../services/telegram.js';

const router = Router();

// GET /tasks — query by agent, status, domain
router.get('/', async (req, res) => {
  try {
    const { agent, status, domain } = req.query;
    const tasks = await notion.queryTasks({ agent, status, domain });
    res.json(tasks);
  } catch (err) {
    console.error('GET /tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /tasks/overdue
router.get('/overdue', async (req, res) => {
  try {
    const tasks = await notion.getOverdueTasks();
    res.json(tasks);
  } catch (err) {
    console.error('GET /tasks/overdue error:', err);
    res.status(500).json({ error: 'Failed to fetch overdue tasks' });
  }
});

// POST /tasks — create a new task
router.post('/', async (req, res) => {
  try {
    const { task, priority, domain, agent_id, due_date } = req.body;
    if (!task) return res.status(400).json({ error: 'task is required' });

    const page = await notion.createTask({ task, priority, domain, agent_id, due_date });
    res.status(201).json(page);
  } catch (err) {
    console.error('POST /tasks error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /tasks/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Inbox', 'Next', 'In Progress', 'Waiting', 'Done', 'Dropped'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    const page = await notion.updateTaskStatus(req.params.id, status);
    res.json(page);
  } catch (err) {
    console.error('PATCH /tasks/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// POST /tasks/:id/log — append-only execution log
router.post('/:id/log', async (req, res) => {
  try {
    const { entry } = req.body;
    if (!entry) return res.status(400).json({ error: 'entry is required' });

    const page = await notion.appendExecutionLog(req.params.id, entry);
    res.json(page);
  } catch (err) {
    console.error('POST /tasks/:id/log error:', err);
    res.status(500).json({ error: 'Failed to append log entry' });
  }
});

// POST /tasks/:id/escalate
router.post('/:id/escalate', async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'reason is required' });

    const page = await notion.escalateTask(req.params.id, reason);

    // Send Telegram alert routed by agent ID
    const agentId = page.agentId || 'unknown';
    await sendAlert(`🚨 Escalation: ${page.task}\nReason: ${reason}`, agentId);

    res.json(page);
  } catch (err) {
    console.error('POST /tasks/:id/escalate error:', err);
    res.status(500).json({ error: 'Failed to escalate task' });
  }
});

// POST /tasks/:id/complete
router.post('/:id/complete', async (req, res) => {
  try {
    const page = await notion.completeTask(req.params.id);
    res.json(page);
  } catch (err) {
    console.error('POST /tasks/:id/complete error:', err);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

export default router;
