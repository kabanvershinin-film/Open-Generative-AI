'use client';
// JWT-based auth client — drop-in replacement for the Supabase browser client.
// Uses /api/auth/* routes + localStorage for session persistence.

const TOKEN_KEY = 'app_access_token';

function getStoredToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
}
function storeToken(t) {
    try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch {}
}

let _session = null;
const _listeners = new Set();

function emit(event, session) { _listeners.forEach(cb => cb(event, session)); }

function buildSession(token, user) {
    return { access_token: token, user: { id: user.id, email: user.email, email_confirmed_at: new Date().toISOString(), user_metadata: { full_name: user.full_name } } };
}

// Profiles proxy — calls /api/auth/me instead of Supabase DB
function profilesProxy(userId) {
    return {
        select: () => ({
            eq: (col, val) => ({
                single: async () => {
                    const token = getStoredToken();
                    if (!token) return { data: null };
                    const r = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
                    if (!r.ok) return { data: null };
                    const d = await r.json();
                    const u = d.user;
                    return { data: { id: u.id, email: u.email, full_name: u.full_name, balance: u.balance || 0 } };
                },
            }),
        }),
        insert: async (data) => {
            // Profile is auto-created on register — no-op here
            return { data: null, error: null };
        },
        update: (patch) => ({
            eq: (col, val) => ({
                select: () => ({
                    single: async () => {
                        const token = getStoredToken();
                        if (!token) return { data: null };
                        const r = await fetch('/api/auth/me', {
                            method: 'PATCH',
                            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify(patch),
                        });
                        const d = await r.json();
                        return { data: d.user || null };
                    },
                }),
                // Also handle .update().eq() without .select().single()
                then: (resolve) => resolve({ data: null, error: null }),
            }),
        }),
    };
}

export const supabase = {
    auth: {
        getSession: () => Promise.resolve({ data: { session: _session }, error: null }),

        onAuthStateChange: (cb) => {
            _listeners.add(cb);
            // Fire immediately if already logged in
            if (_session) setTimeout(() => cb('SIGNED_IN', _session), 0);
            return { data: { subscription: { unsubscribe: () => _listeners.delete(cb) } } };
        },

        signInWithPassword: async ({ email, password }) => {
            const r = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const d = await r.json();
            if (!r.ok) return { data: null, error: { message: d.error || 'Ошибка входа' } };
            storeToken(d.token);
            _session = buildSession(d.token, d.user);
            emit('SIGNED_IN', _session);
            return { data: { user: _session.user, session: _session }, error: null };
        },

        signUp: async ({ email, password, options }) => {
            const r = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, full_name: options?.data?.full_name }),
            });
            const d = await r.json();
            if (!r.ok) return { data: null, error: { message: d.error || 'Ошибка регистрации' } };
            storeToken(d.token);
            _session = buildSession(d.token, d.user);
            emit('SIGNED_IN', _session);
            return { data: { user: _session.user, session: _session }, error: null };
        },

        signOut: async () => {
            storeToken(null);
            _session = null;
            emit('SIGNED_OUT', null);
            return { error: null };
        },

        signInWithOAuth: async () => ({ error: { message: 'OAuth не поддерживается в текущей конфигурации' } }),
        signInWithOtp: async () => ({ error: { message: 'SMS OTP не поддерживается в текущей конфигурации' } }),
        verifyOtp: async () => ({ data: null, error: { message: 'OTP не поддерживается' } }),
    },

    from: (table) => {
        if (table === 'profiles') return profilesProxy();
        // Fallback no-op for any other direct table access
        const noop = { data: null, error: null };
        return {
            select: () => ({ eq: () => ({ single: () => Promise.resolve(noop), then: (r) => r(noop) }) }),
            insert: () => Promise.resolve(noop),
            update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve(noop) }), then: (r) => r(noop) }) }),
            upsert: () => Promise.resolve(noop),
        };
    },
};

// Restore session from localStorage on page load
if (typeof window !== 'undefined') {
    const token = getStoredToken();
    if (token) {
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (d?.user) {
                    _session = buildSession(token, d.user);
                    emit('SIGNED_IN', _session);
                } else {
                    storeToken(null);
                }
            })
            .catch(() => storeToken(null));
    }
}
