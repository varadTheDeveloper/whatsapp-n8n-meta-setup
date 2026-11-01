# 11 — Example: real-estate bot for brokers

The original goal of this setup: send new property listings to brokers and let AI answer their questions.

## Flow A — broker messages you (inbound, free within 24h)
```
WhatsApp Trigger → AI Agent (LLM) → tool: search property sheet/DB → Send message (photos, price, map link)
```
- Broker: "2BHK Baner under 80L?" → bot replies with matching listings.

## Flow B — you send new listings (outbound, paid templates)
```
Schedule (daily 10:00) or "new row in property sheet"
  → read properties + broker list (with area/budget preferences, opted-in only)
  → Filter / match
  → WhatsApp: Send template (image header + variables + URL button)
```
Template body example:
```
New listing: {{1}} in {{2}}, ₹{{3}}. {{4}} sq ft.
[View details] → https://example.com/p/{{5}}
```
- Prefer a **daily digest with one link** per broker over one message per property — cheaper and less spammy.
- When the broker replies, Flow A takes over for free.

## Minimal Node.js equivalent (without n8n)
```js
await fetch(`https://graph.facebook.com/v26.0/${PHONE_NUMBER_ID}/messages`, {
  method: "POST",
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    messaging_product: "whatsapp",
    to: broker.phone,
    type: "template",
    template: {
      name: "new_property_alert",
      language: { code: "en" },
      components: [
        { type: "header", parameters: [{ type: "image", image: { link: p.photoUrl } }] },
        { type: "body", parameters: [p.title, p.area, p.price, p.sqft].map(t => ({ type: "text", text: String(t) })) },
        { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: p.id }] }
      ]
    }
  })
});
```

## Policy note
Meta restricts **general-purpose** AI assistants on the WhatsApp Business API. A bot that serves your own business (property questions, bookings) is fine even if an LLM powers it.
