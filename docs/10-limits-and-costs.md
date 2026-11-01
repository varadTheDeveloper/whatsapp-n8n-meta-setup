# 10 — Limits and costs

| Limit | Detail | How to lift |
|---|---|---|
| **Test number recipients** | Max **5** verified recipients; can't remove one once added (error `131030` for others) | Use a real number — no recipient limit |
| **24-hour window** | Free-form replies only within 24h of the user's last message | Outside it, send an **approved template** |
| **Business-initiated daily cap** | Unique customers you can *start* conversations with per moving 24h, shared by all numbers in the business portfolio. Starts low (~250) | Business verification, good quality rating, steady usage → Meta raises it automatically |
| **Throughput** | ~80 msg/s per number by default | Capacity upgrades |
| **Pair rate** | ~1 message every 6s to the same user | Space out messages |
| **n8n WhatsApp Trigger** | One per Meta app | Separate apps or generic Webhook node |

## Costs
- Replies to users inside the 24h window: free (service conversations).
- Templates you send first (marketing/utility): **paid per message**, priced per country. Needs a payment method.
- Check current pricing on Meta's WhatsApp pricing page — it changes.

## Templates
- Created in **WhatsApp Manager → Message templates**; approval usually minutes to hours.
- Use variables (`{{1}}`, `{{2}}`…), image header, URL button.
- Only message people who **opted in**. Blocks/reports lower your quality rating and can restrict the number.

## Hosting
- n8n Cloud trial is time-limited; after it ends the workflow stops unless you upgrade or self-host (Docker + domain + SSL).
