# [OPEN] Yandex live login debugging session

Session ID: yandex-live-login
Date: 2026-06-10

## Symptom
- User reports that Yandex ID sign-in appears on the live site but does not allow login.
- Exact final error is not yet confirmed in this session.

## Expected behavior
- Clicking "Войти через Яндекс ID" redirects to Yandex, returns through Supabase, and creates an authenticated Supabase session on the site.

## Hypotheses
1. Supabase custom provider still uses the direct Yandex UserInfo URL instead of the deployed `/api/auth/yandex-userinfo` proxy, so the `id -> sub` mapping is not applied.
2. The deployed Vercel build has not completed or is serving an older bundle/config.
3. Yandex OAuth app callback/redirect settings do not match the current Supabase callback URL.
4. Supabase URL Configuration does not include the production redirect URL used by the live site.
5. The callback succeeds but the frontend fails to persist/read the session after returning to the site.

## Investigation log
- Opened after user reported: "я пытаюсь зайти с яндлекс и он не пускает".
- Next step: collect the exact live-site error and runtime evidence before changing business logic.

## Status
[OPEN]
