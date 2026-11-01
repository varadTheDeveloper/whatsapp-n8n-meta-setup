# 07 — Auto-reply and publish

## Steps
1. In the workflow, click **+** after the WhatsApp Trigger → **WhatsApp Business Cloud → Send message**.
2. **Credential → Create new credential** (type **WhatsApp API**):
   - **Access Token** = permanent token from `03` (**human pastes**)
   - **Business Account ID** = `<WABA_ID>`
   - **Save** → green toast.
3. Node fields:
   - Resource: `Message`, Operation: `Send`
   - **Sender Phone Number**: pick from the dropdown (this loading proves the token works)
   - **Recipient's Phone Number**: switch to **Expression**, then
     ```
     {{ $json.messages[0].from }}
     ```
     The preview should show the sender's number.
   - MessageType: `Text`
   - Text Body: e.g. `Hi! Thanks for your message. We got it and will get back to you shortly.`
4. **Execute step** to test → output has `messages[0].id` like `wamid.…` and the phone receives the reply.
5. **Publish** (top right) → give a version name → **Publish**. Status shows **Published**.

## Verify always-on
Send a new message from WhatsApp. Without touching n8n, a reply arrives within seconds, and a row appears in **Executions**.

## Notes
- Typing `{{ … }}` in a *Fixed* field doesn't evaluate. Clear it, click **Expression**, then type.
- Free-form text replies only work within **24 hours** of the user's last message. Outside that, send an approved template.
- **Execute step** on the send node uses the last trigger data and sends a real message.
- Importable version: [`../workflows/whatsapp-auto-reply.json`](../workflows/whatsapp-auto-reply.json).
