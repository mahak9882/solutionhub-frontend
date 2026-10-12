'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, FileText, CheckCircle, Archive, Clock, TrendingUp, Handshake, Hourglass } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useCardGlow } from '@/app/partner-portal/premium';

const glassCard = {
    border: '1px solid rgba(15,23,42,0.06)',
    boxShadow: '0 20px 50px -24px rgba(15,23,42,0.18), 0 1px 0 rgba(255,255,255,0.9) inset',
};

export default function DashboardPage() {
    const glow = useCardGlow();
    const [stats, setStats] = useState<any>(null);
    const [recentAssets, setRecentAssets] = useState<any[]>([]);
    const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [platformStats, setPlatformStats] = useState<any>(null);

    useEffect(() => {
        api.get('/api/dashboard/stats').then(r => setPlatformStats(r.data.data)).catch(() => {});
    }, []);

    useEffect(() => {
        try {
            const rv = JSON.parse(localStorage.getItem('ps_recently_viewed') || '[]');
            setRecentlyViewed(rv.slice(0, 5));
        } catch {}

        api.get('/api/assets', { params: { limit: 6 } })
            .then(r => setRecentAssets(r.data.data || []))
            .catch(() => {});

        Promise.allSettled([
            api.get('/api/assets', { params: { limit: 1000 } }),
            api.get('/api/customers'),
            api.get('/api/industries'),
        ]).then(([allRes, custRes, indRes]) => {
            const all = allRes.status === 'fulfilled' ? (allRes.value.data.data || []) : [];
            const customers = custRes.status === 'fulfilled' ? (custRes.value.data.data || []) : [];
            const industries = indRes.status === 'fulfilled' ? (indRes.value.data.data || []) : [];
            const active = all.filter((a: any) => a.status !== 'ARCHIVED' && a.isPrimary !== false);
            setStats({
                totalAssets: active.length,
                publishedAssets: active.filter((a: any) => a.status === 'PUBLISHED').length,
                draftAssets: active.filter((a: any) => a.status === 'DRAFT').length,
                archivedAssets: all.filter((a: any) => a.status === 'ARCHIVED').length,
                totalCustomers: customers.length,
                totalIndustries: industries.length,
            });
        }).finally(() => setLoading(false));
    }, []);

    const statCards = [
        { label: 'Total Assets', value: stats?.totalAssets ?? '…', sub: `${stats?.publishedAssets ?? 0} published`, icon: FileText },
        { label: 'Industries', value: stats?.totalIndustries ?? '…', sub: 'active sectors', icon: Building2 },
        { label: 'Customers', value: stats?.totalCustomers ?? '…', sub: 'tracked accounts', icon: Users },
        { label: 'Published', value: stats?.publishedAssets ?? '…', sub: `of ${stats?.totalAssets ?? 0} total`, icon: CheckCircle },
    ];

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-10">
                <p className="pp-reveal text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 mb-3"
                    style={{ animationDelay: '0.05s' }}>
                    Overview
                </p>
                <h1 className="pp-reveal text-[32px] font-semibold tracking-tight text-slate-900 leading-tight"
                    style={{ animationDelay: '0.12s' }}>
                    Good{' '}
                    <span style={{
                        background: 'linear-gradient(100deg, #0f172a 10%, #475569 45%, #6366f1 90%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        morning
                    </span>
                    {' '}👋
                </h1>
                <p className="pp-reveal text-sm text-slate-500 mt-2" style={{ animationDelay: '0.18s' }}>
                    Here's what's happening in your Solution Hub
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {statCards.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} onMouseMove={glow}
                            className="pp-reveal pp-card pp-lift rounded-2xl p-5 bg-white/85"
                            style={{ ...glassCard, animationDelay: `${0.22 + i * 0.07}s` }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: 'linear-gradient(145deg, #ffffff, #eef1f6)', boxShadow: '0 6px 16px -8px rgba(15,23,42,0.18), 0 1px 0 rgba(255,255,255,0.9) inset' }}>
                                    <Icon size={17} color="#475569" />
                                </div>
                                <TrendingUp size={14} color="#10b981" />
                            </div>
                            <p className="text-2xl font-semibold text-slate-900 tracking-tight">{loading ? '…' : s.value}</p>
                            <p className="text-sm font-medium text-slate-600 mt-0.5">{s.label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-3 gap-5 mb-5">
                {/* Recent assets */}
                <div onMouseMove={glow}
                    className="pp-reveal pp-card col-span-2 rounded-2xl p-6 bg-white/85"
                    style={{ ...glassCard, animationDelay: '0.5s' }}>
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-semibold text-slate-900 tracking-tight">Recent Assets</h2>
                        <Link href="/dashboard/industries" className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors duration-300">View all →</Link>
                    </div>
                    {loading ? (
                        <div className="space-y-3">
                            {[1,2,3].map(i => <div key={i} className="pp-shimmer h-12 rounded-xl" />)}
                        </div>
                    ) : recentAssets.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="pp-float w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                                style={{ background: 'linear-gradient(145deg, #ffffff, #eef1f6)', boxShadow: '0 10px 24px -10px rgba(15,23,42,0.2)' }}>
                                <FileText size={20} color="#475569" />
                            </div>
                            <p className="text-slate-600 text-sm font-medium">No assets yet</p>
                            <Link href="/dashboard/industries" className="text-xs text-slate-400 hover:text-slate-600 mt-1.5 block transition-colors">Go to an industry to upload →</Link>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {recentAssets.map((a: any) => (
                                <Link key={a.id} href={`/dashboard/assets/${a.id}`}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-all duration-300 group hover:shadow-sm">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                                        style={{ background: 'linear-gradient(145deg, #f8fafc, #eef1f6)' }}>
                                        <FileText size={13} color="#475569" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-700 truncate">{a.title}</p>
                                        <p className="text-xs text-slate-400">{a.assetType?.replace(/_/g, ' ')} · {a.industries?.[0]?.industry?.name || '—'}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                                        a.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600' :
                                        a.status === 'ARCHIVED' ? 'bg-slate-100 text-slate-400' : 'bg-amber-50 text-amber-600'}`}>
                                        {a.status}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div className="space-y-5">
                    {/* Asset status */}
                    <div onMouseMove={glow}
                        className="pp-reveal pp-card rounded-2xl p-5 bg-white/85"
                        style={{ ...glassCard, animationDelay: '0.58s' }}>
                        <h2 className="font-semibold text-slate-900 tracking-tight mb-4">Asset Status</h2>
                        <div className="space-y-3">
                            {[
                                { label: 'Published', value: stats?.publishedAssets ?? 0, color: '#10b981', bg: 'rgba(16,185,129,0.06)', icon: CheckCircle },
                                { label: 'Draft', value: stats?.draftAssets ?? 0, color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', icon: FileText },
                                { label: 'Archived', value: stats?.archivedAssets ?? 0, color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', icon: Archive },
                            ].map(s => {
                                const Icon = s.icon;
                                return (
                                    <div key={s.label} className="flex items-center gap-3 p-2.5 rounded-xl transition-transform duration-300 hover:translate-x-0.5"
                                        style={{ background: s.bg }}>
                                        <Icon size={13} color={s.color} />
                                        <p className="text-sm flex-1 font-medium" style={{ color: s.color }}>{s.label}</p>
                                        <p className="text-base font-semibold" style={{ color: s.color }}>{loading ? '…' : s.value}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>

            {/* Partner ecosystem */}
            <div className="grid grid-cols-3 gap-5 mb-5">
                <div onMouseMove={glow}
                    className="pp-reveal pp-card pp-lift rounded-2xl p-5 bg-white/85"
                    style={{ ...glassCard, animationDelay: '0.66s' }}>
                    <div className="flex items-center gap-2 mb-4">
                        <Handshake size={15} color="#475569" />
                        <h2 className="font-semibold text-slate-900 tracking-tight">Partners</h2>
                        <Link href="/dashboard/partners" className="text-xs font-medium text-slate-500 hover:text-slate-900 ml-auto transition-colors duration-300">Manage →</Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <MiniStat label="Total" value={platformStats?.partners?.total} />
                        <MiniStat label="Pending" value={platformStats?.partners?.pending} color="#f59e0b" />
                        <MiniStat label="Approved" value={platformStats?.partners?.approved} color="#10b981" />
                        <MiniStat label="Rejected" value={platformStats?.partners?.rejected} color="#ef4444" />
                    </div>
                </div>

                <div onMouseMove={glow}
                    className="pp-reveal pp-card pp-lift rounded-2xl p-5 bg-white/85"
                    style={{ ...glassCard, animationDelay: '0.72s' }}>
                    <div className="flex items-center gap-2 mb-4">
                        <Hourglass size={15} color="#475569" />
                        <h2 className="font-semibold text-slate-900 tracking-tight">Solutions</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <MiniStat label="Internal" value={platformStats?.solutions?.internal} />
                        <MiniStat label="Partner" value={platformStats?.solutions?.partner} />
                        <MiniStat label="Awaiting Review" value={platformStats?.solutions?.pendingReview} color="#f59e0b" />
                        <MiniStat label="Rejected" value={platformStats?.solutions?.rejected} color="#ef4444" />
                    </div>
                </div>

                <div onMouseMove={glow}
                    className="pp-reveal pp-card pp-lift rounded-2xl p-5 bg-white/85"
                    style={{ ...glassCard, animationDelay: '0.78s' }}>
                    <h2 className="font-semibold text-slate-900 tracking-tight mb-3">Industry Coverage</h2>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {(platformStats?.industryCoverage || []).map((ic: any) => (
                            <div key={ic.name} className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 truncate">{ic.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${
                                    ic.coverage === 'Excellent' ? 'bg-emerald-50 text-emerald-600' :
                                    ic.coverage === 'Good' ? 'bg-indigo-50 text-indigo-600' :
                                    ic.coverage === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {ic.coverage}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recently Viewed */}
            {recentlyViewed.length > 0 && (
                <div onMouseMove={glow}
                    className="pp-reveal pp-card rounded-2xl p-6 bg-white/85"
                    style={{ ...glassCard, animationDelay: '0.84s' }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Clock size={14} color="#94a3b8" />
                            <h2 className="font-semibold text-slate-900 tracking-tight">Recently Viewed</h2>
                        </div>
                        <button onClick={() => { localStorage.removeItem('ps_recently_viewed'); setRecentlyViewed([]); }}
                            className="text-xs text-slate-300 hover:text-slate-500 transition-colors duration-300">Clear</button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                        {recentlyViewed.map((item: any) => (
                            <Link key={item.id} href={`/dashboard/assets/${item.id}`}
                                className="pp-lift shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/90 transition-all duration-300 min-w-[200px] hover:shadow-md"
                                style={{ border: '1px solid rgba(15,23,42,0.06)' }}>
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: 'linear-gradient(145deg, #f8fafc, #eef1f6)' }}>
                                    <FileText size={13} color="#475569" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-700 truncate max-w-[130px]">{item.title}</p>
                                    <p className="text-xs text-slate-400">{item.assetType?.replace(/_/g, ' ')}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function MiniStat({ label, value, color = '#334155' }: { label: string; value?: number; color?: string }) {
    return (
        <div>
            <p className="text-lg font-semibold tracking-tight" style={{ color }}>{value ?? '…'}</p>
            <p className="text-xs text-slate-400">{label}</p>
        </div>
    );
}
