import './globals.css';
import { Inter } from "next/font/google";
import AuthShell from '@/components/auth/AuthShell';

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

export const metadata = {
    title: 'Сапог AI — Студия генерации фото и видео',
    description: 'Generate AI images and videos using 200+ models — Flux, Midjourney, Kling, Veo, Seedance and more.',
    links: [
        { rel: 'preload', href: 'https://open-generative-ai.tos-cn-beijing.volces.com/gallery/compressed_02178111753742700000000000000000000ffffac1485021a8cd2.mp4', as: 'video', type: 'video/mp4', crossOrigin: 'anonymous' },
    ],
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={inter.variable}>
                <AuthShell>{children}</AuthShell>
            </body>
        </html>
    );
}
