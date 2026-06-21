# Debug Session: photo-upload-stuck-at-35

- Status: [OPEN]
- Symptom: загрузка фото зависает на 35%
- Created: 2026-06-21
- Notes:
  - Step 1: collect runtime evidence only
  - Step 2: no business-logic changes until hypotheses are validated

## Hypotheses
1. Upload request reaches the server, but polling for job status stops updating after 35%.
2. The client receives a 401/402 during upload or polling and silently retries/blocks.
3. Progress calculation is wrong and caps at 35% because a chunk or stage weight is miscomputed.
4. The photo upload endpoint returns an error or stalls, but the UI does not surface it.
5. A network or payload-size issue causes the browser fetch/XHR request to hang mid-upload.

## Evidence to collect
- Upload start/end timestamps
- HTTP status codes for upload and polling requests
- Progress events around 35%
- Any auth refresh or token-expiry events
- Response bodies / error shapes from the upload API
