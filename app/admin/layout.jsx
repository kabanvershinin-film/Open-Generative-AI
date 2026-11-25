'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { isAdminUser } from '@/lib/admin';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminNav from '@/components/admin/AdminNav';
import StudioSidebar from '@/components/studio/StudioSidebar';

export default function AdminLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || !isAdminUser(user))) router.replace('/projects');
    }, [user, loading, router]);

    if (loading) return <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center"><p className="text-white/40 text-sm">Загрузка...</p></div>;
    if (!user || !isAdminUser(user)) return null;

    return (
        <div className="min-h-screen bg-[#0d0d14] text-white flex">
            <StudioSidebar />
            <div className="flex flex-1 ml-14">
                <AdminNav />
                <main className="flex-1 overflow-auto">{children}</main>
            </div>
        </div>
    );
}
