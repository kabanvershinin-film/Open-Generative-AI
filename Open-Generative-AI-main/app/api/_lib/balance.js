// Supabase-backed user balance: identify the user from a request and
// atomically deduct / refund their ruble balance.
//
// Reuses the same Supabase project as creator-club (profiles.balance in RUB).
// Required env vars (add to Vercel — same values as creator-club):
//   SUPABASE_URL
//   SUPABASE_ANON_KEY            (publishable — to validate the user's JWT)
//   SUPABASE_SERVICE_ROLE_KEY    (secret — to update balance, bypasses RLS)
//
// If these are not set, billing is disabled and generations run free
// (so the app keeps working until auth + top-up are wired in the UI).

import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const BILLING_ENABLED = !!(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY);

let _anon = null, _admin = null;
function anon() {
    if (!_anon) _anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    return _anon;
}
function admin() {
    if (!_admin) _admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    return _admin;
}

// Extract the Supabase access token from a request.
// Sent by the frontend as the `x-sb-token` header or the `sb_access_token`
// cookie. We deliberately avoid the Authorization header — that one already
// carries the memefast API key — so the two never collide.
function getAccessToken(request) {
    const hdr = request.headers.get('x-sb-token');
    if (hdr) return hdr.trim();
    const m = request.headers.get('cookie')?.match(/sb_access_token=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
}

// Resolve the authenticated user, or null if not logged in / billing off.
async function getUser(request) {
    if (!BILLING_ENABLED) return null;
    const token = getAccessToken(request);
    if (!token) return null;
    try {
        const { data, error } = await anon().auth.getUser(token);
        if (error || !data?.user) return null;
        return data.user;
    } catch { return null; }
}

// Identify the user using only the public anon key — no service-role key
// needed. Works even when BILLING_ENABLED is false (service role key absent).
// Use this for gallery saves so they work independently of the billing setup.
const AUTH_ENABLED = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
async function getUserForGallery(request) {
    if (!AUTH_ENABLED) return null;
    const token = getAccessToken(request);
    if (!token) return null;
    try {
        const { data, error } = await anon().auth.getUser(token);
        if (error || !data?.user) return null;
        return data.user;
    } catch { return null; }
}

// ── Admin helpers ─────────────────────────────────────────────────────────────
const ADMIN_EMAILS = ['kaban.vershinin@gmail.com', 'didig.vershinin@yandex.ru'];
function isAdminUser(user) {
    return !!(user?.email && ADMIN_EMAILS.some(e => e.toLowerCase() === user.email.toLowerCase()));
}
// Resolve user ids → emails (admin/service-role read of profiles). Returns {} on
// any failure or when billing/service-role isn't configured.
async function getEmailsForIds(ids) {
    const out = {};
    if (!BILLING_ENABLED || !Array.isArray(ids) || !ids.length) return out;
    try {
        const { data } = await admin().from('profiles').select('id, email').in('id', ids);
        (data || []).forEach(p => { if (p?.id) out[p.id] = p.email || null; });
    } catch { /* best-effort */ }
    return out;
}

// Best-effort transaction log so the user can see their spending history in the
// cabinet. Spends are stored as a negative amount, credits/refunds as positive
// (matching the admin top-up rows, which insert a positive amount). Never throws
// and never blocks the charge — a failed log must not fail a generation.
function logTxn(userId, amount, reason, meta) {
    if (!BILLING_ENABLED || !userId) return;
    try {
        admin().from('balance_transactions')
            .insert({ user_id: userId, amount: round2(amount), reason: reason || null, meta: meta || null })
            .then(() => {}, () => {});
    } catch { /* best-effort */ }
}

// Atomic compare-and-swap deduction. Returns:
//   { ok: true, balance }                — charged successfully
//   { ok: false, reason: 'insufficient', balance, required }
//   { ok: false, reason: 'error' | 'race', ... }
async function deduct(userId, amount, reason = 'Генерация', meta = null) {
    if (amount <= 0) return { ok: true, balance: null };
    const db = admin();
    for (let attempt = 0; attempt < 4; attempt++) {
        const { data: profile, error: selErr } = await db
            .from('profiles').select('balance').eq('id', userId).single();
        if (selErr || !profile) return { ok: false, reason: 'error', error: selErr?.message };
        const balance = Number(profile.balance || 0);
        if (balance < amount) return { ok: false, reason: 'insufficient', balance, required: amount };

        const newBalance = round2(balance - amount);
        // CAS: only write if balance is still what we just read.
        const { data: updated, error: updErr } = await db
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', userId)
            .eq('balance', balance)
            .select();
        if (updErr) return { ok: false, reason: 'error', error: updErr.message };
        if (updated && updated.length) {
            logTxn(userId, -amount, reason, meta);
            return { ok: true, balance: newBalance };
        }
        // Someone changed the balance between read and write — retry.
    }
    return { ok: false, reason: 'race' };
}

// Best-effort refund (e.g. when generation fails after charging).
async function refund(userId, amount, reason = 'Возврат', meta = null) {
    if (!BILLING_ENABLED || amount <= 0) return;
    const db = admin();
    for (let attempt = 0; attempt < 4; attempt++) {
        const { data: profile, error } = await db
            .from('profiles').select('balance').eq('id', userId).single();
        if (error || !profile) return;
        const balance = Number(profile.balance || 0);
        const { data: updated, error: updErr } = await db
            .from('profiles')
            .update({ balance: round2(balance + amount) })
            .eq('id', userId)
            .eq('balance', balance)
            .select();
        if (updErr) return;
        if (updated && updated.length) { logTxn(userId, amount, reason, meta); return; }
    }
}

// Charge `amount` for a finished task EXACTLY ONCE — used for post-paid billing
// where the charge happens after the work completes (e.g. Seedance, billed on
// ARK's real token usage). Idempotent on taskId: a poll/resume that re-observes
// the same success won't double-charge, because we skip if a transaction already
// carries this taskId in its meta. Resolves the user from the request (cookie/JWT).
async function chargeForTask(request, taskId, amount, reason = 'Генерация', meta = {}) {
    if (!BILLING_ENABLED) return { ok: true, free: true };
    if (!(amount > 0)) return { ok: true };
    const user = await getUser(request);
    if (!user?.id) return { ok: false, reason: 'unauthorized' };
    if (taskId) {
        try {
            const { data } = await admin()
                .from('balance_transactions')
                .select('id').eq('user_id', user.id).eq('meta->>taskId', String(taskId)).limit(1);
            if (data && data.length) return { ok: true, already: true };
        } catch { /* check failed → fall through and charge (don't lose revenue) */ }
    }
    return deduct(user.id, amount, reason, { ...meta, taskId: String(taskId) });
}

// List a user's recent balance transactions (newest first). Returns [] when
// billing is off or on any error — never throws.
async function listTransactions(userId, limit = 50) {
    if (!BILLING_ENABLED || !userId) return [];
    try {
        const { data, error } = await admin()
            .from('balance_transactions')
            .select('id, amount, reason, meta, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) return [];
        return data || [];
    } catch { return []; }
}

function round2(n) { return Math.round(n * 100) / 100; }

// ── RPC-based charging (mirrors creator-club's spend_balance / refund_balance) ──
// These hit the SAME shared Supabase ledger as creator-club, so balance and the
// transaction history stay consistent across both apps. The RPCs resolve the
// user from auth.uid(), so we must call them with a client scoped to the user's
// JWT (not the service-role admin client).
function userClient(request) {
    if (!BILLING_ENABLED) return null;
    const token = getAccessToken(request);
    if (!token) return null;
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
    });
}

// Charge `amount` RUB via spend_balance. Returns the RPC result shape:
//   { ok: true, balance }
//   { ok: false, error: 'insufficient', balance, required }
//   { ok: false, error: 'unauthorized' | <message> }
async function spendBalance(request, amount, reason, meta = null) {
    if (!BILLING_ENABLED) return { ok: true, free: true };
    if (!(amount > 0)) return { ok: true, balance: null };
    const db = userClient(request);
    if (!db) return { ok: false, error: 'unauthorized' };
    try {
        const { data, error } = await db.rpc('spend_balance', {
            p_amount: round2(amount), p_reason: reason, p_meta: meta,
        });
        if (error) return { ok: false, error: error.message };
        return data || { ok: false, error: 'no_response' };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

// Best-effort refund via refund_balance (e.g. generation failed after charging).
async function refundBalanceRpc(request, amount, reason) {
    if (!BILLING_ENABLED || !(amount > 0)) return;
    const db = userClient(request);
    if (!db) return;
    try {
        await db.rpc('refund_balance', {
            p_amount: round2(amount), p_reason: 'refund_' + reason, p_meta: null,
        });
    } catch { /* best-effort */ }
}

// ── Signed bill token ────────────────────────────────────────────────────────
// Seedance uses a submit-then-poll flow split across two requests (and serverless
// instances). To refund on async failure we hand the client a tamper-proof token
// carrying the charged amount; the poll route verifies the HMAC before refunding,
// so a client can't inflate or forge a refund. Signed with the service-role key
// (server-only secret, always present when billing is on).
// `extra` carries additional signed fields (e.g. the token rate `r`) used to
// reconcile the pre-charge against actual usage when the task finishes.
function signBill(cost, extra = {}) {
    if (!BILLING_ENABLED || !(cost > 0)) return '';
    const payload = Buffer.from(JSON.stringify({ c: round2(cost), e: Date.now() + 3600_000, ...extra })).toString('base64url');
    const sig = createHmac('sha256', SUPABASE_SERVICE_ROLE_KEY).update(payload).digest('base64url');
    return `${payload}.${sig}`;
}

// Verify a bill token and return its full signed payload ({ c, e, ...extra }),
// or null if invalid/expired. Tamper-proof: the HMAC is checked first.
function verifyBillData(token) {
    if (!BILLING_ENABLED || !token || typeof token !== 'string') return null;
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
    const expect = createHmac('sha256', SUPABASE_SERVICE_ROLE_KEY).update(payload).digest('base64url');
    if (sig !== expect) return null;
    try {
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
        if (!data.e || Date.now() > data.e) return null;
        return data;
    } catch { return null; }
}

// Verify a bill token and return just the charged amount (0 if invalid/expired).
function verifyBill(token) {
    const d = verifyBillData(token);
    return d ? (Number(d.c) || 0) : 0;
}

// Read the authenticated user's current balance (in RUB). Returns null when
// billing is disabled or the user is not logged in.
async function getBalance(request) {
    const user = await getUser(request);
    if (!user) return null;
    try {
        const { data: profile, error } = await admin()
            .from('profiles').select('balance').eq('id', user.id).single();
        if (error || !profile) return null;
        return round2(Number(profile.balance || 0));
    } catch { return null; }
}

export {
    BILLING_ENABLED, getUser, getUserForGallery, getBalance, deduct, refund,
    listTransactions, spendBalance, refundBalanceRpc, signBill, verifyBill, verifyBillData,
    chargeForTask, isAdminUser, getEmailsForIds,
};
