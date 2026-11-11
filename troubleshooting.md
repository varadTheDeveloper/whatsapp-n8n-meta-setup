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

---

## Added 2026-11-08 → 11 (Vulturus v1 → v2, real number)

### 14. Manual/API run of a WhatsApp-trigger workflow starts "listening" and can unhook the live bot
**Cause:** `POST /rest/workflows/<id>/run` (or *Execute workflow*) on a workflow whose WhatsApp Trigger has **no saved pin data** registers a **test** webhook — the trigger's create/delete hooks re-point (and later remove) the Meta app subscription.
**Fix:** stop it at once with `DELETE /rest/test-webhook/<id>`, then send a real message to check the live bot still answers; if not, unpublish/publish the live workflow. **Prevent:** test only on a copy with pin data **saved** in the workflow and sends disabled.

### 15. "Next" disabled in *Add phone number* → *Select your business assets* (no error shown)
**Cause:** creating a new WABA is blocked — the portfolio already had 8 WABAs.
**Fix:** add the number to an existing empty WABA from **WhatsApp Manager → Phone numbers → Add phone number**. `docs/14`.

### 16. Virtual-number option needs business verification
"Use a display name with a virtual number instead" → business + display name reviewed (up to 5 business days), needs a verified registered business. Not offered in WhatsApp Manager's flow.

### 17. Display name rejected risk
Display name must match the verified business name/website. Use the verified name first; rename to a brand after the website shows the brand.

### 18. Typed text loses characters in Meta forms
Page re-renders while typing. Set the value with the native setter + `input` event (or type slowly), then zoom-screenshot to verify.

### 19. Broker alert fails: error `131047` "Re-engagement message"
Free-form message to someone who hasn't messaged you in 24 h. Use an approved **template**.

### 20. Executions burned by delivery receipts
Each sent message produces `statuses` webhooks (sent/delivered/read) → each is an n8n execution (~4 per message). They exit early but count on n8n Cloud plans.

### 21. "Pune" search returned nothing / "furnished" matched "unfurnished"
Exact string matching. Treat city-wide words as *no filter*, normalise aliases ("Hinjawadi"→"hinjewadi", "Phase 1"), canonicalise furnishing/type. See `workflows/vulturus/code/brain.js`.

### 22. Session memory never saved
Save node mapped fields from a node *before* the reply was composed. Map from the node that holds the **updated** state. `docs/12` #1.

### 23. n8n Cloud code node adds ~1.7 s sometimes
Cold start of the code runner. Keep one code node on the hot path; warm runs take ~15 ms.
