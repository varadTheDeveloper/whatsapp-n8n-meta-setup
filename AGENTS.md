# AGENTS.md — instructions for AI agents

You are reproducing a WhatsApp Cloud API → n8n auto-reply bot for a human. Follow this file before anything else.

## 1. Order of operations (do not reorder)

1. **Concepts** — confirm what the human already has (Meta account, business portfolio, n8n instance URL). → `docs/01`
2. **Meta app + WhatsApp product + test number + recipient** → `docs/02`
3. **System user + permanent token** → `docs/03`
4. **n8n WhatsApp Trigger + OAuth credential** → `docs/04`
5. **App to Live mode** → `docs/05`
6. **Subscribe the app to the WABA via Graph API** → `docs/06` ← *the step most guides miss*
7. **Send message node + publish** → `docs/07`
8. **Verify end to end** (see §4)

Steps 5 and 6 are both required for **real** messages to reach n8n. Before them, only Meta's dashboard "Test" webhooks arrive.

## 2. Steps only the human can do

Do **not** attempt these; ask the human and wait:

| Step | Why |
|---|---|
| Pasting the **access token** into n8n | Agents must never type tokens/API keys into fields |
| Copying/pasting the **App Secret** into n8n | Same — it is a secret |
| Entering the **OTP** for a phone number | Only the human has the phone |
| Approving the **Graph API Explorer permission popup** | Popup opens outside the agent's tab; Chrome may block it |
| Entering their **Facebook password** (e.g. to reveal App Secret) | Credentials |
| Adding a **payment method** | Financial |

When you hand a step to the human, say exactly which tab, which field, and which button (e.g. "Click **Save** at the top right and wait for the green *Credential successfully created* toast").

## 3. Safety rules

- Never read, screenshot-zoom, copy, or repeat token/secret values. When a token is shown on screen, stop and tell the human to click **Copy**.
- Never commit IDs that identify a person (their phone number) to public places.
- Ask before: accepting terms, switching an app to Live, `DELETE` Graph API calls, unlinking an app from a WABA, revoking tokens (revoke kills **all** tokens of that system user).
- Two apps subscribed to the same WABA, both with active n8n triggers, = **double replies**. Check `GET /{WABA_ID}/subscribed_apps` before adding a second app.

## 4. How to verify each step (don't trust "done")

The human may say "done" when the save did not happen. Always check:

| Step | Verification |
|---|---|
| n8n credential saved | It appears in the node's credential dropdown / Credentials list; a green toast appeared |
| Send credential works | The **Sender Phone Number** dropdown loads the number from Meta |
| App is Live | Toggle at the top of the app dashboard shows **Live**; Alerts shows "switched to live mode" |
| WABA linked | `GET /{WABA_ID}/subscribed_apps` lists your app (not only "WA DevX Webhook Events 1P App") |
| Receive works | Send a WhatsApp message to the business number; n8n trigger shows output with `contacts[0].profile.name` = the real sender |
| Reply works | The sender receives the reply; n8n output contains `messages[0].id` (`wamid...`) |
| Always-on | Workflow shows **Published**; **Executions** tab gets a new row per message |

## 5. Known failure modes

See `troubleshooting.md`. The two big ones:

1. Real messages not arriving while the app is in **Development** → switch to Live.
2. Still not arriving after Live → the WABA is only subscribed to Meta's built-in test app → `POST /{WABA_ID}/subscribed_apps` with a token for **your** app.

## 6. n8n specifics

- **One WhatsApp Trigger per Meta app.** A second trigger on the same app overwrites the webhook.
- **Execute step / Listen for test event** listens briefly and for one event, then stops. Use **Publish** for always-on.
- Recipient expression: `{{ $json.messages[0].from }}` (switch the field to **Expression** first).
- Credential popups lose unsaved data if closed — always confirm **Save**.

## 7. Lessons from the Vulturus build (2026-11)

- **Never run a WhatsApp-trigger workflow manually/through the API without saved pin data.** It starts listening and can re-point the Meta webhook away from the live bot (`troubleshooting.md` #14). Test on a **copy** with pin data saved, all send nodes disabled, and a fake sender number; delete its session row afterwards.
- **Edit as drafts.** In n8n 2.x, saving changes the draft (`versionId`); the live version (`activeVersionId`) changes only on publish. Publishing/unpublishing is a production change — get the human's explicit OK first.
- **Back up before changing** a live workflow (duplicate it via `POST /rest/workflows`).
- **Only one active workflow per Meta app with a WhatsApp Trigger.** Before go-live, list workflows and make sure the old bot is unpublished first, then publish the new one.
- **Never put real IDs in this repo.** Sanitize exports (sheet IDs, phone-number IDs, data-table IDs, calendar emails, credential IDs, instance URL). Keep the raw backup private.
- **Verify by reading data, not by trusting "done":** check executions, Data Table rows and sheet rows after each test.
- Current project state and open items: [`sessions/2026-11-08-vulturus-session.md`](sessions/2026-11-08-vulturus-session.md).
