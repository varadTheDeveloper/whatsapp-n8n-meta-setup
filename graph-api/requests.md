# Graph API requests used

Base: `https://graph.facebook.com/v26.0` — run them in the Graph API Explorer (`developers.facebook.com/tools/explorer/<APP_ID>/`) or with curl.

## Which apps receive this WABA's webhooks?
```bash
curl -s "https://graph.facebook.com/v26.0/<WABA_ID>/subscribed_apps" \
  -H "Authorization: Bearer <TOKEN_FOR_YOUR_APP>"
```

## Subscribe your app to the WABA (the key fix)
```bash
curl -s -X POST "https://graph.facebook.com/v26.0/<WABA_ID>/subscribed_apps" \
  -H "Authorization: Bearer <TOKEN_FOR_YOUR_APP>"
# → {"success": true}
```

## Unsubscribe an app (ask the human first)
```bash
curl -s -X DELETE "https://graph.facebook.com/v26.0/<WABA_ID>/subscribed_apps" \
  -H "Authorization: Bearer <TOKEN_FOR_APP_TO_REMOVE>"
```

## List phone numbers in the WABA
```bash
curl -s "https://graph.facebook.com/v26.0/<WABA_ID>/phone_numbers" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## Send a text (inside 24h window)
```bash
curl -s -X POST "https://graph.facebook.com/v26.0/<PHONE_NUMBER_ID>/messages" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" -H "Content-Type: application/json" \
  -d '{"messaging_product":"whatsapp","to":"<RECIPIENT>","type":"text","text":{"body":"Hello"}}'
```

## Send the hello_world template
```bash
curl -s -X POST "https://graph.facebook.com/v26.0/<PHONE_NUMBER_ID>/messages" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" -H "Content-Type: application/json" \
  -d '{"messaging_product":"whatsapp","to":"<RECIPIENT>","type":"template","template":{"name":"hello_world","language":{"code":"en_US"}}}'
```

## Permissions needed
`whatsapp_business_management` (subscribe/list), `whatsapp_business_messaging` (send).
