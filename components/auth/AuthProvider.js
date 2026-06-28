'use client';
// Auth + balance context. Wraps the app, exposes the Supabase session and the
// user's ruble balance, and — crucially — publishes the access token to the
// generation backend so it can deduct the balance:
//   • sets the `sb_access_token` cookie (read server-side in app/api/_lib/balance.js)
//   • sets the axios default `x-sb-token` header
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import { reconcileStudioStorageOwner } from './storageIsolation';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
const YANDEX_PROVIDER = process.env.NEXT_PUBLIC_SUPABASE_YANDEX_PROVIDER || 'custom:yandex';
const YANDEX_AUTH_ENABLED = process.env.NEXT_PUBLIC_ENABLE_YANDEX_AUTH !== 'false';
const VK_PROVIDER = process.env.NEXT_PUBLIC_SUPABASE_VK_PROVIDER || 'vk';
const VK_AUTH_ENABLED = process.env.NEXT_PUBLIC_ENABLE_VK_AUTH !== 'false';

function normalizePhone(value) {
    const raw = String(value || '').trim();
    if (!raw) return null;

    const digits = raw.replace(/[^\d+]/g, '');
    if (digits.startsWith('+')) {
        const normalized = `+${digits.slice(1).replace(/\D/g, '')}`;
        return /^\+\d{10,15}$/.test(normalized) ? normalized : null;
    }

    const onlyDigits = digits.replace(/\D/g, '');
    if (/^8\d{10}$/.test(onlyDigits)) return `+7${onlyDigits.slice(1)}`;
    if (/^7\d{10}$/.test(onlyDigits)) return `+${onlyDigits}`;
    return /^\d{10,15}$/.test(onlyDigits) ? `+${onlyDigits}` : null;
}

function mapAuthError(error) {
    const message = error?.message || error || 'Не удалось выполнить вход';
    if (/Invalid login credentials/i.test(message)) return 'Неверный email или пароль';
    if (/Email not confirmed/i.test(message)) return 'Подтвердите email перед входом';
    if (/For security purposes, you can only request this after/i.test(message)) return 'Код уже отправлен. Подождите немного и попробуйте снова';
    if (/Token has expired or is invalid/i.test(message)) return 'Код недействителен или истёк';
    if (/Unsupported provider/i.test(message)) return 'Провайдер входа не настроен в Supabase';
    if (/Error sending phone/i.test(message)) return 'Не удалось отправить SMS-код. Проверьте настройки SMS в Supabase';
    return message;
}

function setTokenEverywhere(token) {
    if (token) {
        // 7-day cookie; backend reads it on each generation request
        document.cookie = `sb_access_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
        axios.defaults.headers.common['x-sb-token'] = token;
    } else {
        document.cookie = 'sb_access_token=; path=/; max-age=0; SameSite=Lax';
        delete axios.defaults.headers.common['x-sb-token'];
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loginOpen, setLoginOpen] = useState(false);
    const [cabinetOpen, setCabinetOpen] = useState(false);
    const [needFunds, setNeedFunds] = useState(null); // { required, balance } | null

    const notifyAdminAboutRegistration = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) return;

            await fetch('/api/admin/notifications/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch {
            // Best effort: registration itself should not fail if admin alerts fail.
        }
    }, []);

    const buildProfileSeed = useCallback((u) => ({
        id: u.id,
        email: u.email || null,
        phone: u.phone || u.user_metadata?.phone || null,
        full_name: u.user_metadata?.full_name || u.user_metadata?.name || null,
        balance: 0,
    }), []);

    const loadProfile = useCallback(async (u) => {
        if (!u) { setProfile(null); return; }
        const seed = buildProfileSeed(u);
        const { data } = await supabase.from('profiles').select('*').eq('id', u.id).single();
        if (data) {
            const patch = {};
            if (!data.email && seed.email) patch.email = seed.email;
            if (!data.phone && seed.phone) patch.phone = seed.phone;
            if (!data.full_name && seed.full_name) patch.full_name = seed.full_name;
            if (Object.keys(patch).length > 0) {
                const { data: updated } = await supabase
                    .from('profiles')
                    .update(patch)
                    .eq('id', u.id)
                    .select('*')
                    .single();
                setProfile(updated || { ...data, ...patch });
                return;
            }
            setProfile(data);
            return;
        }

        // First login — create the profile row even if the user only has a phone.
        await supabase.from('profiles').insert(seed);
        setProfile(seed);
        await notifyAdminAboutRegistration();
    }, [buildProfileSeed, notifyAdminAboutRegistration]);

    const refreshBalance = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setProfile(data);
    }, [user]);

    // Bootstrap session + subscribe to auth changes
    useEffect(() => {
        let sub;
        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            reconcileStudioStorageOwner(window.localStorage, session?.user?.id || '');
            setTokenEverywhere(session?.access_token || null);
            setUser(session?.user || null);
            await loadProfile(session?.user || null);
            setLoading(false);

            sub = supabase.auth.onAuthStateChange((_evt, session) => {
                reconcileStudioStorageOwner(window.localStorage, session?.user?.id || '');
                setTokenEverywhere(session?.access_token || null);
                setUser(session?.user || null);
                loadProfile(session?.user || null);
            }).data.subscription;
        })();
        return () => { sub?.unsubscribe?.(); };
    }, [loadProfile]);

    // Every logged-out visitor is greeted with the registration modal on each
    // visit (until they sign up). It stays dismissible so they can still look
    // around, but reappears on the next load while they remain unregistered.
    // NOTE: We don't force it on legal pages (/terms, /privacy, /offer) so users can read them.
    useEffect(() => {
        if (loading || user) return;
        const path = window.location.pathname;
        if (path === '/terms' || path === '/privacy' || path === '/offer') return;
        setLoginOpen(true);
    }, [loading, user]);

    // Open login modal when any generation route returns 401 — but only if
    // the user is not already authenticated (avoids spurious popups on token
    // refresh races or transient Memefast 401s for logged-in users).
    useEffect(() => {
        const handler = () => { if (!user) setLoginOpen(true); };
        window.addEventListener('muapi:auth-required', handler);
        return () => window.removeEventListener('muapi:auth-required', handler);
    }, [user]);

    // Global 402 handler → prompt top-up
    useEffect(() => {
        const id = axios.interceptors.response.use(
            (r) => r,
            (err) => {
                if (err?.response?.status === 402) {
                    const d = err.response.data || {};
                    setNeedFunds({ required: d.required || 0, balance: d.balance || profile?.balance || 0 });
                }
                return Promise.reject(err);
            }
        );
        return () => axios.interceptors.response.eject(id);
    }, [profile]);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return mapAuthError(error);
        setUser(data.user);
        await loadProfile(data.user);
        setLoginOpen(false);
        return null;
    };

    const register = async (email, password, name) => {
        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/?confirmed=1` },
        });
        if (error) return mapAuthError(error);
        if (data.user) {
            const needsConfirmation = !data.session || !data.user.email_confirmed_at;
            if (needsConfirmation) return '__CHECK_EMAIL__';
            setUser(data.user);
            await loadProfile(data.user);
            setLoginOpen(false);
        }
        return null;
    };

    const loginWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/` },
        });
        return error ? mapAuthError(error) : null;
    };

    const loginWithYandex = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: YANDEX_PROVIDER,
            options: { 
                redirectTo: `${window.location.origin}/`,
                skipBrowserRedirect: false,
            },
        });
        return error ? mapAuthError(error) : null;
    };

    const loginWithVK = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: VK_PROVIDER,
            options: { 
                redirectTo: `${window.location.origin}/`,
                skipBrowserRedirect: false,
            },
        });
        return error ? mapAuthError(error) : null;
    };

    const sendPhoneOtp = async (phone) => {
        const normalizedPhone = normalizePhone(phone);
        if (!normalizedPhone) return { error: 'Укажите телефон в формате +7XXXXXXXXXX' };

        const { error } = await supabase.auth.signInWithOtp({ phone: normalizedPhone });
        if (error) return { error: mapAuthError(error) };
        return { phone: normalizedPhone, error: null };
    };

    const verifyPhoneOtp = async (phone, token) => {
        const normalizedPhone = normalizePhone(phone);
        if (!normalizedPhone) return 'Укажите телефон в формате +7XXXXXXXXXX';
        if (!String(token || '').trim()) return 'Введите код из SMS';

        const { data, error } = await supabase.auth.verifyOtp({
            phone: normalizedPhone,
            token: String(token).trim(),
            type: 'sms',
        });
        if (error) return mapAuthError(error);

        const nextUser = data?.user || data?.session?.user || null;
        setTokenEverywhere(data?.session?.access_token || null);
        setUser(nextUser);
        await loadProfile(nextUser);
        setLoginOpen(false);
        return null;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setTokenEverywhere(null);
        setUser(null);
        setProfile(null);
    };

    const value = {
        user, profile, loading,
        balance: Number(profile?.balance || 0),
        login, register, loginWithGoogle, loginWithYandex, loginWithVK, sendPhoneOtp, verifyPhoneOtp, logout, refreshBalance,
        loginOpen, setLoginOpen,
        cabinetOpen, setCabinetOpen,
        needFunds, setNeedFunds,
        yandexAuthEnabled: YANDEX_AUTH_ENABLED,
        vkAuthEnabled: VK_AUTH_ENABLED,
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
