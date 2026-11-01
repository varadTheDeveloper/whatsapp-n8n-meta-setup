# 04 — Receive messages in n8n (WhatsApp Trigger)

## Requirements
- n8n reachable on **public HTTPS** (n8n Cloud, or self-hosted with a domain + SSL). `localhost` will not work for Meta webhooks.

## Steps

1. In n8n: **Create workflow → Add first step** → search **WhatsApp Trigger** (shown as *WhatsApp Business Cloud* → **On messages**).
2. **Credential → Create new credential** (type **WhatsApp OAuth API**):
   - **Client ID** = `<APP_ID>`
   - **Client Secret** = `<APP_SECRET>` (**human pastes**)
   - **Save** → wait for green toast *Credential successfully created*.
3. **Trigger On** = `Messages`.
4. Click **Execute step** / **Test this trigger**. n8n calls Meta with the App ID + Secret and **registers its own webhook URL** on your app and subscribes the `messages` field. You do *not* type a callback URL or verify token yourself.

## Verify the connection (works even in Development mode)
1. Meta → your app → **Webhooks** → product **WhatsApp Business Account**. The `messages` row should say **Subscribed**.
2. Click **Test** on the `messages` row → **Send to server**. n8n should show sample output (`"name": "test user name"`, `"body": "this is a text message"`).

That proves Meta → n8n works. **Real** messages need `05` and `06` too.

## Limits
- **One WhatsApp Trigger per Meta app.** Another trigger workflow on the same app replaces this webhook.
- Test listening stops after one event or a timeout. Re-click to listen again, or **Publish** the workflow.
