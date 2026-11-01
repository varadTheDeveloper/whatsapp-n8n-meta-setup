# WhatsApp Cloud API + n8n — a reproducible setup playbook

A complete, tested walkthrough for connecting a **Meta (Facebook) app + WhatsApp Cloud API** to **n8n**, so n8n can **receive** WhatsApp messages and **auto-reply**. Written so that **AI agents and humans** can reproduce it step by step, including every problem we hit and how it was fixed.

> Built from a real setup session (Oct–Nov 2026) using n8n Cloud, Meta for Developers, Meta Business Suite and the Graph API Explorer. Graph API version used: `v26.0`.

## What you end up with

```
WhatsApp user ──► WhatsApp number ──► Meta app (Live, subscribed to the WABA)
                                            │  webhook (messages)
                                            ▼
                                  n8n: WhatsApp Trigger ──► Send message ──► reply to sender
```

- A Meta app in **Live** mode with privacy/terms/data-deletion URLs.
- A **System User** with a **permanent access token** (never expires).
- The app **subscribed to the WhatsApp Business Account (WABA)** via the Graph API — the fix that made real messages arrive.
- An n8n workflow (**published**) that replies to every incoming message.

## Quick start

1. Read [`AGENTS.md`](AGENTS.md) if you are an AI agent — it has the rules and the order of operations.
2. Follow [`docs/`](docs) in order (`01` → `07`).
3. Use [`checklists/setup-checklist.md`](checklists/setup-checklist.md) to tick off progress.
4. Stuck? See [`troubleshooting.md`](troubleshooting.md).

## Contents

| File | What it covers |
|---|---|
| [AGENTS.md](AGENTS.md) | Rules for AI agents: order, human-only steps, safety, verification |
| [docs/01-concepts.md](docs/01-concepts.md) | App vs WABA vs phone number vs system user vs n8n |
| [docs/02-meta-app-setup.md](docs/02-meta-app-setup.md) | Create app, add WhatsApp, test number, recipients |
| [docs/03-permanent-token.md](docs/03-permanent-token.md) | System user, assign assets, generate never-expiring token |
| [docs/04-n8n-receive.md](docs/04-n8n-receive.md) | WhatsApp Trigger + OAuth credential (App ID + Secret) |
| [docs/05-go-live.md](docs/05-go-live.md) | Privacy URL, category, Development → Live |
| [docs/06-graph-api-link.md](docs/06-graph-api-link.md) | **Key fix:** `POST /{WABA_ID}/subscribed_apps` |
| [docs/07-n8n-reply.md](docs/07-n8n-reply.md) | Send message node, recipient expression, publish |
| [docs/08-second-app.md](docs/08-second-app.md) | A second / production app without breaking the first |
| [docs/09-real-number.md](docs/09-real-number.md) | Adding a real business number |
| [docs/10-limits-and-costs.md](docs/10-limits-and-costs.md) | 5-recipient test limit, 24h window, templates, daily caps |
| [docs/11-real-estate-flow.md](docs/11-real-estate-flow.md) | Example use case: property bot for brokers |
| [troubleshooting.md](troubleshooting.md) | Every problem hit during the real setup, with fixes |
| [graph-api/requests.md](graph-api/requests.md) | Exact Graph API calls used |
| [workflows/whatsapp-auto-reply.json](workflows/whatsapp-auto-reply.json) | Importable n8n workflow (no credentials) |
| [.env.example](.env.example) | Names of every ID/secret you will collect |

## Security

This repo contains **no real tokens, secrets or IDs**. All values are placeholders like `<APP_ID>`. Never commit your access token or App Secret.

## License

MIT
