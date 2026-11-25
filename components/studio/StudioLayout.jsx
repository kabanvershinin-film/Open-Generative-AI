'use client';

import StudioSidebar from './StudioSidebar';

export default function StudioLayout({ children }) {
    return (
        <div className="min-h-screen bg-[#0d0d14] text-white flex">
            <StudioSidebar />
            <main className="flex-1 ml-14 min-h-screen">
                {children}
            </main>
        </div>
    );
}
