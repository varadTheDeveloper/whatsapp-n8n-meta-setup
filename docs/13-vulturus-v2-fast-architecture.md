# 13 — Vulturus v2: the fast architecture (live since 2026-11-08)

Goal: cut reply time from **10–18 s** to **~3–5 s** while staying on n8n.

Files:
- Bot: [`workflows/vulturus/vulturus-v2-whatsapp-bot.json`](../workflows/vulturus/vulturus-v2-whatsapp-bot.json) (29 nodes)
- Listings & sync: [`workflows/vulturus/vulturus-v2-listings-sync.json`](../workflows/vulturus/vulturus-v2-listings-sync.json) (18 nodes)
- Code: [`workflows/vulturus/code/brain.js`](../workflows/vulturus/code/brain.js), AI prompt + schema: [`code/ai-understand-prompt.md`](../workflows/vulturus/code/ai-understand-prompt.md)

All IDs in the exports are placeholders (`<PROPERTIES_DATA_TABLE_ID>`, `<CREDENTIAL_ID>`, …). After import, re-select credentials and Data Tables on each node.

## What changed vs v1 (and why it's faster)

| v1 | v2 | Saving |
|---|---|---|
| 3 AI calls (understand, write, guardrail) | **1 AI call** (`gpt-4.1-mini`): intent + fields; it also writes the reply **only** for general chat | ~5–8 s |
| Replies written by AI | Search / booking replies built by **code templates** in en / hi / mr / hinglish | ~2–6 s, and no invented prices |
| AI guardrail | **Code** checks on the chat reply (no phone numbers, no "confirmed/booked") | ~1–2.5 s |
| Google Sheets as DB | **n8n Data Tables** `vulturus_properties`, `vulturus_sessions` (~0.07 s) | ~1–3 s |
| Save before reply | **Reply first**, then save session / photo / lead / broker alert | customer doesn't wait |
| — | Instant **"typing…"** + read receipt via Graph API | feels instant |
| — | Duplicate webhook skip (`last_message_id`) | no double replies |

## Customer flow (bot workflow)

```
WhatsApp Trigger
 → Is Text? ──no──► Is Message? ──yes──► Send Unsupported ("text only please")
 │                          └─no (delivery receipts) → stop
 → Typing…  (HTTP POST /<PHONE_NUMBER_ID>/messages {status:"read", typing_indicator:{type:"text"}})
 → Get Session (Data Table, phone = sender)        alwaysOutputData
 → New Message? (last_message_id ≠ this id)
 → Understand Message (AI)  ── error ──► Send Fallback
 → Get Properties (Data Table, status = available, all rows)
 → Brain (code)            ── error ──► Send Fallback
 → Check Slot? ──no──────────────────────────────────────────────┐
     └yes→ Check Calendar → Slot Free? ─yes→ Create Calendar Event → Use Confirmed ─┤
                                      └no──→ Use Taken ──────────────────────────────┤
 → Outgoing (NoOp merge point) ◄─────────────────────────────────────────────────────┘
 → Send Reply  ← customer gets the answer here
 → Session Row → Save Session (Data Table upsert by phone)
 → Has Image? → Send Image
 → Confirmed? → Save Lead (Leads sheet) → Notify Broker
```

### Brain (code node) — what it decides
- Loads the session, applies the AI's fields (budget/BHK/area/type/furnishing/nearby-ok/date/time/name/language), maps "number 2" → listing ID from the last shown list (a typed `VUL-…` ID wins).
- **Search:** filter available listings → exact → nearby (if accepted, 10 Pune areas mapped) → closest (±1 BHK, ≤15 % budget, any furnishing, shows what differs) → template reply, max 3 listings, first photo.
- **Booking:** missing property / date / time / name → ask; past time / outside 10 AM–7 PM → ask again; complete → calendar check → confirmed or slot-taken template.
- **Chat:** uses the AI's reply after the code safety check; otherwise the "tell me budget, BHK, area" template.
- Keeps the last 3 chat turns in the session.

### The single AI call
`gpt-4.1-mini`, temperature 0.2, structured output (16 fields: `intent, lang, budget_min, budget_max, bhk, locality, property_type, furnishing, locality_flexible, reset, pick, listing_id, meeting_date, meeting_time, name, reply`). Full prompt in [`code/ai-understand-prompt.md`](../workflows/vulturus/code/ai-understand-prompt.md).

## Listings & sync workflow (separate on purpose)

| Row | Trigger | Does |
|---|---|---|
| Broker form | Google Form responses sheet (poll 1 min) | normalise → append to Properties sheet → **upsert Data Table** → WhatsApp broker "listing live"; first Drive photo made public in parallel |
| Sheet edits | Properties sheet **anyUpdate** (poll 1 min) | clean changed rows → upsert Data Table (so "Sold" in the sheet reaches the bot in ~1 min) |
| Full import | Manual | read whole sheet → dedupe → upsert all |

Why two workflows: a broken Google permission in the listings part can't stop customer replies; separate execution history; you can pause listings while cleaning data.

Data flow: **Sheet = master list humans edit → Data Table = bot's fast copy.** The bot only *reads* `vulturus_properties`; only Listings & sync *writes* it. `vulturus_sessions` is bot-only.

## Measured speed

Test copy (sends off, Gemini/OpenAI, 2026-11-08): search **3.8 s**, full booking **4.0 s**, Hindi chat **3.7 s**, duplicate **0.07 s**.

Live, real phone (2026-11-08, 10 runs):

| Step | Time |
|---|---|
| Typing indicator | 0.5–0.8 s |
| AI | 1.4–2.5 s |
| Brain code | 0.015 s warm / ~1.8 s cold start |
| Send reply | ~0.7 s |
| **Whole run** | **2.9–5.3 s** (median ~5 s incl. post-reply steps; one booking 9.4 s incl. calendar + lead + broker *after* the reply) |

What's left in the time: the AI (~1.7 s) and n8n Cloud's code-node cold start (~1.7 s). Going lower needs a dedicated Node.js service (Fastify + Postgres + Redis + queue) — "option B", not built.

## Observed in production
- **Delivery receipts cost executions.** 40 of the first 50 runs were `statuses` webhooks (sent / delivered / read). They stop at `Is Message?` in ~0.1 s but **count against n8n Cloud execution limits** (~4 extra runs per message). Self-hosting removes the limit.
- **Broker alert failed with 131047** ("more than 24 hours since the customer last replied") — free-form messages to brokers only work inside the 24 h window. **Needs an approved template** (`docs/10`).

## How to test v2 safely (no real sends, no webhook hijack)
1. Duplicate the bot; **disable** `Typing…`, all WhatsApp send nodes, `Create Calendar Event`, `Save Lead`.
2. **Pin** a sample WhatsApp payload on the trigger (save the workflow with `pinData`).
3. Press **Execute workflow** in the editor. Pinned data is used — nothing listens to Meta.
4. Use a fake sender (e.g. `9199999000xx`); delete its session row afterwards.

⚠️ Never start a manual/API run of a WhatsApp-trigger workflow **without saved pin data** — n8n starts "listening" and (re)subscribes the Meta app webhook to the *test* URL, which can unhook the live bot (see troubleshooting #14).
