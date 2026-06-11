'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthProvider';
import NeonPixelBackground from './NeonPixelBackground';

export default function LoginModal() {
    const {
        loginOpen,
        setLoginOpen,
        login,
        register,
        loginWithGoogle,
        loginWithYandex,
        sendPhoneOtp,
        verifyPhoneOtp,
        yandexAuthEnabled,
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
            {/* Neon Pixel Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a090f] via-[#120f1c] to-[#0a090f]">
                <NeonPixelBackground />
            </div>
            {/* Darker overlay for readability */}
            <div className="absolute inset-0 bg-black/30" />
            
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-purple-400/30 bg-gradient-to-b from-[#120f1c] to-[#0a090f] shadow-[0_30px_100px_rgba(124,58,237,0.45)] animate-in zoom-in-95 fade-in duration-200" style={{ marginLeft: '100px' }}>
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
