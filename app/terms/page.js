'use client';

import Link from 'next/link';

export default function TermsPage() {
    const sections = [
        {
            id: '01',
            title: '1. Принятие',
            content: 'Использование Сапог AI означает, что вы соглашаетесь с настоящими Условиями. Если вы не согласны, пожалуйста, прекратите использование сервиса.'
        },
        {
            id: '02',
            title: '2. Использование сервиса',
            content: 'Вы должны соблюдать действующее законодательство Российской Федерации. Незаконное, мошенническое, нарушающее авторские права или вредное использование запрещено.'
        },
        {
            id: '03',
            title: '3. Аккаунт и безопасность',
            content: 'Вы несете ответственность за сохранность своих учетных данных. Действия, предпринятые под вашей учетной записью, приписываются вам.'
        },
        {
            id: '04',
            title: '4. Выставление счетов и продление',
            content: 'Платные планы продлеваются автоматически в течение каждого платежного цикла и могут быть отменены в учетной записи. Понесенное использование не подлежит возврату; предоплаченные кредиты расходуются по факту использования.'
        },
        {
            id: '05',
            title: '5. Интеллектуальная собственность',
            content: 'Бренд, копия, пользовательский интерфейс и код Сапог AI принадлежат нам. Вы сохраняете право собственности на созданный вами контент и предоставляете нам права, необходимые для работы службы.'
        },
        {
            id: '06',
            title: '6. Ограничение ответственности',
            content: 'В максимальной степени, разрешенной законом РФ, услуга предоставляется «как есть»; мы не несем ответственности за косвенные, случайные или косвенные убытки.'
        },
        {
            id: '07',
            title: '7. Изменения',
            content: 'Мы можем обновлять настоящие Условия. О существенных изменениях будет сообщено до их вступления в силу. Продолжение использования означает принятие.'
        },
        {
            id: '08',
            title: '8. Контакт',
            content: 'Если у вас есть вопросы, свяжитесь с нами через поддержку в приложении или по официальным реквизитам.'
        },
        {
            id: '09',
            title: '9. Маркировка контента, созданного ИИ',
            content: 'Некоторые изображения, видео, аудио и тексты на этой платформе создаются или синтезируются искусственным интеллектом. В соответствии с применимыми правилами в отношении ИИ-контента мы добавляем явную или неявную маркировку к контенту, созданному ИИ. Запрещается удалять, изменять, скрывать или подделывать такую маркировку; при распространении такого контента вы обязаны самостоятельно обеспечить соблюдение применимых требований к маркировке.'
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white p-8 md:p-20 font-sans leading-relaxed">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-2">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider border border-purple-500/30">
                        Официальная версия · Действует
                    </span>
                </div>
                <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Условия использования
                </h1>
                <p className="text-sm text-white/40 mb-12">Последнее обновление: 2026-06-05</p>
                
                <div className="space-y-12">
                    {sections.map((section) => (
                        <section key={section.id} className="relative pl-12">
                            <span className="absolute left-0 top-1 text-2xl font-black text-purple-500/20 select-none">
                                {section.id}
                            </span>
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                {section.title}
                            </h2>
                            <p className="text-white/70 leading-relaxed">
                                {section.content}
                            </p>
                        </section>
                    ))}

                    <div className="pt-12 mt-12 border-t border-white/10">
                        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-purple-400 mb-4">Юридическая информация</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-white/50">
                                <div>
                                    <p className="text-white/80 font-medium mb-1">Исполнитель</p>
                                    <p>ИП Вершинин Евгений Александрович</p>
                                    <p>ИНН: 692700514344</p>
                                    <p>ОГРНИП: 326690000024874</p>
                                </div>
                                <div>
                                    <p className="text-white/80 font-medium mb-1">Статус документа</p>
                                    <p>Настоящий документ вступает в силу с даты последнего обновления и действует до момента публикации новой редакции.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-16 flex items-center justify-between">
                    <Link href="/" className="group flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> 
                        Вернуться в студию
                    </Link>
                    <p className="text-[10px] text-white/20 uppercase tracking-widest">© 2026 Сапог AI</p>
                </div>
            </div>
        </div>
    );
}
