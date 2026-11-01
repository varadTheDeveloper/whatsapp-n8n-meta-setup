# 08 — A second (or production) app without breaking the first

## What can be shared
- The same **system user** (`n8n-bot`): assign the new app as an asset, then generate a **new token for that app**.
- The same business portfolio and n8n account (new workflow).

## What cannot be shared
- **App ID / App Secret** — each app has its own; each n8n trigger needs its own app's pair.
- **One WABA subscribed to two active apps** → double replies (see `06`).

## Recommended production setup
1. New app → Live (`05`).
2. Add a **real number**, ideally in its **own WABA** (`09`).
3. `POST /<NEW_WABA_ID>/subscribed_apps` with a token for the new app.
4. System user → assign new app (Manage app) + new WABA (Full control) → generate token (Never, both WhatsApp permissions).
5. n8n → **new workflow**: trigger with new App ID + Secret, send node with new token + new number. Publish.

The original app, number and workflow keep working untouched.

## Switching an existing bot from app A to app B (same WABA)
1. Make B Live; `POST /<WABA_ID>/subscribed_apps` with B's token.
2. Create B's OAuth credential in the trigger; optionally B's WhatsApp API credential in the send node.
3. Republish.
4. Only then `DELETE /<WABA_ID>/subscribed_apps` with A's token (ask first).
5. Test: exactly **one** reply per message.

Don't unlink A until B's credentials are confirmed saved — otherwise the bot goes silent.

## Many bots / many numbers
| Situation | Approach |
|---|---|
| One business, several numbers | One app/WABA; trigger receives all numbers; route with a **Switch** on `metadata.phone_number_id` |
| Separate agency clients | One Meta app (and WABA) per client, one n8n workflow each |
| Lots of clients | Generic n8n **Webhook** node (no one-per-app limit), or become a Meta **Tech Provider** |
