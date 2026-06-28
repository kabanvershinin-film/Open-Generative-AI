'use client';

import Link from 'next/link';

export default function OfferPage() {
  const sections = [
    {
      id: '01',
      title: '1. Статус документа',
      content: 'Настоящий документ является публичной офертой в соответствии со статьями 435 и 437 ГК РФ и регулирует порядок оказания платных услуг сервиса Сапог AI.',
    },
    {
      id: '02',
      title: '2. Исполнитель',
      content: 'Исполнитель: ИП Вершинин Евгений Александрович, ИНН 692700514344, ОГРНИП 326690000024874. Контактный email: kaban.vershinin@gmail.com.',
    },
    {
      id: '03',
      title: '3. Предмет оферты',
      content: 'Исполнитель предоставляет пользователю доступ к цифровому сервису генерации изображений, видео, аудио, промптов и иного ИИ-контента, а также к связанным платным функциям платформы.',
    },
    {
      id: '04',
      title: '4. Акцепт оферты',
      content: 'Акцептом оферты считается регистрация в сервисе, оплата услуг, пополнение баланса, использование платных функций либо иное фактическое начало использования платного функционала.',
    },
    {
      id: '05',
      title: '5. Стоимость и порядок оплаты',
      content: 'Стоимость услуг, тарифов, пакетов и кредитов указывается в интерфейсе сервиса на момент оплаты. Оплата производится в безналичном порядке через подключённые платёжные методы, доступные пользователю.',
    },
    {
      id: '06',
      title: '6. Порядок оказания услуг',
      content: 'Услуга считается оказанной с момента предоставления пользователю доступа к оплаченной функции, начисления баланса, кредитов или возможности использовать соответствующий функционал платформы.',
    },
    {
      id: '07',
      title: '7. Возвраты',
      content: 'Возврат денежных средств осуществляется в случаях, предусмотренных законодательством РФ и правилами сервиса. Фактически оказанные цифровые услуги и использованные кредиты возврату не подлежат.',
    },
    {
      id: '08',
      title: '8. Ответственность сторон',
      content: 'Исполнитель не несёт ответственности за невозможность использования сервиса по причинам, не зависящим от Исполнителя, включая сбои связи, действий третьих лиц, внешних ИИ-провайдеров и платёжных систем.',
    },
    {
      id: '09',
      title: '9. Изменение оферты',
      content: 'Исполнитель вправе изменять условия настоящей оферты в одностороннем порядке. Новая редакция вступает в силу с момента публикации на сайте, если иное не указано в самой редакции.',
    },
  ];

  return (
    <div className="min-h-screen bg-black p-8 font-sans leading-relaxed text-white md:p-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 flex items-center gap-4">
          <span className="rounded border border-purple-500/30 bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-400">
            Официальная версия · Действует
          </span>
        </div>
        <h1 className="mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-4xl font-black text-transparent">
          Публичная оферта
        </h1>
        <p className="mb-12 text-sm text-white/40">Последнее обновление: 2026-06-28</p>

        <div className="space-y-12">
          {sections.map((section) => (
            <section key={section.id} className="relative pl-12">
              <span className="absolute left-0 top-1 select-none text-2xl font-black text-purple-500/20">
                {section.id}
              </span>
              <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-white">
                {section.title}
              </h2>
              <p className="leading-relaxed text-white/70">{section.content}</p>
            </section>
          ))}

          <div className="mt-12 border-t border-white/10 pt-12">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-purple-400">Реквизиты исполнителя</h3>
              <div className="grid grid-cols-1 gap-6 text-sm text-white/50 md:grid-cols-2">
                <div>
                  <p className="mb-1 font-medium text-white/80">Исполнитель</p>
                  <p>ИП Вершинин Евгений Александрович</p>
                  <p>ИНН: 692700514344</p>
                  <p>ОГРНИП: 326690000024874</p>
                </div>
                <div>
                  <p className="mb-1 font-medium text-white/80">Контакты</p>
                  <p>Email: kaban.vershinin@gmail.com</p>
                  <p>Юридически значимые уведомления принимаются по указанному email.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white">
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            Вернуться в студию
          </Link>
          <p className="text-[10px] uppercase tracking-widest text-white/20">© 2026 Сапог AI</p>
        </div>
      </div>
    </div>
  );
}
