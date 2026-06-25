import './globals.css';
import { Inter } from "next/font/google";
import AuthShell from '@/components/auth/AuthShell';

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://open-generative-ai-sand.vercel.app';
const siteTitle = 'Сапог AI — студия генерации фото, видео и workflow';
const siteDescription = 'AI-платформа для генерации фото и видео, работы с workflow и 200+ моделями: Flux, Midjourney, Kling, Veo, Seedance и другими.';

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
        images: [
            {
                url: '/banner.png',
                width: 1200,
                height: 630,
                alt: 'Сапог AI',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: siteTitle,
        description: siteDescription,
        images: ['/banner.png'],
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
