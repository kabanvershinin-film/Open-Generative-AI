'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { isAdminUser } from '@/lib/admin';

const NAV = [
    { href: '/projects', icon: '◻', label: 'Проекты' },
    { href: '/subscriptions', icon: '★', label: 'Подписки' },
    { href: '/statistics', icon: '▤', label: 'Статистика' },
    { href: '/feedback', icon: '◎', label: 'Поддержка' },
];

export default function StudioSidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const admin = isAdminUser(user);

    return (
        <aside className="fixed left-0 top-0 h-full w-14 bg-[#0a0a0f] border-r border-white/[0.06] flex flex-col items-center py-3 z-50">
            <Link href="/projects" className="w-8 h-8 mb-6 mt-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold">AI</div>
            </Link>

            <nav className="flex flex-col items-center gap-1 flex-1">
                {NAV.map(({ href, icon, label }) => {
                    const active = pathname === href || pathname.startsWith(href + '/');
                    return (
                        <Link
                            key={href}
                            href={href}
                            title={label}
                            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[10px] transition-all
                                ${active ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                        >
                            <span className="text-base leading-none">{icon}</span>
                            <span className="leading-none">{label.slice(0, 7)}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="flex flex-col items-center gap-1 pb-2">
                {admin && (
                    <Link
                        href="/admin"
                        title="Администратор"
                        className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[10px] transition-all
                            ${pathname.startsWith('/admin') ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                    >
                        <span className="text-base leading-none">⚙</span>
                        <span className="leading-none">Адм.</span>
                    </Link>
                )}
                <Link
                    href="/profile"
                    title="Кабинет"
                    className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[10px] transition-all
                        ${pathname === '/profile' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                >
                    <span className="text-base leading-none">◉</span>
                    <span className="leading-none">Кабинет</span>
                </Link>
            </div>
        </aside>
    );
}
