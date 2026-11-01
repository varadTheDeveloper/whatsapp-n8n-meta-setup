# Setup checklist

Legend: 👤 = human-only step

## Meta app
- [ ] App created (type Business), linked to business portfolio
- [ ] WhatsApp product added
- [ ] Test number visible; `PHONE_NUMBER_ID` and `WABA_ID` noted
- [ ] 👤 Own phone added as recipient (OTP)
- [ ] `APP_ID` noted

## Permanent token
- [ ] System user `n8n-bot` (Admin) created
- [ ] App assigned (Manage app) + WABA assigned (Full control)
- [ ] Token generated: Never expire, `whatsapp_business_messaging` + `whatsapp_business_management`
- [ ] 👤 Token copied to a password manager

## n8n receive
- [ ] n8n on public HTTPS
- [ ] Workflow with WhatsApp Trigger → On messages
- [ ] 👤 App Secret pasted; WhatsApp OAuth credential **saved** (verified in dropdown)
- [ ] Meta Webhooks → WhatsApp Business Account → `messages` = Subscribed
- [ ] Meta "Test" → Send to server → sample appears in n8n

## Go live
- [ ] Privacy URL, terms URL, data-deletion URL, category saved
- [ ] App Mode = Live (confirmed in Alerts)

## Graph API link
- [ ] 👤 Explorer token approved in popup
- [ ] `GET /<WABA_ID>/subscribed_apps` checked
- [ ] `POST /<WABA_ID>/subscribed_apps` → `success: true`
- [ ] Real message from phone appears in n8n with real sender name

## Reply
- [ ] 👤 Token pasted; WhatsApp API credential **saved**
- [ ] Sender number loads in dropdown
- [ ] Recipient = Expression `{{ $json.messages[0].from }}`
- [ ] Execute step → `wamid…` and reply on phone
- [ ] Workflow **Published**
- [ ] New message → auto-reply without touching n8n; row in Executions

## Production (later)
- [ ] 👤 Real number added (OTP), display name approved
- [ ] 👤 Payment method
- [ ] 👤 Business verification
- [ ] Templates approved
- [ ] n8n hosting beyond trial
