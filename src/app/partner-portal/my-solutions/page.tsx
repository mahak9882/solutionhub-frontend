'use client';

import { useEffect, useState } from 'react';
import { Search, FolderOpen, FileText } from 'lucide-react';
import api from '@/lib/axios';
import { useCardGlow } from '../premium';

const TABS = [
    { key: '', label: 'All' },
    { key: 'PENDING_REVIEW', label: 'Pending' },
    { key: 'PUBLISHED', label: 'Approved' },
    { key: 'REJECTED', label: 'Rejected' },
];

const STATUS_META: Record<string, { badge: string; dot: string; label?: string }> = {
    DRAFT: { badge: 'bg-slate-100 text-slate-500', dot: '#94a3b8' },
    PENDING_REVIEW: { badge: 'bg-amber-50 text-amber-600', dot: '#f59e0b', label: 'PENDING REVIEW' },
    PUBLISHED: { badge: 'bg-emerald-50 text-emerald-600', dot: '#10b981', label: 'APPROVED' },
    REJECTED: { badge: 'bg-red-50 text-red-500', dot: '#ef4444' },
    ARCHIVED: { badge: 'bg-slate-100 text-slate-400', dot: '#cbd5e1' },
};

export default function PartnerMySolutionsPage() {
    const glow = useCardGlow();
    const [assets, setAssets] = useState<any[]>([]);
    const [tab, setTab] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        api.get('/api/assets', { params: { mine: 'true', ...(tab ? { status: tab } : {}) } })
            .then(r => setAssets(r.data.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [tab]);

    const visibleAssets = search.trim()
        ? assets.filter(a => a.title?.toLowerCase().includes(search.toLowerCase()))
        : assets;

    return (
        <div>
            <div className="mb-10">
                <p className="pp-reveal text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 mb-4"
                    style={{ animationDelay: '0.05s' }}>
                    Your Submissions
                </p>
                <h1 className="pp-reveal text-[38px] font-semibold tracking-tight text-slate-900 leading-[1.1]"
                    style={{ animationDelay: '0.12s' }}>
                    My{' '}
                    <span style={{
                        background: 'linear-gradient(100deg, #0f172a 10%, #475569 45%, #6366f1 90%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        Solutions
                    </span>
                </h1>
                <p className="pp-reveal text-sm text-slate-500 mt-3 leading-relaxed" style={{ animationDelay: '0.2s' }}>
                    Everything you've submitted, and its review status — only you can see this.
                </p>
            </div>

            <div className="pp-reveal flex items-center justify-between gap-3 mb-6 flex-wrap" style={{ animationDelay: '0.26s' }}>
                <div className="flex gap-1 p-1 rounded-xl bg-white/85"
                    style={{ border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 6px 20px -10px rgba(15,23,42,0.1)' }}>
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className="pp-chip px-4 py-1.5 rounded-lg text-sm font-medium"
                            style={tab === t.key
                                ? {
                                    background: 'linear-gradient(160deg, #1e293b, #0f172a)',
                                    color: '#fff',
                                    boxShadow: '0 8px 18px -8px rgba(15,23,42,0.5), 0 1px 0 rgba(255,255,255,0.12) inset',
                                }
                                : { color: '#64748b' }}>
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title…"
                        className="pp-input pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white/90 w-60 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400"
                        style={{ border: '1px solid rgba(15,23,42,0.08)' }} />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                    <div className="pp-spinner" />
                    <p className="text-xs font-medium tracking-[0.2em] uppercase text-slate-400">Loading</p>
                </div>
            ) : visibleAssets.length === 0 ? (
                <div className="pp-reveal pp-card rounded-3xl p-16 text-center bg-white/85"
                    style={{ boxShadow: '0 32px 80px -30px rgba(15,23,42,0.18)', border: '1px solid rgba(15,23,42,0.06)' }}
                    onMouseMove={glow}>
                    <div className="pp-float w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(145deg, #ffffff, #eef1f6)', boxShadow: '0 12px 28px -12px rgba(15,23,42,0.2)' }}>
                        <FolderOpen size={21} color="#475569" />
                    </div>
                    <p className="text-slate-800 text-sm font-semibold">Nothing here yet</p>
                    <p className="text-slate-400 text-xs mt-1.5">Solutions you submit will show up here with their review status.</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {visibleAssets.map((a, i) => {
                        const meta = STATUS_META[a.status] || { badge: 'bg-slate-100 text-slate-500', dot: '#94a3b8' };
                        return (
                            <div key={a.id}
                                onMouseMove={glow}
                                className="pp-reveal pp-card pp-lift group flex items-center justify-between px-5 py-4 rounded-2xl bg-white/85"
                                style={{
                                    animationDelay: `${0.3 + Math.min(i, 8) * 0.06}s`,
                                    border: '1px solid rgba(15,23,42,0.06)',
                                    boxShadow: '0 6px 20px -12px rgba(15,23,42,0.12)',
                                }}>
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                                        style={{ background: 'linear-gradient(145deg, #ffffff, #eef1f6)', boxShadow: '0 6px 16px -8px rgba(15,23,42,0.18), 0 1px 0 rgba(255,255,255,0.9) inset' }}>
                                        <FileText size={15} color="#475569" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-slate-800 text-sm truncate">{a.title}</p>
                                        {a.status === 'REJECTED' && a.rejectionReason && (
                                            <p className="text-xs text-red-500 mt-0.5">Reason: {a.rejectionReason}</p>
                                        )}
                                    </div>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full font-semibold shrink-0 ${meta.badge}`}>
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
                                    {(meta.label || a.status).replace('_', ' ')}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
