# 14 — Adding the real number: what actually happened (2026-11-08)

Companion to [`09-real-number.md`](09-real-number.md). Real-world notes from moving Vulturus off Meta's test number.

## Starting point
- App **`live`** (Live mode) used Meta's **test number** `+1 555 …` → only 5 hand-added recipients could chat. Real customers could not.
- App → **WhatsApp → Step 2. Production setup**: *Configure Webhooks* ✅, *Register your WhatsApp phone number* ❌, *Add payment* ❌.

## Problem 1 — "Next" greyed out in the developer-dashboard flow
**Where:** App → WhatsApp → Step 2 → *Add phone number* → step 2 *Select your business assets*.
**Seen:** business portfolio and *WhatsApp account = "Create a WhatsApp Business account"* both disabled, **Next disabled**, no error text. Same with every number choice, including *"Use a display name with a virtual number instead"*.
**Cause (most likely):** the business portfolio already had **8 WhatsApp Business Accounts** (one short-named, six named after the owner, one `Test Messaging Account`) left over from earlier attempts — Meta limits creating more.
**Fix that worked:** don't create a new WABA. Use an **existing empty one**:
1. Business Settings → Accounts → **WhatsApp accounts / Messaging accounts** → find one with no numbers.
2. Open **WhatsApp Manager → Phone numbers** for that WABA (`https://business.facebook.com/wa/manage/phone-numbers/?waba_id=<WABA_ID>&business_id=<BUSINESS_ID>`).
3. **Add phone number** → business profile → number → OTP.

## Problem 2 — the phone-number dropdown
The dashboard flow offered three choices:
| Option | Notes |
|---|---|
| Enter a new phone number | Spare SIM — recommended |
| **Use a display name with a virtual number instead** | Meta-provided number; "business name and display name reviewed, up to 5 business days"; needs **business verification** (registered business, official phone/address). Only offered in the dashboard flow, **not** in WhatsApp Manager. |
| Your own verified number | Was the owner's personal WhatsApp number |

WhatsApp Manager's *Add phone number* only accepts a **real number** (country code + number).

## Problem 3 — display name and category
- Display name must match the **verified business name / website**. The portfolio was verified with a web-services website that doesn't mention the bot brand, so the brand name would likely be rejected → used the **owner's name** first (matches verification), plan to switch to the brand later after adding a brand page to the website.
- WhatsApp Manager categories: Finance and banking, Food and groceries, Alcoholic drinks, Government, Hotel and lodging, Medical and health, Over-the-counter medicine, Charity, Professional services, Shopping and retail, Travel and transportation, Restaurant, Other. **No "Real estate"** → used **Professional services**.
- Typing into the description box dropped characters (page re-renders). Set the textarea value with the native setter + `input` event, then verify by zooming.

## Result
| Field | Value |
|---|---|
| WABA | the existing empty one (`<WABA_ID_REAL>`) |
| Phone number ID | `<PHONE_NUMBER_ID_REAL>` |
| Display name | owner's name — **In review** |
| Status | **Unverified** at time of writing |
| Page also showed | "1 WhatsApp account is linked", green WhatsApp badge on the number, *Connect WhatsApp account* disabled → looks like **coexistence** (number linked to the WhatsApp Business app) — not confirmed |

## Personal number warning
A number on the Cloud API **cannot** be used in the normal WhatsApp app at the same time. Re-verifying it in WhatsApp takes it back and breaks the bot. **Coexistence** only works with the **WhatsApp Business app**, set up through the coexistence flow. Use a dedicated SIM for the bot when possible.

## Still to do (as of 2026-11-11)
1. **System user** `n8n-bot` → Assign assets → WhatsApp accounts → the new WABA → **Full control** (so the n8n token can send from the new number).
2. `POST /<WABA_ID_REAL>/subscribed_apps` with a token for app `live` (`docs/06`) — otherwise customer messages to the new number never reach n8n.
3. `POST /<PHONE_NUMBER_ID_REAL>/register` with `{"messaging_product":"whatsapp","pin":"<6-digit PIN>"}` — owner chooses the PIN.
4. Wait for display-name approval.
5. Payment method + approved **utility template** for broker alerts (error 131047 seen live).
6. No workflow change needed: v2 reads `metadata.phone_number_id` from each incoming message and replies from the same number.
