import './globals.css';
import { Inter } from "next/font/google";
import AuthShell from '@/components/auth/AuthShell';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

const SITE_MAINTENANCE_MODE = true;

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://open-generative-ai-sand.vercel.app';
const siteTitle = 'Сапог AI — платформа для создания видео и фото';
const siteDescription = 'Сапог AI — платформа для создания видео и фото.';

export const metadata = {
    metadataBase: new URL(siteUrl),
    title: siteTitle,
    description: siteDescription,
    applicationName: 'Сапог AI',
    openGraph: {
        title: siteTitle,
        description: siteDescription,
        url: siteUrl,
        siteName: 'Сапог AI',
        locale: 'ru_RU',
        type: 'website',
    },
    twitter: {
        card: 'summary',
        title: siteTitle,
        description: siteDescription,
    },
    links: [
        { rel: 'preload', href: 'https://open-generative-ai.tos-cn-beijing.volces.com/gallery/compressed_02178111753742700000000000000000000ffffac1485021a8cd2.mp4', as: 'video', type: 'video/mp4', crossOrigin: 'anonymous' },
    ],
};

export default function RootLayout({ children }) {
    if (SITE_MAINTENANCE_MODE) {
        return (
            <html lang="ru" suppressHydrationWarning>
                <body className={inter.variable} suppressHydrationWarning>
                    <main className="min-h-screen bg-[#05010c] text-white flex items-center justify-center px-6">
                        <section className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl p-8 md:p-12 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-400/20 mb-6">
                                <span className="text-4xl" aria-hidden="true">⚠</span>
                            </div>
                            <p className="text-sm md:text-base uppercase tracking-[0.35em] text-fuchsia-300/80 mb-4">
                                Технические работы
                            </p>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
                                Сайт временно закрыт на доработку
                            </h1>
                            <p className="text-base md:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
                                Мы обновляем сервис, чтобы он работал стабильнее и быстрее.
                                Пожалуйста, зайдите позже.
                            </p>
                        </section>
                    </main>
                </body>
            </html>
        );
    }

    return (
        <html lang="ru" suppressHydrationWarning>
            <body className={inter.variable} suppressHydrationWarning>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var theme = localStorage.getItem('sapog_theme');
                                    var nextTheme = theme === 'dark' ? 'dark' : 'light';
                                    document.documentElement.dataset.theme = nextTheme;
                                    document.body.dataset.theme = nextTheme;
                                } catch (e) {
                                    document.documentElement.dataset.theme = 'light';
                                }
                            })();
                        `,
                    }}
                />
                <ThemeProvider>
                    <AuthShell>{children}</AuthShell>
                </ThemeProvider>
            </body>
        </html>
    );
}
