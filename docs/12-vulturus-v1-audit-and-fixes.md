# 12 — Vulturus v1: audit and fixes (2026-11-08)

Vulturus is the real-estate WhatsApp bot built on top of this playbook (Pune home buyers: search → book a site visit; brokers add listings through a Google Form). This file records what was wrong with the first version (**v1**, one n8n workflow, 54 nodes) and how each problem was fixed.

> The fixed v1 is kept as a draft: [`workflows/vulturus/vulturus-v1-fixed-draft.json`](../workflows/vulturus/vulturus-v1-fixed-draft.json). It was replaced in production by v2 — see [`13`](13-vulturus-v2-fast-architecture.md).

## v1 design (for reference)

```
WhatsApp Trigger → Is User Message? → Config → Extract Message → Is Text?
  → Get Session (Google Sheet) → Merge Session State
  → AI #1 "Intent & Extraction" (Gemini) → Merge Extraction → Switch on intent
      search : Get All Properties (Sheet) → Filter & Rank → context
      booking: Get Selected Property → Check Booking Fields → Calendar check → create event → Leads sheet → notify broker
      chat   : context
  → AI #2 "Write reply" → AI #3 "Guardrail" → Compose → Save Session (Sheet) → Send Reply → photo
Broker flow: Form responses sheet (poll) → Normalize → make Drive photo public → append Properties → WhatsApp broker
```

## Bugs found and how they were fixed

| # | Severity | Problem | Fix |
|---|---|---|---|
| 1 | 🔴 | **Session never really saved.** `Save Session` mapped every column from `Merge Extraction` (the state *before* the reply), so `shown_properties`, `history` and `booking_status` were never written. "Book number 2" could never work. | Map all columns from `$('Compose Outgoing').first().json` (the updated state). |
| 2 | 🔴 | `Context: Booking Info Needed` was an **empty Set node** — the reply AI got no context when date/time were missing. | Set `context_type=booking_incomplete`, `context_data={{ $json.context_text }}`, `session_patch_json`. |
| 3 | 🔴 | `Send Fallback Reply` used `$('Extract Message').json.phone` — field is `phone_number`. Error replies went nowhere. | Use `phone_number`. |
| 4 | 🔴 | `Extract Message` built JSON by string-templating the user's text → quotes / new lines / voice notes crashed the run. | Switch to field (assignment) mode with `?.` optional chaining. |
| 5 | 🔴 | Search for "Pune" matched only listings whose locality was literally "pune"; exact matching broke "Baner Road" vs "Baner", "Hinjawadi" vs "Hinjewadi". | City-wide words = no locality filter; alias + "phase N" normalisation; word-contains matching. |
| 6 | 🔴 | A second, unconnected `WhatsApp Trigger1` node in an active workflow (one trigger per Meta app — it can steal the webhook). | Deleted. |
| 7 | 🔴 | `Is User Message?` **false** branch was wired back into the flow. | Disconnected. |
| 8 | 🟠 | `Save Session` ran **before** `Send Reply` — a Google Sheets glitch (seen: `getaddrinfo EAI_AGAIN sheets.googleapis.com`) meant no reply. | Send first, then save (`onError: continue`). |
| 9 | 🟠 | Calendar events had no title/description/location. | Added summary, description (customer + broker), location. |
| 10 | 🟠 | After a confirmed booking the date/time stayed in the session (wrong ISO format) → stale re-bookings. | Clear `meeting_date`/`meeting_time` on confirm. |
| 11 | 🟠 | "furnished" matched "**un**furnished" (substring match). | Canonical furnishing / property-type mapping. |
| 12 | 🟠 | New listing IDs were 9 chars but the ID regex expected exactly 6 (`\bVUL-[A-Z0-9]{6}\b`). | Regex `{4,12}`. |
| 13 | 🟠 | Broker flow: empty forms still appended (skip flag ignored); duplicate rows when several form rows arrived in one poll. | Run-once-for-all normaliser drops empty forms; `Build Property Row` uses `$input`; photo-sharing branch runs in parallel. |
| 14 | 🟠 | No duplicate protection — Meta can deliver the same webhook twice → double replies. | Store `last_message_id`; skip if equal. |
| 15 | 🟡 | WhatsApp bold written as `**text**` (WhatsApp uses `*text*`). | Fixed. |
| 16 | 🟡 | Sticky notes described a geocoding step that didn't exist. | Notes rewritten. |

Other changes in the fixed v1: Gemini → **OpenAI** (`gpt-5-mini`, later `gpt-4.1-mini`), AI nodes renamed (`Understand Message (AI)`, `Write Reply (AI)`), search shows **closest matches** (±1 BHK, ≤15 % over budget) with what differs, and **nearby areas** for 10 Pune localities when the customer agrees.

## Data problems found (not fixed in code)

- Properties sheet: 130 rows, mostly test data — titles like `apple`, `a`; 3 BHK at ₹30,000; **57 duplicate listing IDs**; 45 rows with no locality. Code now hides titles < 3 chars and dedupes by `listing_id`, but **clean the sheet before real customers use the bot**.
- The Properties sheet mixes two column layouts (`Property id/Area/Price…` and `listing_id/locality/price_inr…`). The sync code reads both.

## Why v1 was still too slow

Measured per message: **10–18 s** — 3 AI calls in a row (understand → write → guardrail, ~7–11 s), Google Sheets as a database (~1 s per read/write), n8n Cloud code-node start-up (~1.7 s). That is what v2 fixes.
