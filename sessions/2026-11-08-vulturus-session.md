# Session log — Vulturus (2026-11-08 → 2026-11-11)

Agent: Claude, working in the owner's Chrome (n8n Cloud, Google Sheets, Meta for Developers, WhatsApp Manager). Read this first if you are picking the project up.

## Current state (2026-11-11)

| Thing | State |
|---|---|
| **Vulturus v2 – WhatsApp bot (fast)** | **ON** — live, tested by owner from his phone (search → booking confirmed) |
| **Vulturus v2 – Listings & sync** | **ON** |
| Vulturus – WhatsApp Real Estate Agent (Pune) (v1, fixed draft) | OFF — backup; contains all v1 fixes + OpenAI |
| BACKUP 2026-11-08 – Vulturus (before OpenAI swap) | OFF — original v1 |
| TEST HARNESS – Vulturus / TEST – Vulturus v2 | OFF — safe test copies (sends disabled) |
| older "Vulturus – WhatsApp Real Estate Agent (Pune)" copy | OFF — pre-existing |
| Data Tables | `vulturus_properties` (67 rows), `vulturus_sessions` |
| Meta app `live` | Live; bot still answers on the **test number**; real number added but not yet connected (see `docs/14`) |
| n8n plan | **Trial — ends ~2026-11-12**. Private full backup made 2026-11-11 (kept outside the repo) |

## Open items (in priority order)
1. **n8n trial ends** → upgrade, or self-host and restore (`docs/15`).
2. **Real number** → system user access to new WABA, `subscribed_apps`, `register` with PIN, display-name approval (`docs/14`).
3. **Broker alerts fail outside 24 h (131047)** → create + approve a utility template, switch `Notify Broker` / `Notify Broker (Listing Live)` to template sends; add payment method.
4. **Clean the Properties sheet** (test rows `apple`, `a`, ₹30,000 flats, 57 duplicate IDs), then *Run Full Import*.
5. Delivery receipts use ~4 executions per message on n8n Cloud — fine when self-hosted; otherwise look for a trigger option to drop statuses.
6. Brand display name: add a Vulturus page to the verified website, then rename the WhatsApp display name.

## Timeline
1. **Audit of v1** (54 nodes) — 16 bugs found → `docs/12`. Biggest: session never saved; empty booking-context node; fallback sent to wrong field; JSON built by string templating; "Pune" matched nothing.
2. **Backup** workflow created before any change (`BACKUP 2026-11-08 …`).
3. **Gemini → OpenAI** swap in v1 (draft; live version untouched until publish). OpenAI credential added by the owner (agent never types keys).
4. **All v1 fixes** applied as draft; Sessions sheet got 2 new columns (`locality_flexible`, `last_message_id`).
5. **Safe test harness** (copy with sends off + pinned trigger data) → 4/4 tests passed (search, booking via "number 1", duplicate skipped, Hinglish booking-incomplete).
6. Measured v1 speed: **10–18 s**/message → designed **v2** (`docs/13`).
7. Built **Data Tables** + **Listings & sync** workflow + **v2 bot**; Brain code tested offline (13 cases) then in n8n (4/4: 3.8 s / 4.0 s / 3.7 s / 0.07 s).
8. ⚠️ **Incident:** an API run (`POST /rest/workflows/<id>/run`) without saved pin data made the test copy *listen for a real webhook* → risk of stealing the Meta webhook from the live bot. Stopped via `DELETE /rest/test-webhook/<id>`; owner confirmed live bot still answered. Rule added to `AGENTS.md`.
9. **Go-live:** v1 deactivated → v2 bot + Listings & sync activated. Owner tested from his phone: **2.9–5.3 s** per message, typing indicator works.
10. **Real number:** dashboard flow blocked (8 existing WABAs) → added via WhatsApp Manager to an existing empty WABA; display name = owner's name (in review); category Professional services (`docs/14`).
11. **Backup before trial end** (2026-11-11): all workflows + Data Tables exported; sanitized copies committed here.

## Where things are in this repo
| Path | What |
|---|---|
| `docs/12-vulturus-v1-audit-and-fixes.md` | v1 problems + fixes |
| `docs/13-vulturus-v2-fast-architecture.md` | v2 design, flow, speed, safe testing |
| `docs/14-real-number-onboarding-2026-11.md` | real-number attempt + remaining steps |
| `docs/15-backup-hosting-and-costs.md` | backup/restore, hosting, costs |
| `workflows/vulturus/*.json` | sanitized importable workflows (v2 bot, v2 listings & sync, v1 fixed) |
| `workflows/vulturus/code/` | Brain code, AI prompt + schema, listings code, v1 search code |
| `checklists/vulturus-go-live-checklist.md` | what's done / what's left |

## Useful n8n REST calls (from a logged-in n8n tab, header `browser-id` = `localStorage['n8n-browserId']`)
| Call | Use |
|---|---|
| `GET /rest/workflows`, `GET /rest/workflows/<id>` | list / read (n8n 2.x: `versionId` = draft, `activeVersionId` = published) |
| `PATCH /rest/workflows/<id>` with `versionId` | save a **draft** (live version unchanged) |
| `POST /rest/workflows` | create (e.g. backups, test copies) |
| `POST /rest/workflows/<id>/activate` `{versionId}` / `/deactivate` | publish / unpublish — **production change, needs the owner's explicit OK** |
| `POST /rest/workflows/<id>/run` `{workflowData, triggerToStartFrom}` | manual run — **only on workflows with no live trigger risk**; with a WhatsApp trigger it listens to Meta unless pin data is saved |
| `DELETE /rest/test-webhook/<id>` | stop a "listening" test run |
| `GET /rest/executions?filter={"workflowId":"<id>"}`, `GET /rest/executions/<id>` | runs; `data` is in *flatted* format |
| `GET/POST /rest/projects/<pid>/data-tables`, `…/<tid>/rows`, `DELETE …/rows?filter=…` | Data Tables |
| `POST /rest/dynamic-node-parameters/resource-locator-results` | e.g. list OpenAI models = tests a credential |
| `GET /types/nodes.json`, `/types/credentials.json` | node / credential schemas |


## Update 2026-11-11 – moved to PikaPods

- The live bot and sync now run on a **self-hosted n8n on PikaPods**. The n8n Cloud copies are deactivated (trial ended 11 Nov).
- Credentials on the pod: OpenAI, WhatsApp send (new system-user token, never expires), WhatsApp trigger (App secret), and 4 Google OAuth2 credentials made with an own Google Cloud OAuth client (consent screen in production).
- Verified: test copy with sends off (correct reply), Google read check, then a real "Hi" from a phone → reply sent in about 6 s.
- Full steps and gotchas: [`docs/16-pikapods-migration-2026-11-11.md`](../docs/16-pikapods-migration-2026-11-11.md).
- Open: real number onboarding, broker template + payment method, delete the 2 inactive TEST workflows on the pod.
