'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthProvider';

export default function LoginModal() {
    const {
        loginOpen,
        setLoginOpen,
        login,
        register,
        loginWithGoogle,
        loginWithYandex,
        loginWithVK,
        sendPhoneOtp,
        verifyPhoneOtp,
        yandexAuthEnabled,
        vkAuthEnabled,
    } = useAuth();
    // New visitors land on the registration form; existing users switch to "Войти".
    const [mode, setMode] = useState('register'); // 'login' | 'register'
    const [method, setMethod] = useState('email'); // 'email' | 'phone'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSentTo, setOtpSentTo] = useState('');
    const [busy, setBusy] = useState(false);

    if (!loginOpen) return null;

    const close = () => setLoginOpen(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        const err = mode === 'login'
            ? await login(email, password)
            : await register(email, password, name);
        setBusy(false);
        if (err === '__CHECK_EMAIL__') {
            toast.success('Проверьте почту — отправлено письмо для подтверждения');
            setMode('login');
            return;
        }
        if (err) { toast.error(err); return; }
        toast.success(mode === 'login' ? 'Вход выполнен' : 'Аккаунт создан');
    };

    const isRegister = mode === 'register';
    const isPhone = method === 'phone';
    const inputCls = 'w-full px-4 py-3 rounded-xl bg-white/[0.08] border border-purple-300/25 text-white text-sm outline-none transition-colors placeholder:text-white/45 focus:border-purple-400 focus:bg-white/[0.12] shadow-sm shadow-purple-500/10';
    const switchMethod = (nextMethod) => {
        setMethod(nextMethod);
        setOtp('');
        setOtpSentTo('');
    };

    const requestPhoneCode = async () => {
        setBusy(true);
        const { phone: normalizedPhone, error } = await sendPhoneOtp(phone);
        setBusy(false);
        if (error) { toast.error(error); return; }
        setPhone(normalizedPhone);
        setOtpSentTo(normalizedPhone);
        toast.success('Код отправлен по SMS');
    };

    const submitPhoneOtp = async () => {
        setBusy(true);
        const err = await verifyPhoneOtp(phone, otp);
        setBusy(false);
        if (err) { toast.error(err); return; }
        toast.success('Вход выполнен');
        setOtp('');
        setOtpSentTo('');
    };

    const startOAuth = async (run) => {
        setBusy(true);
        const err = await run();
        setBusy(false);
        if (err) toast.error(err);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center p-4">
            {/* Video Background */}
            <div className="absolute inset-0 overflow-hidden">
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute min-w-full min-h-full object-cover opacity-60"
                >
                    <source src="https://open-generative-ai.tos-cn-beijing.volces.com/gallery/compressed_02178111753742700000000000000000000ffffac1485021a8cd2.mp4" type="video/mp4" />
                </video>
            </div>
            {/* Darker overlay for readability */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
            
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 fade-in duration-200">
                {/* glow */}
                <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-purple-600/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-28 -right-10 h-56 w-56 rounded-full bg-fuchsia-600/20 blur-3xl" />

                <div className="relative px-7 pt-9 pb-8">
                    {/* Brand */}
                    <div className="flex items-center justify-center gap-2.5 mb-2">
                        <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-lg shadow-purple-600/30 text-white text-lg font-black">◆</span>
                        <span className="text-white font-bold text-lg tracking-tight">OpenGenerativeAI</span>
                    </div>
                    <p className="text-center text-[11px] tracking-[0.22em] text-purple-300/70 uppercase mb-7">
                        От креаторов · для креаторов
                    </p>

                    <h2 className="text-2xl font-bold text-white text-center mb-6">
                        {isPhone ? 'Вход по телефону' : (isRegister ? 'Создайте аккаунт' : 'С возвращением')}
                    </h2>

                    <div className="grid grid-cols-2 gap-2 mb-5">
                        <button
                            type="button"
                            onClick={() => switchMethod('email')}
                            className={`py-2.5 rounded-xl text-sm border transition-colors ${
                                !isPhone
                                    ? 'bg-purple-600 border-purple-500 text-white'
                                    : 'bg-white/[0.03] border-white/10 text-white/60 hover:text-white'
                            }`}
                        >
                            Почта
                        </button>
                        <button
                            type="button"
                            onClick={() => switchMethod('phone')}
                            className={`py-2.5 rounded-xl text-sm border transition-colors ${
                                isPhone
                                    ? 'bg-purple-600 border-purple-500 text-white'
                                    : 'bg-white/[0.03] border-white/10 text-white/60 hover:text-white'
                            }`}
                        >
                            Телефон
                        </button>
                    </div>

                    {isPhone ? (
                        <div className="space-y-3">
                            <input
                                type="tel"
                                className={inputCls}
                                placeholder="+7 999 123-45-67"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                autoComplete="tel"
                            />
                            {otpSentTo && (
                                <input
                                    inputMode="numeric"
                                    className={inputCls}
                                    placeholder="Код из SMS"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />
                            )}
                            <button
                                type="button"
                                onClick={otpSentTo ? submitPhoneOtp : requestPhoneCode}
                                disabled={busy}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-purple-600/25 transition-all"
                            >
                                {busy ? '...' : (otpSentTo ? 'Подтвердить код' : 'Получить код')}
                            </button>
                            {otpSentTo && (
                                <button
                                    type="button"
                                    onClick={requestPhoneCode}
                                    disabled={busy}
                                    className="w-full py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    Отправить код ещё раз
                                </button>
                            )}
                            <p className="text-xs text-white/35 text-center">
                                Используйте международный формат телефона, например `+79991234567`.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="space-y-3">
                            {isRegister && (
                                <input className={inputCls} placeholder="Имя"
                                       value={name} onChange={(e) => setName(e.target.value)} required />
                            )}
                            <input type="email" className={inputCls} placeholder="Email"
                                   value={email} onChange={(e) => setEmail(e.target.value)} required />
                            <input type="password" className={inputCls} placeholder="Пароль"
                                   value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                            <button type="submit" disabled={busy}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-purple-600/25 transition-all">
                                {busy ? '...' : (isRegister ? 'Создать аккаунт' : 'Войти')}
                            </button>
                        </form>
                    )}

                    <div className="flex items-center gap-3 my-5">
                        <div className="h-px flex-1 bg-purple-400/20" />
                        <span className="text-[11px] text-purple-200/70 uppercase tracking-wider">быстрый вход</span>
                        <div className="h-px flex-1 bg-purple-400/20" />
                    </div>

                    <button type="button" onClick={() => startOAuth(loginWithGoogle)} disabled={busy}
                            className="w-full py-3 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-purple-300/25 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm shadow-purple-500/10">
                        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 7.9-21.1l5.7-5.7A20 20 0 1 0 24 44c11 0 19.6-8 19.6-20 0-1.3-.1-2.3-.4-3.5z"/>
                            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3.1 0 5.9 1.2 7.9 3.1l5.7-5.7A20 20 0 0 0 6.3 14.7z"/>
                            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.6 5.1A20 20 0 0 0 24 44z"/>
                            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C39.9 36.6 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"/>
                        </svg>
                        Войти через Google
                    </button>

                    {yandexAuthEnabled && (
                        <button
                            type="button"
                            onClick={() => startOAuth(loginWithYandex)}
                            disabled={busy}
                            className="w-full mt-3 py-3 rounded-xl bg-[#FC3F1D] hover:bg-[#ff5333] border border-[#FF6B5B] text-white text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FC3F1D]/25"
                        >
                            <span className="text-base font-black leading-none">Я</span>
                            Войти через Яндекс ID
                        </button>
                    )}

                    {vkAuthEnabled && (
                        <button
                            type="button"
                            disabled={true}
                            className="w-full mt-3 py-3 rounded-xl bg-[#0077FF]/40 border border-[#4DA3FF]/30 text-white/60 text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-not-allowed"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="opacity-60">
                                <path d="M14.8 3.9c-.16-.24-.36-.45-.62-.6-.3-.18-.67-.24-1.03-.24H9.91c-.1 0-.2.04-.27.11l-.41.41c-.24.24-.37.56-.37.9v2.7c0 .24.08.47.23.67l.89 1.2c.17.23.43.38.72.42h.01c.04 0 .08 0 .12-.01h1.37c.09 0 .17-.03.24-.09.09-.07.15-.16.18-.27l.06-.21c.04-.14.07-.29.08-.44l.01-.23c.01-.07.01-.14 0-.21l-.01-.28-.02-.28c-.02-.23-.08-.46-.18-.68-.03-.07-.07-.14-.11-.2-.01-.02-.02-.04-.04-.05-.07-.08-.16-.13-.26-.15h-.14c-.13 0-.25.04-.35.12l-1.23 1.04c-.12.1-.29.15-.46.14-.16 0-.31-.05-.44-.14l-.18-.14c-.09-.07-.16-.16-.2-.27-.02-.05-.03-.1-.03-.15V4.54c0-.34.13-.67.38-.91l.41-.41c.07-.07.17-.11.27-.11h1.99c.12 0 .23.02.33.06.11.05.2.12.28.21l.62.71c.08.09.14.19.19.3.04.11.06.22.06.34v2.18c0 .12-.03.24-.09.35-.05.09-.12.17-.21.24-.04.03-.08.06-.13.08-.1.04-.2.06-.31.06h-.16c-.1 0-.19-.03-.28-.08l-.3-.17c-.08-.04-.15-.1-.21-.17-.03-.03-.05-.07-.07-.11-.02-.04-.03-.08-.04-.12l-.01-.02c-.03-.08-.04-.17-.02-.25.01-.04.02-.07.04-.1.03-.05.07-.1.11-.14l.36-.38c.04-.04.08-.07.13-.09.06-.02.11-.03.17-.03h.2c.13 0 .25.04.35.12l.93.79c.08.07.18.11.28.12.1.01.2-.02.29-.07.1-.06.18-.14.24-.24.03-.05.06-.1.08-.16.03-.07.04-.13.05-.2l.02-.14.01-.21v-2.2c.01-.34-.12-.67-.37-.92l-.6-.71Z"/>
                                <path d="M9.18 5.31c-.06-.03-.12-.05-.18-.06h-.19c-.12 0-.23.03-.33.09l-1.14.82c-.07.05-.12.11-.17.19-.02.03-.04.07-.05.1-.02.06-.03.12-.02.18.01.06.03.11.06.16.02.04.05.08.09.11l.35.36c.03.03.07.06.11.08.08.04.16.06.25.06.09 0 .17-.02.25-.06l.9-.76c.08-.07.19-.11.3-.11h.21c.06 0 .11.02.17.05.09.06.15.15.17.26.01.04.01.07.01.11v2.71c0 .05-.01.1-.03.15-.02.06-.05.11-.09.15-.06.07-.14.12-.24.14-.05.01-.1.01-.15 0h-.2c-.12 0-.23-.04-.32-.11l-.92-.78c-.06-.05-.13-.08-.21-.08-.08 0-.15.03-.22.08l-.36.38c-.04.04-.08.09-.11.14-.02.05-.04.1-.04.16.01.06.02.12.06.17l.31.18c.06.04.13.06.2.08.08.02.16.03.24.03h.16c.11 0 .21-.02.31-.06.05-.02.09-.05.13-.08.09-.07.16-.15.21-.24.06-.11.09-.23.09-.35V5.54c0-.12-.02-.23-.06-.34Z"/>
                                <path d="M7.6 11.71c.09.06.19.1.3.1h.2c.1 0 .19-.04.28-.1l.9-.78c.07-.06.14-.13.2-.2.03-.04.06-.08.08-.13.02-.06.03-.11.03-.17 0-.06-.01-.12-.04-.17-.04-.08-.1-.14-.18-.19-.04-.02-.08-.04-.13-.05h-.2c-.1 0 .1.01-.1.04-.04.01-.08.02-.12.05l-.9.77c-.08.07-.19.11-.3.11h-.2c-.06 0-.11-.02-.17-.05-.09-.06-.15-.15-.17-.26-.01-.04-.01-.07-.01-.11V6.55c0-.11.02-.22.06-.32.04-.11.11-.2.21-.26.04-.03.09-.05.14-.06h.2c.11 0 .22.03.32.1l.91.78c.07.06.14.12.2.2.03.04.06.08.08.13.02.06.03.11.03.17 0 .06-.01.12-.04.17-.04.08-.1.14-.18.19-.04.02-.08.04-.13.05h-.2c-.1 0-.19-.02-.28-.07l-.9-.77c-.08-.07-.19-.11-.3-.11h-.2c-.06 0-.11.02-.17.05-.09.06-.15.15-.17.26-.01.04-.01.07-.01.11v4.92c0 .11.02.22.06.32Z"/>
                            </svg>
                            Войти через ВКонтакте (Скоро)
                        </button>
                    )}

                    <button
                        type="button"
                        disabled={true}
                        className="w-full mt-3 py-3 rounded-xl bg-[#2AABEE]/40 border border-[#2AABEE]/30 text-white/60 text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-not-allowed"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="opacity-60">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.025-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.348-.374-1.297-.789.027-.236.32-.465.892-.732 3.548-1.695 5.931-2.851 7.117-3.456 3.332-1.658 4.025-1.949 4.476-1.951z"/>
                        </svg>
                        Войти через Телеграм (Скоро)
                    </button>

                    {!isPhone && (
                        <div className="text-center text-sm text-white/45 mt-5">
                            {isRegister ? (
                                <>Уже есть аккаунт?{' '}
                                    <button type="button" onClick={() => setMode('login')} className="text-purple-300 font-medium hover:text-purple-200 hover:underline">Войти</button>
                                </>
                            ) : (
                                <>Нет аккаунта?{' '}
                                    <button type="button" onClick={() => setMode('register')} className="text-purple-300 font-medium hover:text-purple-200 hover:underline">Регистрация</button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
