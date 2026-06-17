'use client';

export default function PrivacyPage() {
    const sections = [
        {
            id: '01',
            title: '1. Обзор',
            content: 'Эта политика объясняет, как мы собираем, используем и защищаем вашу информацию. Использование сервиса Сапог AI означает, что вы признаете и принимаете эту политику.'
        },
        {
            id: '02',
            title: '2. Что мы собираем',
            content: 'Информация об учетной записи (электронная почта, хэш пароля), журналы использования (звонки, выставление счетов), данные об устройстве и сети. Мы не собираем активно конфиденциальную личную информацию.'
        },
        {
            id: '03',
            title: '3. Как мы это используем',
            content: 'Для предоставления услуг, аутентификации, выставления счетов, защиты от злоупотреблений, улучшения продукта и — с вашего согласия — общения.'
        },
        {
            id: '04',
            title: '4. Совместное использование',
            content: 'Мы не продаем личную информацию. Мы делимся минимумом, необходимым с соответствующими требованиям третьими сторонами (платежными системами, поставщиками вышестоящих моделей) для предоставления услуги.'
        },
        {
            id: '05',
            title: '5. Удержание',
            content: 'Мы храним данные до тех пор, пока этого требует закон РФ и потребности бизнеса. Вы можете запросить удаление в любое время, за исключением случаев, когда закон требует сохранения.'
        },
        {
            id: '06',
            title: '6. Ваши права',
            content: 'Вы можете получить доступ, исправить, экспортировать или удалить свои данные через настройки учетной записи или обратившись в службу поддержки.'
        },
        {
            id: '07',
            title: '7. Безопасность',
            content: 'Мы применяем шифрование при передаче, контроль доступа и минимальные привилегии. Ни один метод не является на 100% безопасным.'
        },
        {
            id: '08',
            title: '8. Контакт',
            content: 'По вопросам конфиденциальности свяжитесь с нами через поддержку в приложении или по официальным реквизитам.'
        },
        {
            id: '09',
            title: '9. Обработка ИИ и данные',
            content: 'Для предоставления услуг генерации и обработки ИИ отправляемые вами запросы, референсные изображения, тексты и результаты передаются нам или доверенным сторонним поставщикам моделей для обработки. Мы не используем ваши частные творческие работы для несанкционированного обучения моделей; результаты могут временно кэшироваться для обеспечения качества, и вы можете управлять ими или удалять их в своём аккаунте.'
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
                    Политика конфиденциальности
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
                            <h3 className="text-sm font-bold uppercase tracking-widest text-purple-400 mb-4">Информация об операторе</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-white/50">
                                <div>
                                    <p className="text-white/80 font-medium mb-1">Оператор данных</p>
                                    <p>ИП Вершинин Евгений Александрович</p>
                                    <p>ИНН: 692700514344</p>
                                    <p>ОГРНИП: 326690000024874</p>
                                </div>
                                <div>
                                    <p className="text-white/80 font-medium mb-1">Защита данных</p>
                                    <p>Обработка персональных данных осуществляется в соответствии с ФЗ-152 «О персональных данных».</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-16 flex items-center justify-between">
                    <a href="/" className="group flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> 
                        Вернуться в студию
                    </a>
                    <p className="text-[10px] text-white/20 uppercase tracking-widest">© 2026 Сапог AI</p>
                </div>
            </div>
        </div>
    );
}
