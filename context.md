# PatrickOS — CONTEXT.md
**Last updated:** 2026-03-15
**Phase:** 2 — Agent API + PatrickOS Dashboard (**scaffolded & API tested**)
**Repo target:** `~/projects/patrickos/` on Omen (WSL2/Win11)

---

## What This Project Is

A monorepo containing two things:

1. **`api/`** — Node.js/Express Agent API (port 3200). The sole interface agents use to interact with the Notion Tasks DB. Wraps the Notion MCP, enforces append-only execution logging, handles Telegram notifications, and exposes digest endpoints for cron jobs.

2. **`dashboard/`** — React/Vite PatrickOS app (port 3201). The long-term home for all PatrickOS tooling. Task Management is the first view. Multi-view shell from day one — `/tasks`, `/agents`, `/vault`, `/briefings` routes stubbed even before those views are built.

The IE dashboard at `~/projects/intelligence-engine` stays completely independent. It may migrate into PatrickOS later or ship standalone — that decision is deferred.

---

## Monorepo Structure (scaffolded 2026-03-15)

```
~/projects/patrickos/
├── CONTEXT.md                  ← this file
├── package.json                ← root (workspaces: ["api", "dashboard"])
├── .gitignore
│
├── api/
│   ├── package.json
│   ├── .env                    ← secrets (see env vars below)
│   ├── src/
│   │   ├── index.js            ← Express entry, port 3200
│   │   ├── routes/
│   │   │   ├── tasks.js        ← all /tasks endpoints
│   │   │   └── digest.js       ← /digest/daily, /digest/weekly
│   │   └── services/
│   │       ├── notion.js       ← Notion API wrapper (read/write tasks)
│   │       └── telegram.js     ← send message to Grant or Petit channel
│   └── ...
│
└── dashboard/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx             ← shell + React Router
        ├── components/
        │   └── Sidebar.jsx     ← nav: Tasks, Agents, Vault, Briefings
        └── views/
            ├── Tasks.jsx       ← BUILT OUT in Phase 2
            ├── Agents.jsx      ← stub ("Coming soon")
            ├── Vault.jsx       ← stub
            └── Briefings.jsx   ← stub
```

---

## Notion Tasks DB

**DB URL:** `https://www.notion.so/2dd0e68bcb87808eb573f3dcdde4b809`  
**Data Source ID:** `2dd0e68b-cb87-800d-bc95-000b8563868d`  
**Parent page:** Patrick OS & Execution (`2da0e68b-cb87-8045-bf1a-db39deee049d`)

### Full Schema (as of Phase 1 completion)

**Original properties (do not modify):**
- `Task` (title), `Status`, `Priority`, `Context`, `Due Date`, `Completed`, `Completed Date`, `Effort`, `Energy`, `Today Tier`, `Waiting`, `Created`, `Last Edited`
- Relations: `Content Pipeline`, `Daily Start Log`, `Master Thread List`, `Power Map`, `Weekly OS Log`
- Formulas: `Days Out`, `Week Of` · Rollups: `Day`, `Week`
- Buttons: `✓ Complete`, `🔗 Link to Week`

**New properties added in Phase 1:**

| Property | Type | Values |
|---|---|---|
| `Assigned To` | Select | Human / Agent / Both |
| `Agent ID` | Select | grant / Petit / claude-code / ChatGPT / Notion AI |
| `Execution Log` | Rich Text | Append-only — never overwrite |
| `Escalated` | Checkbox | true / false |
| `Escalation Notes` | Rich Text | Reason for escalation |
| `Sync to Vault` | Checkbox | true / false |
| `Domain` | Select | IBM / Job Search / Creative / PatrickOS |

**Status values:** `Inbox` · `Next` · `In Progress` · `Waiting` · `Done` · `Dropped`  
**Priority:** `P1` (high) · `P2` · `P3` (low)

---

## Agent Roster

| Agent ID | Machine | Execution Mode |
|---|---|---|
| `grant` | Omen (WSL2) | Autonomous via API |
| `Petit` | Alien (i9-10900F, RTX 3060Ti) | Autonomous via API |
| `claude-code` | Omen (WSL2) | Autonomous via API |
| `ChatGPT` | External | Manual entry — Patrick pastes results |
| `Notion AI` | Notion-internal | Manual entry — Patrick pastes results |

ChatGPT and Notion AI tasks are assigned in Notion by Patrick. Results are manually entered into `Execution Log`. A ChatGPT→Notion push workflow may automate this later — not in scope for Phase 2.

---

## Telegram Notification Routing

Two channels already set up by Patrick. Channel IDs go in `.env`.

| Scenario | Channel |
|---|---|
| Tasks assigned to `grant`, `claude-code`, `ChatGPT`, `Notion AI` | Grant channel |
| Tasks assigned to `Petit` | Petit channel |
| Escalation alerts | Route by agent ID (above) |
| Overdue alerts | Both channels (one message each, filtered by agent) |

---

## API Endpoints (all implemented & tested 2026-03-15)

**Base:** `http://localhost:3200/api/v1`  
**Auth:** `Authorization: Bearer <AGENT_API_KEY>` on all routes

| Method | Path | Notes |
|---|---|---|
| `GET` | `/tasks` | Query params: `?agent=`, `?status=`, `?domain=`. Returns array of task objects. |
| `POST` | `/tasks` | Body: `{ task, priority, domain, agent_id, due_date }`. Creates in Notion with Status=Inbox. |
| `PATCH` | `/tasks/:id/status` | Body: `{ status }`. Valid values match Notion Status options. |
| `POST` | `/tasks/:id/log` | Body: `{ entry }`. **Append-only** — prepend timestamp, never overwrite existing log. |
| `POST` | `/tasks/:id/escalate` | Body: `{ reason }`. Sets Escalated=true, writes Escalation Notes, sends Telegram alert. |
| `POST` | `/tasks/:id/complete` | Marks Status=Done, sets Completed Date to today. If Priority=P1 also sets Sync to Vault=true. |
| `GET` | `/tasks/overdue` | Returns tasks where Due Date < today AND Status not in [Done, Dropped]. |
| `GET` | `/digest/daily` | Returns structured payload: today's tasks by priority, overdue count, per-agent activity. |
| `GET` | `/digest/weekly` | Returns structured payload: completed/dropped/deferred breakdown, agent stats, vault candidates. |

**Notion page ID format:** Notion MCP returns page URLs like `https://www.notion.so/PAGEID`. Strip the URL to get the bare ID for subsequent calls.

---

## Dashboard — Tasks View (Phase 2, UI scaffolded 2026-03-15)

The only fully built view in Phase 2. Shows:

- **Header bar:** PatrickOS logo/wordmark, current date, nav links
- **Sidebar:** Tasks (active) · Agents · Vault · Briefings (last 3 = "coming soon" stubs)
- **Task board sections:**
  - 🔴 Escalated (any escalated=true, not done/dropped)
  - ⚡ In Progress (status=In Progress)
  - 📋 Next Up (status=Next, sorted by priority then due date)
  - 🕐 Overdue (past due date, not done/dropped)
  - 📥 Inbox (status=Inbox)
- **Each task card shows:** Task name, Domain badge, Agent ID badge, Priority badge, Due Date, Days Out
- **Escalated cards** show Escalation Notes inline
- **Refresh button** + auto-refresh every 60 seconds
- **Dark theme** — consistent with IE dashboard aesthetic

Dashboard calls `http://localhost:3200/api/v1/tasks` — no direct Notion access.

---

## Environment Variables (api/.env)

```env
# Notion
NOTION_TOKEN=                    # Notion integration token
NOTION_TASKS_DB_ID=2dd0e68bcb87808eb573f3dcdde4b809

# Agent API
AGENT_API_KEY=                   # Bearer token agents use to authenticate
PORT=3200

# Telegram
TELEGRAM_BOT_TOKEN=              # From BotFather
TELEGRAM_GRANT_CHANNEL_ID=       # Patrick to fill in
TELEGRAM_PETIT_CHANNEL_ID=       # Patrick to fill in

# Email (Phase 3 — leave blank for now)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
DIGEST_EMAIL=patrick@patrickpitre.io
```

---

## Key Architectural Rules

1. **Execution Log is append-only.** The `/log` endpoint must read the current value, prepend `[TIMESTAMP] entry\n` to the existing content, and write the full string back. Never use set/replace on that field alone.

2. **Agents never touch Notion directly.** All Notion reads and writes go through `services/notion.js`. No agent or route file should import the Notion client directly.

3. **Telegram routing is always by agent ID.** The `telegram.js` service takes `(message, agentId)` and resolves the correct channel internally. Routes never reference channel IDs directly.

4. **Dashboard calls API only.** No Notion SDK in the dashboard. If the dashboard needs data not currently exposed by the API, add an endpoint first.

5. **PatrickOS shell has routing from day one.** Even stub views get real routes in `App.jsx` (`/agents`, `/vault`, `/briefings`). They render a "Coming Soon" placeholder. Do not skip this.

6. **Port allocation on Omen:**
   - 3000 — Intelligence Engine dashboard (leave alone)
   - 3200 — PatrickOS Agent API (this project)
   - 3201 — PatrickOS Dashboard (this project)

---

## What's NOT in Scope for Phase 2

- Cron jobs / scheduled notifications (Phase 3)
- Email delivery (Phase 3)
- PostgreSQL / Context Vault sync (Phase 4)
- IE dashboard migration into PatrickOS (deferred, decision pending)
- ChatGPT→Notion push automation (open question, not yet designed)

---

## Related Notion Pages

| Page | ID | URL |
|---|---|---|
| Task Management System Design Doc | `3250e68b-cb87-81a6-97c6-ef13ac1e3d89` | https://www.notion.so/3250e68bcb8781a697c6ef13ac1e3d89 |
| Agent & App Lab | `2dd0e68b-cb87-80ee-8267-d63bf945c79e` | https://www.notion.so/2dd0e68bcb8780ee8267d63bf945c79e |
| Patrick OS & Execution | `2da0e68b-cb87-8045-bf1a-db39deee049d` | https://www.notion.so/2da0e68bcb8780d9b955fa48538e1c2e |

---

## Current Status (2026-03-15)

### What's done
- Monorepo scaffolded with npm workspaces (`api/` + `dashboard/`)
- All API endpoints implemented and tested against live Notion DB (75 tasks returned)
- Write endpoints verified: create, log (append-only), status update, escalate, complete
- Input validation working (invalid status returns 400 with valid options)
- Dashboard shell built with React Router — Tasks view fully wired, 3 stub views routed
- `.env` populated with Notion token, generated API key, and Telegram bot token
- Git repo initialized, initial commit `8375f21`

### Discovered during build
- **Notion `Status` property is type `select`, not `status`.** All Notion API calls use `select` semantics for Status reads/writes/filters. This was caught and fixed during testing.
- **Telegram Grant channel ID (`8795835361`) returns "chat not found".** The bot token works but the channel ID may need the `-100` prefix or verification from BotFather/getUpdates.
- **Telegram Petit channel ID (`8670109624`) matches the bot token prefix** — may also need verification.

### What's next
- Verify/fix Telegram channel IDs so escalation alerts deliver
- Test dashboard end-to-end (start both API + Vite, confirm Tasks view renders from live data)
- No Notion schema changes were made
- No new env vars beyond what was documented

---

## Session Handoff Instructions

At the end of each Claude Code session working on this project:
1. Update this file with current phase status, any decisions made, and blockers
2. Note any new env vars added
3. Note any Notion schema changes
4. Commit alongside the code changes
