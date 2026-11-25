'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SECTIONS = [
    { group: 'Обзор', items: [{ href: '/admin', label: 'Обзор' }] },
    { group: 'Пользователи', items: [
        { href: '/admin/users', label: 'Пользователи' },
        { href: '/admin/partners', label: 'Партнёры' },
        { href: '/admin/partner-programs', label: 'Программы' },
        { href: '/admin/roles', label: 'Роли' },
        { href: '/admin/auth-settings', label: 'Настройки авторизации' },
        { href: '/admin/access-blocks', label: 'Блокировки доступа' },
    ]},
    { group: 'Финансы', items: [
        { href: '/admin/payment-provider', label: 'Провайдер оплаты' },
        { href: '/admin/subscriptions', label: 'Подписки' },
        { href: '/admin/mail-settings', label: 'Email-уведомления' },
        { href: '/admin/transactions', label: 'Транзакции' },
        { href: '/admin/billing-audit', label: 'Аудит биллинга' },
        { href: '/admin/database-backups', label: 'Резервные копии' },
    ]},
    { group: 'Контент', items: [
        { href: '/admin/models', label: 'Модели' },
        { href: '/admin/generations', label: 'Генерации' },
        { href: '/admin/content-moderation', label: 'Модерация' },
        { href: '/admin/workflow-settings', label: 'Настройки workflow' },
        { href: '/admin/author-nodes', label: 'Авторские ноды' },
        { href: '/admin/orchestration-capacity', label: 'Оркестрация' },
    ]},
    { group: 'Система', items: [
        { href: '/admin/feedback', label: 'Обратная связь' },
        { href: '/admin/landing', label: 'Лендинг' },
        { href: '/admin/cms-pages', label: 'CMS страницы' },
        { href: '/admin/notifications', label: 'Уведомления' },
        { href: '/admin/provider-credentials', label: 'Провайдеры (ключи)' },
        { href: '/admin/vpn', label: 'VPN' },
        { href: '/admin/services', label: 'Сервисы' },
        { href: '/admin/storage', label: 'Хранилище' },
        { href: '/admin/activity-log', label: 'Журнал активности' },
        { href: '/admin/observability', label: 'Мониторинг' },
        { href: '/admin/horizon', label: 'Horizon (очереди)' },
    ]},
];

export default function AdminNav() {
    const pathname = usePathname();
    return (
        <nav className="w-56 shrink-0 bg-[#0a0a0f] border-r border-white/[0.06] h-full overflow-y-auto py-4">
            {SECTIONS.map(section => (
                <div key={section.group} className="mb-4">
                    <p className="px-4 mb-1 text-[10px] uppercase tracking-widest text-white/25">{section.group}</p>
                    {section.items.map(item => {
                        const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`block px-4 py-1.5 text-sm transition-all ${active ? 'text-white bg-white/8' : 'text-white/50 hover:text-white/80 hover:bg-white/4'}`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            ))}
        </nav>
    );
}
