# 16 – Moving Vulturus from n8n Cloud (trial) to self-hosted n8n on PikaPods

Done on **11 Nov 2026**, about 1h45m before the n8n Cloud trial ended. The live bot now runs on PikaPods.

## What runs where now

| Thing | Where |
|---|---|
| n8n | PikaPods pod (EU, n8n 2.46.x, Postgres). URL: `https://<POD>.pikapod.net` |
| Bot workflow | `Vulturus v2 – WhatsApp bot (fast)` – **active** on the pod |
| Sync workflow | `Vulturus v2 – Listings & sync` – **active** on the pod |
| Old n8n Cloud copies | **deactivated** (trial ended) |
| Data Tables | `vulturus_properties` (67 rows copied over), `vulturus_sessions` (starts empty) |
| Meta webhook (WhatsApp Business Account object) | `https://<POD>.pikapod.net/webhook/<uuid>/webhook`, set automatically when the pod's WhatsApp Trigger was activated |

## Steps (in order)

1. **Create the pod** on PikaPods (n8n app). Free $5 credit, then about $2–4/month.
2. **Create Data Tables** on the pod with the same columns, then copy the rows over through
   `POST /rest/projects/<pid>/data-tables/<tid>/insert {data:[…], returnType:'count'}`.
3. **Import both workflows**, then point every Data Table node at the new table IDs.
4. **Create credential shells through the REST API, with secrets left empty**, then have the human paste the secrets:
   - `OpenAI account` (openAiApi): API key.
   - `WhatsApp account (send)` (whatsAppApi): **system-user token** (Business settings → System users → n8n-bot → Generate token, app *live*, expiry **Never**, `whatsapp_business_messaging` + `whatsapp_business_management`) and the WABA ID.
   - `WhatsApp OAuth account (trigger)` (whatsAppTriggerApi): App ID plus **App secret** (App settings → Basic → Show).
   - Check each one with `POST /rest/credentials/test` (all 3 returned "Connection successful!").
5. **Google OAuth (needed on self-hosted, because n8n Cloud's managed Google login is not available there):**
   1. Google Cloud: new project → enable **Sheets, Drive, Calendar** APIs.
   2. Google Auth Platform: App info → Audience **External** → contact email → accept the user-data policy (human).
   3. Branding: home page, privacy and terms URLs on the verified business site. Authorised domains: that site's domain **and `pikapod.net`**.
   4. Clients → **Web application** with redirect URI `https://<POD>.pikapod.net/rest/oauth2-credential/callback`.
      The secret is shown **only once** in the popup, so the human copies it.
   5. Audience → **Publish app → In production**. In *Testing*, refresh tokens die after 7 days and the bot would quietly stop writing to Sheets and Calendar.
   6. In n8n, create 4 credentials (`googleSheetsOAuth2Api`, `googleSheetsTriggerOAuth2Api`, `googleCalendarOAuth2Api`, `googleDriveOAuth2Api`) with the Client ID filled in.
      The human pastes the secret and clicks **Sign in with Google** as the account that owns the sheets and calendar.
      You will see an "unverified app" warning. That's expected: click Advanced → Go to app.
   7. Link the credentials to all 8 Google nodes: bot = Check Calendar, Create Calendar Event, Save Lead; sync = 2 Sheets triggers, Drive, 2 Sheets nodes.
6. **Safe tests before switching** (nothing listens to Meta during these):
   - Bot copy where the WhatsApp Trigger is **replaced by a Code node with the same name** that returns a sample payload, plus a Manual Trigger in front. All sends, Create Calendar Event and Save Lead are disabled. Result: correct reply, about 6 s (the first OpenAI call is the slow part).
   - Read-only Google check (Sheets read, Calendar getAll, Drive search): all OK.
   - Afterwards, delete the test session row from `vulturus_sessions`.
7. **Switch-over (order matters):**
   1. **Deactivate the old bot and sync first.** Deactivating an n8n WhatsApp Trigger deletes the app's webhook subscription. If you do it *after* activating the new one, it kills the new link.
   2. Activate the pod bot and sync (`POST /rest/workflows/<id>/activate {versionId}`).
   3. Check Meta → app → Webhooks → *WhatsApp Business Account*: the callback URL should be the pod.
   4. Send "Hi" from a phone. Done: `Send Reply` OK in about 6 s.

## Gotchas found

- `GET /rest/me` returns 404 on this n8n version. Use `/rest/projects/personal` for the project ID.
- Delivery-status webhooks (sent, delivered, read) each create a short execution (about 15 ms) that stops at `Is Message?`. This is normal.
- The executions list `filter` query param did not filter by workflowId here. List without a filter and match `workflowId` yourself.
- The Google Cloud project can belong to a different Google account from the one that owns the data. What matters is the account picked at **Sign in with Google**.

## Still to do

- Real number: assign the system user to the real WABA → `POST /<REAL_WABA_ID>/subscribed_apps` → `POST /<REAL_PHONE_NUMBER_ID>/register` (PIN) → display-name approval → switch the `WhatsApp account (send)` WABA ID and the phone_number_id in the nodes.
- Broker alert message template plus a payment method (needed for messages outside the 24 h window).
- Delete the 2 inactive TEST workflows on the pod when no longer needed.
