# 15 — Backup before the trial ends, hosting options, costs

## Backing up n8n Cloud (done 2026-11-11)

What can be exported: **workflows** (full JSON), **Data Table** columns + rows, **credential names/types**. What can't: **credential secrets** — they must be re-created.

How it was done (from the logged-in n8n tab, browser console / agent JS):
```js
const h = {headers: {'browser-id': localStorage.getItem('n8n-browserId') || ''}};
const list = (await (await fetch('/rest/workflows', h)).json()).data;
const workflows = [];
for (const w of list) workflows.push((await (await fetch('/rest/workflows/' + w.id, h)).json()).data);
const tables = (await (await fetch('/rest/projects/<PROJECT_ID>/data-tables', h)).json()).data.data;
for (const t of tables) t.rows = (await (await fetch(`/rest/projects/<PROJECT_ID>/data-tables/${t.id}/rows?take=1000`, h)).json()).data;
const creds = (await (await fetch('/rest/credentials', h)).json()).data.map(c => ({id: c.id, name: c.name, type: c.type}));
// → JSON.stringify({workflows, tables, creds}) → save (gzip + base64 if moving it through a text channel)
```
The private backup (real IDs, importable) is kept **outside this repo**. This repo only holds the sanitized exports in `workflows/vulturus/`.

### Restore
1. Re-create credentials: WhatsApp API (system-user token + WABA ID), WhatsApp OAuth (App ID + App Secret) for the trigger, Google Sheets, Google Sheets Trigger, Google Calendar, Google Drive, OpenAI.
2. Create Data Tables `vulturus_properties` and `vulturus_sessions` (columns in the exports / `13`), import rows — or run *Run Full Import*.
3. Import both v2 workflows; re-pick credentials and the Data Table on the 4 Data Table nodes.
4. Unpublish any other workflow with a WhatsApp Trigger for the same Meta app; publish the bot + Listings & sync.
5. Send a WhatsApp test message; check Executions.

## Hosting options (prices checked 2026-11-08 — verify before buying)

| Option | ~Cost / month | Who manages | Notes |
|---|---|---|---|
| n8n Cloud Starter | €20–24 | n8n | **2,500 executions** — with ~4 delivery-receipt runs per message that's only ~20 customer messages/day |
| n8n Cloud Pro | €50–60 | n8n | 10,000 executions |
| Oracle Cloud free tier | €0 | you | free VM; account approval can be hit-or-miss |
| PikaPods / InstaPods (managed) | ~$3–4 | them | cheapest hands-off |
| Hetzner small VPS + Docker | ~€4–7 | you | prices rose in 2026; unlimited executions |
| Sliplane (managed Docker) | €9 | them | |

Self-host checklist: domain/subdomain with **HTTPS** (Meta webhooks require it; Caddy does SSL automatically), **Postgres** instead of SQLite, nightly backups, `WEBHOOK_URL` set to the public URL, keep n8n updated.

## Meta / WhatsApp costs
- Replies inside the 24 h window: free (service conversations).
- Business-initiated messages (broker alerts, reminders) need **approved templates** + payment method; paid per message, priced per country.
- OpenAI `gpt-4.1-mini`: one call per customer message (short prompt) — cents per hundred messages.
