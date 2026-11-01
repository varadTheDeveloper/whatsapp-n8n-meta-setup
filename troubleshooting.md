# Troubleshooting — every problem hit in the real setup

Listed in the order they happened.

### 1. Real messages never reach n8n, but Meta's "Test" button works
**Cause:** app in **Development** mode. Meta only sends dashboard test webhooks for unpublished apps.
**Fix:** `docs/05-go-live.md`.

### 2. App is Live, still no real messages
**Cause:** WABA subscribed only to `WA DevX Webhook Events 1P App` (Meta's test inbox), not to your app. Visible because Meta's *API Setup → Check test webhooks* panel showed the real messages.
**Fix:** `POST /<WABA_ID>/subscribed_apps` with a token for your app. `docs/06-graph-api-link.md`.

### 3. n8n "Listening for test event" stops / misses messages
**Cause:** test listening times out and catches only one event.
**Fix:** click **Execute step** again right before sending, or **Publish** the workflow.

### 4. User says "done" but the credential isn't there
**Cause:** n8n credential popup closed (✕ or click outside) before **Save**. Unsaved credentials vanish.
**Fix:** reopen, refill non-secret fields, ask the human to paste and click **Save**, then verify in the credential dropdown.

### 5. "Generate Access Token" in Graph API Explorer does nothing
**Cause:** the permission popup opens outside the agent's tab, and Chrome often blocks popups from automated clicks.
**Fix:** human clicks the button, allows popups for developers.facebook.com, clicks **Continue**.

### 6. Form fields stay empty after typing
**Cause:** typing at screen coordinates while the page scrolls.
**Fix:** locate fields by element reference (accessibility tree), click, type, then screenshot to confirm before saving.

### 7. `{{ $json.messages[0].from }}` sent literally
**Cause:** field left in **Fixed** mode.
**Fix:** clear it, switch to **Expression**, retype. Preview shows the number.

### 8. n8n not reachable on `localhost:5678`
**Cause:** the human's n8n was on n8n Cloud (`<name>.app.n8n.cloud`).
**Fix:** find the instance from app.n8n.cloud → *Open instance*. Meta webhooks need public HTTPS anyway.

### 9. Wrong browser tab ID / "tab not in group"
**Fix:** re-read the tab context and use the IDs returned there.

### 10. Two apps on one WABA → double replies (risk)
**Cause:** both apps subscribed and both with active triggers.
**Fix:** keep only one app subscribed per WABA with a live trigger; `DELETE /<WABA_ID>/subscribed_apps` with the old app's token **after** the new one is confirmed working.

### 11. Error `131030` "Recipient phone number not in allowed list"
**Cause:** test number + recipient not among the 5 verified.
**Fix:** add the recipient in API Setup, or switch to a real number.

### 12. Text reply fails outside 24h
**Fix:** send an approved template instead.

### 13. Agent refuses to paste token/App Secret
**Expected.** Agents must not type secrets. The human pastes; the agent fills every other field and verifies afterwards.
