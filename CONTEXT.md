# PatrickOS — CONTEXT.md
**Last updated:** 2026-03-18
**Phase:** 3 Complete / 4 Blocked — System operational
**Repo:** `~/projects/patrickos/` on Omen (WSL2/Win11)
**GitHub:** https://github.com/patrickpitre28/patrickos (branch: master)

---

## What This Project Is

A monorepo containing two things:

1. **`api/`** — Node.js/Express Agent API (port 3200). The sole interface agents use to interact with the Notion Tasks DB. Wraps the Notion REST API, enforces append-only execution logging, and exposes digest endpoints for cron jobs.

2. **`dashboard/`** — React/Vite PatrickOS app (port 3201). The long-term home for all PatrickOS tooling. Task Management is the first view. Multi-view shell from day one — `/tasks`, `/agents`, `/vault`, `/briefings` routes stubbed.

The IE dashboard at `~/projects/intelligence-engine` stays completely independent.

---

## Monorepo Structure (Phase 3 Complete)

```
~/projects/patrickos/
├── CONTEXT.md
├── package.json                ← root (workspaces: ["api", "dashboard"])
├── .gitignore                  ← **/.env excluded
│
├── api/
│   ├── package.json            ← includes nodemailer, node-cron; "jobs" script added
│   ├── .env                    ← all vars populated (see env vars below)
│   ├── src/
│   │   ├── index.js            ← Express entry, port 3200
│   │   ├── routes/
│   │   │   ├── tasks.js
│   │   │   └── digest.js
│   │   ├── services/
│   │   │   └── notion.js       ← Notion API wrapper
│   │   └── jobs/
│   │       ├── index.js        ← starts all cron jobs
│   │       ├── dailyDigest.js  ← 0 14 * * * UTC (8AM CST) → HTML email
│   │       ├── overdueAlert.js ← 0 */4 * * * → console log, silent if none
│   │       └── weeklyReport.js ← 0 21 * * 5 UTC (Fri 3PM CST) → email + Notion page
│
└── dashboard/
    ├── package.json
    ├── .env                    ← VITE_API_KEY, VITE_API_URL
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx             ← shell + React Router
        ├── components/
        │   └── Sidebar.jsx
        └── views/
            ├── Tasks.jsx       ← live
            ├── Agents.jsx      ← stub
            ├── Vault.jsx       ← stub
            └── Briefings.jsx   ← stub
```

---

## PM2 Processes (all running on Omen)

```bash
pm2 status
# Should show 3 processes online:
# patrickos-api       port 3200
# patrickos-jobs      cron jobs
# patrickos-dashboard port 3201

pm2 save        # persist across reboots
pm2 startup     # enable autostart (run once if not done)
```

---

## Notion Tasks DB

**DB URL:** https://www.notion.so/2dd0e68bcb87808eb573f3dcdde4b809
**Data Source ID:** `2dd0e68b-cb87-800d-bc95-000b8563868d`

### Current Schema (verified 2026-03-18)

**Original properties:**
- `Task` (title), `Status`, `Priority`, `Context`, `Due Date`, `Completed Date`, `Effort`, `Waiting`, `Created`, `Last Edited`, `Days Out` (formula)
- Button: `✓ Complete`

**Agent properties added Phase 1:**
- `Assigned To` — Select: Human / Agent / Both
- `Agent ID` — Select: claude-code / ChatGPT / Notion AI
- `Execution Log` — Rich Text (append-only — never overwrite)
- `Escalated` — Checkbox
- `Escalation Notes` — Rich Text
- `Sync to Vault` — Checkbox
- `Domain` — Select: IBM / Executive Ascent / Creative / PatrickOS / Aporia / Personal / Content / Family
- `Archived` — Checkbox

**Status values:** Inbox · Next · In Progress · Waiting · Done · Dropped
**Priority:** P1 (high) · P2 · P3 (low)

**Note:** Domain options have expanded since initial build. `Job Search` was renamed to `Executive Ascent`. New options added: Aporia, Personal, Content, Family. Update any hardcoded Domain references in the codebase.

---

## Environment Variables

**api/.env:**
```env
NOTION_TOKEN=<notion token>
NOTION_TASKS_DB_ID=2dd0e68bcb87808eb573f3dcdde4b809
AGENT_API_KEY=<generated key>
PORT=3200
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=patrick@patrickpitre.io
SMTP_PASS=<google workspace app password — set>
DIGEST_EMAIL=patrick@patrickpitre.io
```

**dashboard/.env:**
```env
VITE_API_KEY=<same as AGENT_API_KEY>
VITE_API_URL=http://localhost:3200/api/v1
```

---

## Agent API Endpoints

**Base:** `http://localhost:3200/api/v1`
**Auth:** `Authorization: Bearer <AGENT_API_KEY>`

| Method | Path | Notes |
|---|---|---|
| GET | /tasks | Filters: ?agent=, ?status=, ?domain= |
| POST | /tasks | Create task, lands in Inbox |
| PATCH | /tasks/:id/status | Update Status |
| POST | /tasks/:id/log | Append to Execution Log (never overwrites) |
| POST | /tasks/:id/escalate | Set Escalated=true |
| POST | /tasks/:id/complete | Mark Done, set Completed Date, sync P1s to vault |
| GET | /tasks/overdue | Past due, not Done/Dropped |
| GET | /digest/daily | Daily digest payload |
| GET | /digest/weekly | Weekly review payload |

**Bugs fixed during build:**
- `NOTION_TASKS_DB_ID` had wrong dashes — fixed
- `dotenv` path resolution failed from monorepo root — fixed with explicit `__dirname` path
- Dashboard missing `Authorization` header — fixed via `VITE_API_KEY`

---

## Accountability Engine (Phase 3 — Complete)

All three jobs running via PM2:
- **Daily digest** — 8AM CST → email to patrick@patrickpitre.io
- **Overdue alert** — every 4 hours → console log (Telegram removed)
- **Weekly report** — Friday 3PM CST → email + Notion page

**Telegram:** Removed — Grant and Petit bots deleted.

### Current practical workflow
- Patrick creates/views tasks via Notion on phone or via Claude chat
- PatrickOS dashboard (localhost:3201) provides live task view
- Accountability Engine fires automatically — no agent involvement needed

---

## Phase 4 — Context Vault Sync (Blocked on IE)

Do not build until IE stabilizes. When ready:
- Build `api/src/services/vault.js` — PostgreSQL sync
- Four triggers: Sync to Vault checkbox, Escalated+Overdue, Friday batch, P1 completion
- Add `/vault` view to PatrickOS dashboard (currently stubbed)
- PostgreSQL schema in design doc

---

## Related Notion Pages

| Page | URL |
|---|---|
| Task Management System Design | https://www.notion.so/3250e68bcb8781a697c6ef13ac1e3d89 |
| Agent Architecture | https://www.notion.so/3250e68bcb878127a510c362d8124bbc |
| PatrickOS Infrastructure | https://www.notion.so/3250e68bcb8781c19310ef69bbf517a0 |
| Three Laws of Agents | https://www.notion.so/3250e68bcb87817b9b47d41d424771e1 |
| Xidax Reallocation Plan | https://www.notion.so/3250e68bcb878150bb5fd5f1198beb4b |
| Agent & App Lab | https://www.notion.so/2dd0e68bcb8780ee8267d63bf945c79e |

---

## Session Handoff Instructions

At the end of each Claude Code session:
1. Update this file — phase status, decisions made, blockers
2. Note any new env vars added
3. Note any Notion schema changes
4. Commit: `git add -A && git commit -m "..." && git push origin master`
