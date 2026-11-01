# 06 — Link (subscribe) your app to the WABA via the Graph API

**This was the fix that made real messages arrive.** After switching to Live, messages still did not reach n8n, because the WABA was subscribed only to Meta's built-in test-inbox app (`WA DevX Webhook Events 1P App`), not to our app.

## Check
Open **developers.facebook.com/tools/explorer/<APP_ID>/**

- Meta App: your app
- User or Page: **Get User Access Token** (or *Generate Access Token*) with permissions `whatsapp_business_management` (+ `whatsapp_business_messaging`)
  - **Human step:** a Facebook popup asks for permission. Chrome may block it — allow popups for developers.facebook.com, click **Continue**, keep the WABA selected.

Request:
```
GET /v26.0/<WABA_ID>/subscribed_apps
```
Bad result (your app missing):
```json
{ "data": [ { "whatsapp_business_api_data": { "name": "WA DevX Webhook Events 1P App", "id": "..." } } ] }
```

## Fix
```
POST /v26.0/<WABA_ID>/subscribed_apps
```
Expected:
```json
{ "success": true }
```
The app that owns the Explorer token is the one that gets subscribed.

## Verify
1. `GET` again — your app is listed.
2. Make sure the n8n trigger is listening (or the workflow is published).
3. Send a WhatsApp message from a recipient phone to the business number.
4. n8n output contains the real sender:
```json
"metadata": { "display_phone_number": "<BUSINESS_NUMBER>", "phone_number_id": "<PHONE_NUMBER_ID>" },
"contacts": [ { "profile": { "name": "<SENDER_NAME>" }, "wa_id": "<SENDER_NUMBER>" } ],
"messages": [ { "from": "<SENDER_NUMBER>", "type": "text", "text": { "body": "hi" } } ]
```

## Warning: two apps, one WABA
Every subscribed app receives every message. If two apps are subscribed **and** both have live n8n triggers, each message is answered twice. To remove an app:
```
DELETE /v26.0/<WABA_ID>/subscribed_apps      (using a token for the app to remove)
```
Ask the human before running DELETE.
