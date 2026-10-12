'use client';

import './portal.css';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Upload, FolderKanban, Files, Hourglass, ShieldX } from 'lucide-react';
import api from '@/lib/axios';
import ApplyGate from './ApplyGate';
import { AmbientEnvironment, PAGE_BG } from './premium';

function StatusScreen({ icon, iconBg, title, message }: { icon: React.ReactNode; iconBg: string; title: string; message: string }) {
    return (
        <div className="relative min-h-screen flex items-center justify-center px-6" style={{ background: PAGE_BG }}>
            <AmbientEnvironment />
            <div className="pp-reveal pp-card pp-ring relative w-full max-w-md text-center rounded-3xl px-10 py-14 bg-white/85"
                style={{
                    boxShadow: '0 32px 80px -24px rgba(15,23,42,0.22), 0 1px 0 rgba(255,255,255,0.9) inset',
                    border: '1px solid rgba(15,23,42,0.06)',
                }}>
                <div className="pp-float w-16 h-16 mx-auto mb-7 rounded-2xl flex items-center justify-center"
                    style={{ background: iconBg, boxShadow: '0 12px 28px -10px rgba(15,23,42,0.18)' }}>
                    {icon}
                </div>
                <h1 className="text-2xl font-semibold text-slate-900 mb-3 tracking-tight">{title}</h1>
                <p className="text-sm leading-relaxed text-slate-500 mb-9">{message}</p>
                <div className="flex justify-center"><UserButton /></div>
            </div>
        </div>
    );
}

export default function PartnerPortalLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoaded, isSignedIn } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const [synced, setSynced] = useState(false);
    const [partner, setPartner] = useState<any>(undefined); // undefined = loading, null = no application yet
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.replace('/sign-in');
        }
    }, [isLoaded, isSignedIn, router]);

    useEffect(() => {
        if (isLoaded && user) {
            api.post('/api/auth/sync', {
                clerkId: user.id,
                email: user.primaryEmailAddress?.emailAddress,
                name: user.fullName || user.username || user.primaryEmailAddress?.emailAddress,
            }).catch(() => { }).finally(() => setSynced(true));
        }
    }, [isLoaded, user]);

    useEffect(() => {
        if (synced) {
            api.get('/api/partners/me').then(r => setPartner(r.data?.data ?? null)).catch(() => setPartner(null));
        }
    }, [synced, reloadKey]);

    if (!isLoaded || !isSignedIn || !synced || partner === undefined) {
        return (
            <div className="relative min-h-screen flex items-center justify-center" style={{ background: PAGE_BG }}>
                <AmbientEnvironment />
                <div className="relative flex flex-col items-center gap-4">
                    <div className="pp-spinner" />
                    <p className="text-xs font-medium tracking-[0.2em] uppercase text-slate-400">Preparing your portal</p>
                </div>
            </div>
        );
    }

    if (!partner) {
        return <ApplyGate onSubmitted={() => setReloadKey(k => k + 1)} />;
    }

    if (partner.status === 'PENDING' || partner.status === 'INFO_REQUESTED' || partner.status === 'HOLD') {
        return (
            <StatusScreen
                icon={<Hourglass size={24} color="#475569" />}
                iconBg="linear-gradient(145deg, #f8fafc, #e8ecf3)"
                title="Application Under Review"
                message={
                    partner.status === 'INFO_REQUESTED'
                        ? `Our team needs more information: ${partner.rejectionReason || 'please check your email.'}`
                        : partner.status === 'HOLD'
                        ? "Your application is on hold for now — we'll revisit it and follow up."
                        : "Thanks for applying — we'll be in touch once our team reviews it."
                }
            />
        );
    }

    if (partner.status === 'REJECTED' || partner.status === 'SUSPENDED' || partner.status === 'ARCHIVED') {
        return (
            <StatusScreen
                icon={<ShieldX size={24} color="#dc2626" />}
                iconBg="linear-gradient(145deg, #fef7f7, #fdeaea)"
                title={partner.status === 'REJECTED' ? 'Application Not Approved'
                    : partner.status === 'ARCHIVED' ? 'Partnership Archived'
                    : 'Access Suspended'}
                message={partner.status === 'ARCHIVED'
                    ? 'This partnership has been archived. Please contact us if you believe this is a mistake.'
                    : partner.rejectionReason || 'Please contact us for more details.'}
            />
        );
    }

    const navItems = [
        { href: '/partner-portal', label: 'Apply', icon: Upload },
        { href: '/partner-portal/my-solutions', label: 'My Solutions', icon: FolderKanban },
        { href: '/partner-portal/documents', label: 'Documents', icon: Files },
    ];

    return (
        <div className="relative flex min-h-screen" style={{ background: PAGE_BG }}>
            <AmbientEnvironment />

            <aside className="pp-reveal fixed left-0 top-0 h-screen w-60 flex flex-col z-20 bg-white/60 backdrop-blur-2xl"
                style={{ borderRight: '1px solid rgba(15,23,42,0.06)', boxShadow: '8px 0 40px -20px rgba(15,23,42,0.08)' }}>
                <div className="px-5 py-7">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                                background: 'linear-gradient(160deg, #1e293b, #0f172a)',
                                boxShadow: '0 10px 24px -8px rgba(15,23,42,0.5), 0 1px 0 rgba(255,255,255,0.15) inset',
                            }}>
                            <span className="text-white font-semibold text-sm">S</span>
                        </div>
                        <div>
                            <p className="text-[15px] font-semibold text-slate-900 leading-none tracking-tight">Solution Hub</p>
                            <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] mt-1.5 text-slate-400">
                                Partner Accelerator Portal
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-2 space-y-1.5">
                    {navItems.map(({ href, label, icon: Icon }, i) => {
                        const active = pathname === href;
                        return (
                            <Link key={href} href={href}
                                className="pp-reveal group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300"
                                style={{
                                    animationDelay: `${0.1 + i * 0.06}s`,
                                    ...(active
                                        ? {
                                            background: 'linear-gradient(160deg, #1e293b, #0f172a)',
                                            color: '#ffffff',
                                            boxShadow: '0 14px 30px -10px rgba(15,23,42,0.45), 0 0 0 1px rgba(99,102,241,0.15), 0 1px 0 rgba(255,255,255,0.12) inset',
                                        }
                                        : { color: '#64748b' }),
                                }}>
                                <Icon size={15} className={active ? '' : 'transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-px'}
                                    style={{ color: active ? '#a5b4fc' : '#94a3b8' }} />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-4 pb-6">
                    <div className="pp-card pp-lift flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-white/80"
                        style={{ border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 8px 24px -12px rgba(15,23,42,0.12)' }}>
                        <UserButton />
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{partner.companyName}</p>
                            <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span className="relative flex w-1.5 h-1.5">
                                    <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" style={{ animationDuration: '2.5s' }} />
                                    <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                </span>
                                Active Partner
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="relative z-10 ml-60 flex-1 px-12 py-12 max-w-4xl">
                {children}
            </main>
        </div>
    );
}
