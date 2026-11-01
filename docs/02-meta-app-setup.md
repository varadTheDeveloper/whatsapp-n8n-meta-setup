# 02 — Meta app setup

## Prerequisites
- A Facebook account with access to developers.facebook.com
- A business portfolio in Meta Business Suite

## Steps

1. Go to **developers.facebook.com → My Apps → Create App**.
2. Use case: WhatsApp / "Other" → app type **Business**. Name it (e.g. `real-estate-bot`). The name is internal only; WhatsApp users never see it.
3. Link it to your **business portfolio**.
4. In the app dashboard: **Add product → WhatsApp → Set up**.
5. Open **WhatsApp → API Setup** (may be called *Step 1. Try it out*). Note:
   - Test number (looks like `+1 555 …`)
   - `<PHONE_NUMBER_ID>`
   - `<WABA_ID>` (WhatsApp Business Account ID)
6. Under **To**, add the human's own phone number as a **recipient** and verify it with the OTP (**human step**).
7. **App settings → Basic**: note `<APP_ID>`. The `<APP_SECRET>` is behind **Show** (needs the Facebook password — **human step**).

## Verify
- API Setup page shows the test number and your recipient.
- Optional: send the `hello_world` template from the API Setup page and confirm it arrives on the phone.

## Notes
- The test number can message **at most 5** verified recipients, and a recipient cannot be removed once added. See `10-limits-and-costs.md`.
- The temporary access token on this page **expires in ~24 hours**. Don't put it in n8n; make a permanent one (`03`).
