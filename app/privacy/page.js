'use client';

export default function PrivacyPage() {
    const sections = [
        {
            id: '01',
            title: '1. Общие положения',
            content: 'Настоящая Политика конфиденциальности определяет порядок сбора, обработки, хранения и защиты персональных данных пользователей сервиса Сапог AI, оператором которого является ИП Вершинин Евгений Александрович. Обработка осуществляется в соответствии с ФЗ № 152-ФЗ «О персональных данных», ФЗ № 149-ФЗ «Об информации» и иными актами РФ.'
        },
        {
            id: '02',
            title: '2. Оператор данных',
            content: 'ИП Вершинин Евгений Александрович. ИНН: 692700514344, ОГРНИП: 326690000024874. Контакт по вопросам персональных данных: через поддержку в приложении или по официальным реквизитам.'
        },
        {
            id: '03',
            title: '3. Категории данных',
            content: 'Мы обрабатываем: адрес электронной почты, хэш пароля, технические данные устройства (IP, ОС, браузер), журналы использования (история запросов, биллинг), а также текстовые запросы и референсные файлы для ИИ.'
        },
        {
            id: '04',
            title: '4. Цели обработки',
            content: 'Регистрация, предоставление услуг Сервиса, обработка платежей, защита от мошенничества, улучшение качества продукта и исполнение требований законодательства РФ.'
        },
        {
            id: '05',
            title: '5. Передача третьим лицам',
            content: 'Данные могут передаваться платёжным системам (для оплаты), поставщикам моделей ИИ (для генерации) и государственным органам по законным требованиям. Оператор не продаёт персональные данные третьим лицам.'
        },
        {
            id: '06',
            title: '6. Обработка данных в рамках ИИ',
            content: 'Запросы и референсы передаются поставщикам моделей исключительно для генерации контента. Мы не используем ваши частные творческие работы для несанкционированного обучения моделей.'
        },
        {
            id: '07',
            title: '7. Сроки хранения',
            content: 'Данные учётной записи хранятся в течение срока договора и не менее 5 лет после расторжения. Журналы использования — не менее 5 лет. Технические логи — до 1 года.'
        },
        {
            id: '08',
            title: '8. Права субъекта данных',
            content: 'Вы имеете право на доступ, исправление, экспорт и удаление данных, а также на отзыв согласия и обжалование действий Оператора в Роскомнадзор.'
        },
        {
            id: '09',
            title: '9. Меры защиты',
            content: 'Мы применяем TLS/HTTPS шифрование, хэширование паролей, разграничение прав доступа и регулярный аудит систем безопасности для защиты вашей информации.'
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
