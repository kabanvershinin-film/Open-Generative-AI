[OPEN] Yandex login failure debugging session

Session ID: yandex-login-failure
Date: 2026-06-10
Status: IN_PROGRESS

---

## 1. Problem Description

### Symptom
- User tries to log in with Yandex ID on production site (Vercel)
- Login fails with unspecified error
- "не пускает"

### Expected
- Successful OAuth flow: redirect to Yandex → approve → redirect back → session created → login complete

### Environment
- Production: https://open-generative-ai-sand.vercel.app
- Supabase project: hsyuvhvjrjxdpvuzivvv
- Yandex custom provider: custom:yandex

---

## 2. Hypotheses

1. **Hypothesis A**: Supabase Yandex custom provider still uses direct `https://login.yandex.ru/info` instead of our proxy `/api/auth/yandex-userinfo`, causing `missing provider id` error.
2. **Hypothesis B**: Vercel deploy hasn't picked up the latest commits with Yandex proxy and auth logic.
3. **Hypothesis C**: Redirect URL configuration in Supabase doesn't include production Vercel URL correctly.
4. **Hypothesis D**: Our `yandex-userinfo` proxy endpoint is broken/returning 500 on production.
5. **Hypothesis E**: Profile creation trigger is failing for Yandex users without email or with non-standard fields.

---

## 3. Investigation Log

- [x] Step 1: Check git status - origin/main now includes da21af5 (Yandex auth enabled by default)
- [x] Step 2: Confirm yandex-userinfo proxy route exists
- [x] Step 3: Update Supabase custom provider Userinfo URL to proxy and fix Issuer URL
- [x] Step 4: Push commits to origin/main (local refs synced to da21af5)
- [ ] Step 5: Check Vercel deploy status
- [ ] Step 6: Test login flow

---

## 4. Fix Log

- TBD

---

## 5. Verification Log

- TBD
