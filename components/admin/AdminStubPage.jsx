'use client';

export default function AdminStubPage({ title, description }) {
    return (
        <div className="p-6">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Администратор</p>
            <h1 className="text-xl font-bold mb-2">{title}</h1>
            {description && <p className="text-sm text-white/40 mb-6">{description}</p>}
            <div className="rounded-xl border border-dashed border-white/[0.08] p-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl mb-3">⚙</div>
                <p className="text-sm text-white/40">Раздел подключается к API после настройки переменных окружения.</p>
                <p className="text-xs text-white/25 mt-1">Используется Supabase service role key для полного доступа.</p>
            </div>
        </div>
    );
}
