'use client';
import '@/app/partner-portal/portal.css';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layouts/Sidebar';
import api from '@/lib/axios';
import { AmbientEnvironment, PAGE_BG } from '@/app/partner-portal/premium';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [checkingRole, setCheckingRole] = useState(true);

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) { router.replace('/sign-in'); return; }
        api.post('/api/auth/sync', {
            clerkId: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            name: user.fullName || user.username || user.primaryEmailAddress?.emailAddress,
        }).then(r => {
            if (r.data?.data?.role === 'PARTNER') {
                router.replace('/partner-portal');
            } else {
                setCheckingRole(false);
            }
        }).catch(() => setCheckingRole(false));
    }, [isLoaded, user]);

    if (checkingRole) {
        return (
            <div className="relative min-h-screen flex items-center justify-center" style={{ background: PAGE_BG }}>
                <AmbientEnvironment />
                <div className="relative flex flex-col items-center gap-4">
                    <div className="pp-spinner" />
                    <p className="text-xs font-medium tracking-[0.2em] uppercase text-slate-400">Loading Solution Hub</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen" style={{ background: PAGE_BG }}>
            <AmbientEnvironment />
            <Sidebar />
            <main className="relative z-10 ml-56 flex-1 p-10 min-h-screen overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
