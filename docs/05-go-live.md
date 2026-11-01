# 05 — Switch the app to Live

While the app is in **Development** mode, Meta only delivers dashboard *Test* webhooks — **real user messages are not forwarded**.

## Steps
1. App → **App settings → Basic**, fill in:
   - **Privacy policy URL** — any public privacy policy page you own
   - **Terms of Service URL** (optional but recommended)
   - **User data deletion** → *Data deletion instructions URL* (the privacy page works if it explains how to request deletion)
   - **Category** → *Business and pages*
   - App icon (optional)
2. **Save Changes** → wait for *Changes saved*.
3. Toggle **App Mode: Development → Live** in the top bar.

## Verify
- Toggle shows **Live**.
- **Alerts → Inbox**: "*app* was switched to live mode".
- My Apps list shows `Mode: Live`.

## Notes
- **App Review is not needed** when you only use your own business's WhatsApp account. It's needed if you manage WhatsApp for *other* businesses as a platform (Tech Provider).
- Fill the form using element references (not raw coordinates). The page scrolls while typing; in our session the first attempt left fields empty. Re-check with a screenshot before saving.
