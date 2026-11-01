# 03 — Permanent access token (System User)

The token from *API Setup* expires in 24h. A **system user** token can be set to never expire.

## Steps

1. Open **business.facebook.com/settings** → select the business portfolio linked to your app.
2. **Users → System users → Add**
   - Name: `n8n-bot`
   - Role: **Admin**
3. Select `n8n-bot` → **⋯ → Assign assets**
   - **Apps** → tick your app → turn on **Manage app** (Full access) → **Assign assets**
   - **WhatsApp accounts** → tick your WABA → **Full control**
4. Click **Generate token**
   - Select app: your app
   - Expiry: **Never**
   - Permissions: `whatsapp_business_messaging`, `whatsapp_business_management`
   - **Generate token**
5. **Human step:** click **Copy** on the *Token created* screen and store it in a password manager. Meta shows it **once**.

## Verify
In n8n, create a **WhatsApp API** credential with this token + `<WABA_ID>`. If the **Sender Phone Number** dropdown in the send node loads your number, the token works.

## Notes
- One system user can hold tokens for several apps. Assign each app as an asset first, then generate a token **per app**.
- **Revoke tokens** revokes *all* tokens of that system user. Every n8n credential using one will break.
- A token is tied to the app it was generated for. If that app is deleted/restricted, the token stops working.
- Agents: never zoom into, read, or copy the token. Stop at the *Token created* screen.
