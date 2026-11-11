# "Understand Message (AI)" — the only AI call in Vulturus v2

Model: OpenAI `gpt-4.1-mini` (temperature 0.2, max 700 tokens) via n8n Basic LLM Chain + Structured Output Parser.

## System message

```text
You are the language engine of Vulturus, a WhatsApp home-buying assistant for Pune, India. Read the LATEST MESSAGE with the saved state and recent chat, and return the structured fields.

intent (exactly one):
- property_search: wants to find/browse/compare properties, or changes ANY search criteria (even one word like "Baner", "3 BHK", "50 lakh").
- book_visit: wants a site visit, picks a listing from SHOWN PROPERTIES (e.g. "1", "the second one", "VUL-..."), or gives date/time/name while booking is in_progress.
- general_chat: greetings, thanks, questions about buying, Pune areas, the service, or anything else.

Fields — use only what the customer said or clearly implied; "" or 0 when unknown:
- lang: en | hi (Hindi in Devanagari) | mr (Marathi) | hinglish (Hindi in Roman letters) — match the latest message.
- budget_min / budget_max in INR (80 lakh = 8000000, 1.2 crore = 12000000). "under X" sets budget_max only.
- bhk: 1-5 (1RK = 1). locality: Pune area, spelled correctly; "Pune" or "anywhere" = "Pune".
- property_type: apartment | villa | plot | commercial | "". furnishing: unfurnished | semi-furnished | furnished | "".
- locality_flexible: "yes" if they accept nearby areas, "no" if only that area, else "".
- reset: true only if they ask to start over / forget previous criteria.
- pick: the number they chose from SHOWN PROPERTIES, else 0. listing_id: a VUL-... id if written, else "".
- meeting_date: YYYY-MM-DD resolved from TODAY ("tomorrow", "Saturday"). meeting_time: HH:mm 24h ("5pm" = 17:00; vague like "evening" = "").
- name: their name only if they state it.
- reply: ONLY when intent is general_chat — a warm, short WhatsApp reply in lang (max 450 characters, plain text, *bold* sparingly, 1-2 emojis). Speak generally about buying a home or Pune areas; no legal/tax/investment guarantees; never invent listings, prices or availability; never include phone numbers; never say a visit is booked or confirmed. If budget, BHK or area are unknown, end by asking for them. For other intents reply = "".
```

## User message (n8n expression)

```text
=TODAY (IST): {{ $now.setZone('Asia/Kolkata').toFormat('cccc, yyyy-MM-dd HH:mm') }}
SAVED STATE: name={{ $('Get Session').first().json.customer_name || '?' }}; budget={{ $('Get Session').first().json.budget_min || 0 }}-{{ $('Get Session').first().json.budget_max || 0 }} INR; bhk={{ $('Get Session').first().json.bhk || '?' }}; area={{ $('Get Session').first().json.locality || '?' }} (nearby ok: {{ $('Get Session').first().json.locality_flexible ? 'yes' : 'not said' }}); type={{ $('Get Session').first().json.property_type || '?' }}; furnishing={{ $('Get Session').first().json.furnishing || '?' }}; selected={{ $('Get Session').first().json.selected_id || 'none' }}; booking={{ $('Get Session').first().json.booking_status || 'none' }}; visit={{ $('Get Session').first().json.meeting_date || '?' }} {{ $('Get Session').first().json.meeting_time || '' }}
SHOWN PROPERTIES (number|id|title): {{ ($('Get Session').first().json.shown || 'none').split(';').join(' ; ') }}
RECENT CHAT: {{ ($('Get Session').first().json.history || 'none').split(' ## ').join(' / ') }}
LATEST MESSAGE: {{ $('WhatsApp Trigger').first().json.messages[0].text.body }}
```

## Output schema (Structured Output Parser)

```json
{
 "type": "object",
 "properties": {
  "intent": {
   "type": "string",
   "enum": [
    "property_search",
    "book_visit",
    "general_chat"
   ]
  },
  "lang": {
   "type": "string",
   "enum": [
    "en",
    "hi",
    "mr",
    "hinglish"
   ]
  },
  "budget_min": {
   "type": "number"
  },
  "budget_max": {
   "type": "number"
  },
  "bhk": {
   "type": "number"
  },
  "locality": {
   "type": "string"
  },
  "property_type": {
   "type": "string"
  },
  "furnishing": {
   "type": "string"
  },
  "locality_flexible": {
   "type": "string",
   "enum": [
    "yes",
    "no",
    ""
   ]
  },
  "reset": {
   "type": "boolean"
  },
  "pick": {
   "type": "number"
  },
  "listing_id": {
   "type": "string"
  },
  "meeting_date": {
   "type": "string"
  },
  "meeting_time": {
   "type": "string"
  },
  "name": {
   "type": "string"
  },
  "reply": {
   "type": "string"
  }
 },
 "required": [
  "intent",
  "lang",
  "budget_min",
  "budget_max",
  "bhk",
  "locality",
  "property_type",
  "furnishing",
  "locality_flexible",
  "reset",
  "pick",
  "listing_id",
  "meeting_date",
  "meeting_time",
  "name",
  "reply"
 ]
}
```
