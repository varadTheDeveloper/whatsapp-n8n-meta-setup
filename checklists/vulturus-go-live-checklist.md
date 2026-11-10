# Vulturus go-live checklist (status as of 2026-11-11)

## Bot (n8n)
- [x] v1 audited and fixed (`docs/12`)
- [x] OpenAI credential created by owner; model `gpt-4.1-mini`
- [x] Data Tables `vulturus_properties` (67 rows imported) and `vulturus_sessions`
- [x] v2 bot built and tested in a safe copy (4/4)
- [x] v2 bot **published**; Listings & sync **published**; v1 unpublished
- [x] Live test from a real phone: search + booking confirmed, 2.9–5.3 s, typing indicator OK
- [x] Full private backup exported before trial end (2026-11-11)
- [ ] Decide hosting: n8n Cloud paid plan **or** self-host + restore (`docs/15`)
- [ ] Clean Properties sheet test data → *Run Full Import*

## Meta / WhatsApp
- [x] App `live` in Live mode, webhook configured, subscribed to the test-number WABA
- [x] Business portfolio verified
- [x] Real number added to an existing empty WABA via WhatsApp Manager (`docs/14`)
- [ ] Display name approved (was *In review*)
- [ ] System user `n8n-bot` → new WABA → Full control
- [ ] `POST /<WABA_ID_REAL>/subscribed_apps` (app `live`)
- [ ] `POST /<PHONE_NUMBER_ID_REAL>/register` with owner's 6-digit PIN
- [ ] Number status no longer *Unverified*; send a real test message to the new number; exactly one reply
- [ ] Payment method added
- [ ] Utility template for broker alerts approved; broker notify nodes switched to template (fixes 131047)
- [ ] Optional: brand page on website → rename display name to the brand
