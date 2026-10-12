'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserButton } from '@clerk/nextjs';
import { Home, Building2, ChevronRight, Handshake } from 'lucide-react';
import api from '@/lib/axios';

const activePillStyle = {
    background: 'linear-gradient(160deg, #1e293b, #0f172a)',
    color: '#ffffff',
    boxShadow: '0 14px 30px -10px rgba(15,23,42,0.45), 0 0 0 1px rgba(99,102,241,0.15), 0 1px 0 rgba(255,255,255,0.12) inset',
};

export default function Sidebar() {
    const pathname = usePathname();
    const [industries, setIndustries] = useState<any[]>([]);

    useEffect(() => {
        api.get('/api/industries').then(r => setIndustries(r.data.data || [])).catch(() => {});
    }, []);

    return (
        <aside className="pp-reveal fixed left-0 top-0 h-screen w-56 flex flex-col z-20 bg-white/60 backdrop-blur-2xl"
            style={{ borderRight: '1px solid rgba(15,23,42,0.06)', boxShadow: '8px 0 40px -20px rgba(15,23,42,0.08)' }}>
            {/* Brand */}
            <div className="px-5 py-6">
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
                        <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] mt-1.5 text-slate-400">Knowledge Repository</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-3 py-2 overflow-y-auto">
                {/* Home */}
                <Link href="/dashboard"
                    className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 mb-1.5"
                    style={pathname === '/dashboard' ? activePillStyle : { color: '#64748b' }}>
                    <Home size={15}
                        className={pathname === '/dashboard' ? '' : 'transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-px'}
                        style={{ color: pathname === '/dashboard' ? '#a5b4fc' : '#94a3b8' }} />
                    Home
                </Link>

                {/* Partners — visible to everyone */}
                <Link href="/dashboard/partners"
                    className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 mb-1.5"
                    style={pathname === '/dashboard/partners' ? activePillStyle : { color: '#64748b' }}>
                    <Handshake size={15}
                        className={pathname === '/dashboard/partners' ? '' : 'transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-px'}
                        style={{ color: pathname === '/dashboard/partners' ? '#a5b4fc' : '#94a3b8' }} />
                    Partners
                </Link>

                {/* Industries */}
                <div className="mt-5 mb-2 px-3.5 flex items-center gap-1.5">
                    <Building2 size={11} color="#94a3b8" />
                    <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-[0.18em]">Industries</span>
                </div>

                {industries.length === 0 ? (
                    <div className="px-3.5 py-2 space-y-2.5">
                        <div className="pp-shimmer h-2.5 w-24 rounded-full" />
                        <div className="pp-shimmer h-2.5 w-20 rounded-full" />
                        <div className="pp-shimmer h-2.5 w-28 rounded-full" />
                    </div>
                ) : (
                    industries.map(industry => {
                        const active = pathname === `/dashboard/industries/${industry.id}`;
                        return (
                            <Link key={industry.id} href={`/dashboard/industries/${industry.id}`}
                                className="group flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm transition-all duration-300"
                                style={active
                                    ? { ...activePillStyle, fontWeight: 500 }
                                    : { color: '#64748b' }}>
                                <span className="w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300"
                                    style={{ background: active ? '#a5b4fc' : '#cbd5e1' }} />
                                <span className="truncate">{industry.name}</span>
                                {active && <ChevronRight size={12} className="ml-auto shrink-0" color="#a5b4fc" />}
                            </Link>
                        );
                    })
                )}
            </nav>

            {/* User */}
            <div className="px-4 pb-6">
                <div className="pp-card pp-lift flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-white/80"
                    style={{ border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 8px 24px -12px rgba(15,23,42,0.12)' }}>
                    <UserButton />
                    <span className="text-sm text-slate-600 font-medium">Account</span>
                </div>
            </div>
        </aside>
    );
}
