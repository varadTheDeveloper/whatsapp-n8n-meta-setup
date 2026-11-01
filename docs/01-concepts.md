# 01 — Concepts

Get these straight first; most confusion comes from mixing them up.

| Thing | What it is | Where it lives | ID you'll need |
|---|---|---|---|
| **Business portfolio** | Your business container in Meta | business.facebook.com | `<BUSINESS_ID>` |
| **Meta app** | A *registration/licence* that lets software use Meta APIs. Not an app anyone downloads. | developers.facebook.com → My Apps | `<APP_ID>`, `<APP_SECRET>` |
| **WABA** (WhatsApp Business Account) | Holds phone numbers, templates, billing | WhatsApp Manager | `<WABA_ID>` |
| **Phone number** | The number messages are sent from / to | Inside the WABA | `<PHONE_NUMBER_ID>` |
| **System user** | A "robot user" in the business portfolio whose token never expires | Business Settings → Users → System users | — |
| **Access token** | Password-like key used by n8n to call the API | Generated from the system user | `<ACCESS_TOKEN>` |
| **Webhook** | Meta → your server: "a message arrived" | App → Webhooks | n8n sets this automatically |
| **n8n** | Visual automation tool; the "robot" that receives and replies | n8n Cloud or self-hosted | `<N8N_URL>` |

## How they connect

```
Business portfolio
 ├── Meta app  (App ID + App Secret)  ──subscribed to──►  WABA
 ├── WABA
 │    └── Phone number (Phone Number ID)
 └── System user ──token (scoped to app + WABA)──► used by n8n to SEND

Meta app webhook ──► n8n WhatsApp Trigger  (uses App ID + Secret to RECEIVE)
```

## Two n8n credentials, two jobs

| n8n credential type | Used by | Fields |
|---|---|---|
| **WhatsApp API** | *WhatsApp Business Cloud* node (send) | Access Token, Business Account ID (= WABA ID) |
| **WhatsApp OAuth API** | *WhatsApp Trigger* node (receive) | Client ID = App ID, Client Secret = App Secret |

## Use cases in the app setup

When Meta asks for a "use case", choose the WhatsApp/business messaging one ("Connect with customers through WhatsApp") and app type **Business**.
