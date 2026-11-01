# 09 — Adding a real business number

## Requirements
- A number you own (new SIM, existing mobile, or landline) that can receive an **SMS or voice OTP**.
- It must **not** be registered on WhatsApp or WhatsApp Business. Delete that account first (back up chats; they can't be migrated to the API).
- A **display name** matching your business (Meta reviews it).

## Steps
1. App → **WhatsApp → API Setup** → **Add phone number**.
2. Business profile: display name, category, description, time zone.
3. Enter number (+country code) → SMS/Voice → **human enters OTP**.
4. Note the new `<PHONE_NUMBER_ID>`.
5. **WhatsApp Manager → Payment settings** → add a card (needed for paid templates).
6. Recommended: **Business verification** (Business Suite → Security Centre) with documents (e.g. GST, Udyam, shop licence, business bank statement) and a website with the same business name.
7. n8n send node → **Sender Phone Number** → choose the new number → **Publish**.

## Notes
- A number on the API can't be used in the normal WhatsApp app at the same time. You can move it back by deleting it from the API.
- Many people use a dedicated SIM for the bot.
- Without verification you can still send, but with lower daily limits.
