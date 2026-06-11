[OPEN] Yandex ID auth debugging session

Session ID: yandex-email-auth
Date: 2026-06-10

Symptom
- OAuth flow starts from the local app and reaches Yandex successfully.
- After approving access in Yandex, the app returns with:
  `error=server_error`
  `error_code=unexpected_failure`
  `error_description=Error getting user email from external provider`

Expected
- User returns to the app with an authenticated Supabase session.

Known Evidence
- Local app redirects to `https://oauth.yandex.ru/authorize`.
- Yandex app requests `login:email login:info`.
- Supabase custom provider `Yandex ID` exists and is enabled.
- Reproduced once end-to-end in browser.

Hypotheses
1. Supabase cannot extract email from Yandex `userinfo` response because the provider mapping expects a different response shape.
2. Supabase falls back to the project `Site URL` on callback errors, which is why the user lands on the Vercel domain instead of local `redirect_to`.
3. The Yandex provider configuration in Supabase is partially inconsistent (`issuer`/`jwks_uri`/manual mode), causing Supabase to treat the provider incorrectly during identity parsing.
4. Yandex does not return `default_email`/`emails` for this account/app combination even though the `login:email` scope is requested.
5. The local app path is not the root cause; the failure happens entirely inside Supabase's external provider callback handling before session creation.

Investigation Log
- 2026-06-10: Reproduced from local `http://localhost:3000/studio`.
- 2026-06-10: Confirmed redirect to Yandex with `client_id`, `scope`, and Supabase callback.
- 2026-06-10: Confirmed callback error contains `Error getting user email from external provider`.
- 2026-06-10: Enabled `Allow users without email` in the Supabase provider and saved the provider again.

Next Steps
- Inspect Supabase redirect configuration (`Site URL` and allowed redirects).
- Reproduce once more after the provider change.
- If the same error persists, collect more evidence from app-side auth state and callback URL handling before changing business logic.
