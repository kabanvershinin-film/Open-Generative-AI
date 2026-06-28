import './globals.css';
import { Inter } from "next/font/google";
import AuthShell from '@/components/auth/AuthShell';

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

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
    return (
        <html lang="ru">
            <body className={inter.variable}>
                <AuthShell>{children}</AuthShell>
            </body>
        </html>
    );
}
