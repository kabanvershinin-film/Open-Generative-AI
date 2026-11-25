'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import StudioLayout from '@/components/studio/StudioLayout';

export default function ProfilePage() {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [repeatPwd, setRepeatPwd] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPwd, setSavingPwd] = useState(false);
    const [profileMsg, setProfileMsg] = useState('');
    const [pwdMsg, setPwdMsg] = useState('');
    const [storageInfo, setStorageInfo] = useState({ upload_gb: 3, gen_gb: 5, used_upload: 0.231, used_gen: 0.622 });

    useEffect(() => {
        if (user) {
            setName(user.user_metadata?.full_name || user.user_metadata?.name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    async function saveProfile(e) {
        e.preventDefault();
        setSavingProfile(true);
        setProfileMsg('');
        try {
            const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
            if (error) setProfileMsg(error.message);
            else setProfileMsg('Сохранено');
        } finally {
            setSavingProfile(false);
        }
    }

    async function savePassword(e) {
        e.preventDefault();
        if (newPwd !== repeatPwd) { setPwdMsg('Пароли не совпадают'); return; }
        if (newPwd.length < 8) { setPwdMsg('Пароль должен быть не менее 8 символов'); return; }
        setSavingPwd(true);
        setPwdMsg('');
        try {
            const { error } = await supabase.auth.updateUser({ password: newPwd });
            if (error) setPwdMsg(error.message);
            else { setPwdMsg('Пароль изменён'); setCurrentPwd(''); setNewPwd(''); setRepeatPwd(''); }
        } finally {
            setSavingPwd(false);
        }
    }

    return (
        <StudioLayout>
            <div className="max-w-2xl mx-auto p-8">
                <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Профиль</p>
                <h1 className="text-2xl font-bold mb-6">Настройки аккаунта</h1>

                {/* Storage indicators */}
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 mb-6">
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-1 text-sm">
                            <span className="text-white/60">Загрузки</span>
                            <span className="text-white/40 text-xs">{storageInfo.used_upload.toFixed(1)} MB / {storageInfo.upload_gb * 1000} MB</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full rounded-full bg-violet-500" style={{ width: `${(storageInfo.used_upload / (storageInfo.upload_gb * 1024)) * 100}%` }} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-1 text-sm">
                            <span className="text-white/60">Генерации</span>
                            <span className="text-white/40 text-xs">{storageInfo.used_gen.toFixed(1)} MB / {storageInfo.gen_gb * 1000} MB</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full rounded-full bg-fuchsia-500" style={{ width: `${(storageInfo.used_gen / (storageInfo.gen_gb * 1024)) * 100}%` }} />
                        </div>
                    </div>
                </div>

                {/* Profile info */}
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 mb-4">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="font-semibold mb-1">Информация профиля</h2>
                            <p className="text-sm text-white/40">Смените имя аккаунта и email.</p>
                        </div>
                    </div>
                    <form onSubmit={saveProfile} className="flex flex-col gap-3">
                        <div>
                            <label className="block text-xs text-white/40 mb-1.5">Имя</label>
                            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400/50" />
                        </div>
                        <div>
                            <label className="block text-xs text-white/40 mb-1.5">Email</label>
                            <input value={email} disabled className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/50 cursor-not-allowed" />
                        </div>
                        {profileMsg && <p className="text-xs text-green-400">{profileMsg}</p>}
                        <button type="submit" disabled={savingProfile} className="self-start px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium disabled:opacity-50 transition-colors">
                            {savingProfile ? '...' : 'Сохранить'}
                        </button>
                    </form>
                </div>

                {/* Change password */}
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                    <div className="mb-4">
                        <h2 className="font-semibold mb-1">Измените пароль</h2>
                        <p className="text-sm text-white/40">Используйте длинный уникальный пароль для защиты аккаунта.</p>
                    </div>
                    <form onSubmit={savePassword} className="flex flex-col gap-3">
                        <div>
                            <label className="block text-xs text-white/40 mb-1.5">Текущий пароль</label>
                            <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400/50" />
                        </div>
                        <div>
                            <label className="block text-xs text-white/40 mb-1.5">Новый пароль</label>
                            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400/50" />
                        </div>
                        <div>
                            <label className="block text-xs text-white/40 mb-1.5">Повторите пароль</label>
                            <input type="password" value={repeatPwd} onChange={e => setRepeatPwd(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400/50" />
                        </div>
                        {pwdMsg && <p className="text-xs text-green-400">{pwdMsg}</p>}
                        <button type="submit" disabled={savingPwd} className="self-start px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium disabled:opacity-50 transition-colors">
                            {savingPwd ? '...' : 'Сохранить'}
                        </button>
                    </form>
                </div>
            </div>
        </StudioLayout>
    );
}
