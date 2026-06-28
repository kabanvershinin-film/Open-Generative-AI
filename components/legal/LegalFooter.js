import Link from 'next/link';

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Политика' },
  { href: '/terms', label: 'Условия' },
  { href: '/offer', label: 'Оферта' },
];

export default function LegalFooter() {
  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-20 max-w-[calc(100vw-1.5rem)]">
      <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/60 px-4 py-3 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/55">
          {LEGAL_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-medium transition-colors hover:text-purple-300"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="mt-2 text-[10px] leading-relaxed text-white/35">
          ИП Вершинин Евгений Александрович · ИНН 692700514344 · ОГРНИП 326690000024874
        </div>
        <div className="text-[10px] leading-relaxed text-white/28">
          Контакт: kaban.vershinin@gmail.com
        </div>
      </div>
    </div>
  );
}
