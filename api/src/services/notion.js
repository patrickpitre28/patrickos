import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { Client } from '@notionhq/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '..', '.env') });

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DB_ID = process.env.NOTION_TASKS_DB_ID;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractPageData(page) {
  const props = page.properties;
  return {
    id: page.id,
    task: props['Task']?.title?.[0]?.plain_text || '',
    status: props['Status']?.select?.name || '',
    priority: props['Priority']?.select?.name || '',
    domain: props['Domain']?.select?.name || '',
    agentId: props['Agent ID']?.select?.name || '',
    assignedTo: props['Assigned To']?.select?.name || '',
    dueDate: props['Due Date']?.date?.start || null,
    escalated: props['Escalated']?.checkbox || false,
    escalationNotes: props['Escalation Notes']?.rich_text?.[0]?.plain_text || '',
    executionLog: props['Execution Log']?.rich_text?.[0]?.plain_text || '',
    completedDate: props['Completed Date']?.date?.start || null,
    daysOut: props['Days Out']?.formula?.number ?? null,
    createdTime: page.created_time,
  };
}

function buildFilter({ agent, status, domain } = {}) {
  const conditions = [];
  if (agent) conditions.push({ property: 'Agent ID', select: { equals: agent } });
  if (status) conditions.push({ property: 'Status', select: { equals: status } });
  if (domain) conditions.push({ property: 'Domain', select: { equals: domain } });
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return { and: conditions };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function queryTasks({ agent, status, domain } = {}) {
  const response = await notion.databases.query({
    database_id: DB_ID,
    filter: buildFilter({ agent, status, domain }),
    sorts: [
      { property: 'Priority', direction: 'ascending' },
      { property: 'Due Date', direction: 'ascending' },
    ],
  });
  return response.results.map(extractPageData);
}

export async function createTask({ task, priority, domain, agent_id, due_date }) {
  const properties = {
    'Task': { title: [{ text: { content: task } }] },
    'Status': { select: { name: 'Inbox' } },
  };
  if (priority) properties['Priority'] = { select: { name: priority } };
  if (domain) properties['Domain'] = { select: { name: domain } };
  if (agent_id) {
    properties['Agent ID'] = { select: { name: agent_id } };
    properties['Assigned To'] = { select: { name: 'Agent' } };
  }
  if (due_date) properties['Due Date'] = { date: { start: due_date } };

  const page = await notion.pages.create({ parent: { database_id: DB_ID }, properties });
  return extractPageData(page);
}

export async function updateTaskStatus(pageId, status) {
  const page = await notion.pages.update({
    page_id: pageId,
    properties: { 'Status': { select: { name: status } } },
  });
  return extractPageData(page);
}

export async function appendExecutionLog(pageId, entry) {
  // Read current log first (append-only)
  const current = await notion.pages.retrieve({ page_id: pageId });
  const existing = current.properties['Execution Log']?.rich_text?.[0]?.plain_text || '';
  const timestamp = new Date().toISOString();
  const newLog = `[${timestamp}] ${entry}\n${existing}`;

  const page = await notion.pages.update({
    page_id: pageId,
    properties: {
      'Execution Log': { rich_text: [{ text: { content: newLog.slice(0, 2000) } }] },
    },
  });
  return extractPageData(page);
}

export async function escalateTask(pageId, reason) {
  const page = await notion.pages.update({
    page_id: pageId,
    properties: {
      'Escalated': { checkbox: true },
      'Escalation Notes': { rich_text: [{ text: { content: reason } }] },
    },
  });
  return extractPageData(page);
}

export async function completeTask(pageId) {
  const today = new Date().toISOString().split('T')[0];

  // Check priority to decide Sync to Vault
  const current = await notion.pages.retrieve({ page_id: pageId });
  const priority = current.properties['Priority']?.select?.name;

  const properties = {
    'Status': { select: { name: 'Done' } },
    'Completed Date': { date: { start: today } },
  };
  if (priority === 'P1') {
    properties['Sync to Vault'] = { checkbox: true };
  }

  const page = await notion.pages.update({ page_id: pageId, properties });
  return extractPageData(page);
}

export async function getOverdueTasks() {
  const today = new Date().toISOString().split('T')[0];
  const response = await notion.databases.query({
    database_id: DB_ID,
    filter: {
      and: [
        { property: 'Due Date', date: { before: today } },
        { property: 'Status', select: { does_not_equal: 'Done' } },
        { property: 'Status', select: { does_not_equal: 'Dropped' } },
      ],
    },
    sorts: [{ property: 'Due Date', direction: 'ascending' }],
  });
  return response.results.map(extractPageData);
}

// ---------------------------------------------------------------------------
// Digests
// ---------------------------------------------------------------------------

export async function buildDailyDigest() {
  const allTasks = await queryTasks();
  const overdue = await getOverdueTasks();

  const byPriority = { P1: [], P2: [], P3: [], unset: [] };
  const agentActivity = {};

  for (const t of allTasks) {
    if (t.status === 'Done' || t.status === 'Dropped') continue;
    const bucket = byPriority[t.priority] || byPriority.unset;
    bucket.push(t);

    if (t.agentId) {
      agentActivity[t.agentId] = (agentActivity[t.agentId] || 0) + 1;
    }
  }

  return {
    date: new Date().toISOString().split('T')[0],
    overdueCount: overdue.length,
    tasksByPriority: byPriority,
    agentActivity,
  };
}

export async function buildWeeklyDigest() {
  const allTasks = await queryTasks();

  const completed = [];
  const dropped = [];
  const deferred = [];
  const agentStats = {};
  const vaultCandidates = [];

  for (const t of allTasks) {
    if (t.status === 'Done') completed.push(t);
    else if (t.status === 'Dropped') dropped.push(t);
    else if (t.status === 'Waiting') deferred.push(t);

    if (t.agentId) {
      if (!agentStats[t.agentId]) agentStats[t.agentId] = { total: 0, completed: 0 };
      agentStats[t.agentId].total++;
      if (t.status === 'Done') agentStats[t.agentId].completed++;
    }

    if (t.status === 'Done' && t.priority === 'P1') vaultCandidates.push(t);
  }

  return {
    weekOf: new Date().toISOString().split('T')[0],
    completed,
    dropped,
    deferred,
    agentStats,
    vaultCandidates,
  };
}
