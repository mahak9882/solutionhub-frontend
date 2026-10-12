'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Circle, FileText, Trash2, Upload, User } from 'lucide-react';
import api from '@/lib/axios';
import { useCardGlow } from '../premium';

type DocSpec = { type: string; label: string; hint: string };

const GROUPS: { title: string; tone: string; docs: DocSpec[] }[] = [
    {
        title: 'Mandatory',
        tone: '#0f172a',
        docs: [
            { type: 'COMPANY_OVERVIEW', label: 'Company Overview Deck', hint: 'Who you are and what you do' },
            { type: 'SOLUTION_BRIEF', label: 'Solution Briefs & Demo Decks', hint: 'One per solution being registered' },
            { type: 'CASE_STUDY', label: 'Reference Case Studies', hint: '1–2 studies — anonymised is acceptable' },
        ],
    },
    {
        title: 'Strongly Recommended',
        tone: '#475569',
        docs: [
            { type: 'DEMO', label: 'Recorded Demo', hint: '15–20 minutes, or live demo environment details' },
            { type: 'LOGO', label: 'Hi-res Company Logo', hint: 'For co-marketing use' },
            { type: 'CERTIFICATION', label: 'Certifications', hint: 'SOC2, ISO 27001, HIPAA, or industry-specific' },
        ],
    },
    {
        title: 'Optional',
        tone: '#94a3b8',
        docs: [
            { type: 'RECOGNITION', label: 'Analyst Recognition, Awards & Press', hint: 'Anything that builds credibility' },
            { type: 'FINANCIAL_OVERVIEW', label: 'Financial Overview', hint: 'For startups seeking deeper co-build engagement' },
        ],
    },
];

const glassCard = {
    border: '1px solid rgba(15,23,42,0.06)',
    boxShadow: '0 20px 50px -24px rgba(15,23,42,0.18), 0 1px 0 rgba(255,255,255,0.9) inset',
};

const inputCls = "pp-input w-full px-4 py-3 bg-white/90 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";
const inputStyle = { border: '1px solid rgba(15,23,42,0.08)' };

function DocRow({ spec, docs, partner, onUpload, onDelete, busy }: {
    spec: DocSpec;
    docs: any[];
    partner: any;
    onUpload: (type: string, file: File) => void;
    onDelete: (docId: string) => void;
    busy: boolean;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    // The logo counts as provided if it was uploaded at application time too.
    const provided = docs.length > 0 || (spec.type === 'LOGO' && !!partner?.logoUrl);

    return (
        <div className="py-4 first:pt-0 last:pb-0" style={{ borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                    {provided
                        ? <CheckCircle2 size={17} color="#10b981" className="mt-0.5 shrink-0" />
                        : <Circle size={17} color="#cbd5e1" className="mt-0.5 shrink-0" />}
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{spec.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{spec.hint}</p>
                        {spec.type === 'LOGO' && partner?.logoUrl && docs.length === 0 && (
                            <p className="text-xs text-emerald-600 mt-1">Provided with your application</p>
                        )}
                        {docs.length > 0 && (
                            <div className="mt-2 space-y-1.5">
                                {docs.map(d => (
                                    <div key={d.id} className="flex items-center gap-2">
                                        <FileText size={12} color="#475569" className="shrink-0" />
                                        <a href={d.url} target="_blank" rel="noopener noreferrer"
                                            className="text-xs font-medium text-slate-600 hover:text-indigo-600 hover:underline truncate max-w-[280px] transition-colors">
                                            {d.fileName || 'Document'}
                                        </a>
                                        <button onClick={() => onDelete(d.id)} disabled={busy}
                                            className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="shrink-0">
                    <input ref={fileRef} type="file" className="hidden"
                        accept={spec.type === 'LOGO' ? 'image/*' : undefined}
                        onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) onUpload(spec.type, f);
                            e.target.value = '';
                        }} />
                    <button onClick={() => fileRef.current?.click()} disabled={busy}
                        className="pp-chip inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 disabled:opacity-50"
                        style={{ border: '1px solid rgba(15,23,42,0.1)' }}>
                        <Upload size={12} />
                        Upload
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PartnerDocumentsPage() {
    const glow = useCardGlow();
    const [partner, setPartner] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [contact, setContact] = useState({ contactPerson: '', contactDesignation: '', contactPhone: '' });
    const [contactSaved, setContactSaved] = useState(false);

    const load = () => {
        api.get('/api/partners/me').then(r => {
            const p = r.data?.data ?? null;
            setPartner(p);
            if (p) {
                setContact({
                    contactPerson: p.contactPerson || '',
                    contactDesignation: p.contactDesignation || '',
                    contactPhone: p.contactPhone || '',
                });
            }
        }).catch(() => {}).finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const upload = async (docType: string, file: File) => {
        setBusy(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('docType', docType);
            await api.post('/api/partners/me/documents', fd);
            load();
        } catch {
            alert('Upload failed. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    const remove = async (docId: string) => {
        setBusy(true);
        try {
            await api.delete(`/api/partners/me/documents/${docId}`);
            load();
        } catch {
            alert('Could not remove the document.');
        } finally {
            setBusy(false);
        }
    };

    const saveContact = async () => {
        setBusy(true);
        setContactSaved(false);
        try {
            await api.patch('/api/partners/me/contact', contact);
            setContactSaved(true);
            load();
        } catch {
            alert('Could not save contact details.');
        } finally {
            setBusy(false);
        }
    };

    const docsByType = (type: string) => (partner?.documents || []).filter((d: any) => d.docType === type);
    const contactComplete = !!(contact.contactPerson && contact.contactDesignation && contact.contactPhone && partner?.contactEmail);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
                <div className="pp-spinner" />
                <p className="text-xs font-medium tracking-[0.2em] uppercase text-slate-400">Loading</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-10">
                <p className="pp-reveal text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 mb-4"
                    style={{ animationDelay: '0.05s' }}>
                    Profile Workspace
                </p>
                <h1 className="pp-reveal text-[38px] font-semibold tracking-tight text-slate-900 leading-[1.1]"
                    style={{ animationDelay: '0.12s' }}>
                    Your{' '}
                    <span style={{
                        background: 'linear-gradient(100deg, #0f172a 10%, #475569 45%, #6366f1 90%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        Documents
                    </span>
                </h1>
                <p className="pp-reveal text-sm text-slate-500 mt-3 max-w-lg leading-relaxed" style={{ animationDelay: '0.2s' }}>
                    Complete your partner profile. Our team reviews these before your profile goes live to the AIONOS sales and solutions teams.
                </p>
            </div>

            <div className="space-y-6">
                {GROUPS.map((group, gi) => (
                    <div key={group.title} onMouseMove={glow}
                        className="pp-reveal pp-card rounded-2xl p-6 bg-white/85"
                        style={{ ...glassCard, animationDelay: `${0.26 + gi * 0.08}s` }}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-4" style={{ color: group.tone }}>
                            {group.title}
                        </p>
                        <div>
                            {group.docs.map(spec => (
                                <DocRow key={spec.type} spec={spec} docs={docsByType(spec.type)} partner={partner}
                                    onUpload={upload} onDelete={remove} busy={busy} />
                            ))}
                        </div>
                    </div>
                ))}

                {/* Named partner contact card — mandatory */}
                <div onMouseMove={glow}
                    className="pp-reveal pp-card rounded-2xl p-6 bg-white/85"
                    style={{ ...glassCard, animationDelay: '0.5s' }}>
                    <div className="flex items-center gap-2.5 mb-1">
                        {contactComplete
                            ? <CheckCircle2 size={17} color="#10b981" />
                            : <Circle size={17} color="#cbd5e1" />}
                        <p className="text-sm font-semibold text-slate-800">Named Partner Contact Card</p>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 ml-auto">Mandatory</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-5 ml-[27px]">The person AIONOS teams reach out to for opportunities</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">Name</label>
                            <input value={contact.contactPerson} onChange={e => setContact(c => ({ ...c, contactPerson: e.target.value }))}
                                className={inputCls} style={inputStyle} />
                        </div>
                        <div>
                            <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">Title</label>
                            <input value={contact.contactDesignation} onChange={e => setContact(c => ({ ...c, contactDesignation: e.target.value }))}
                                placeholder="e.g. VP Partnerships" className={inputCls} style={inputStyle} />
                        </div>
                        <div>
                            <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">Email</label>
                            <input value={partner?.contactEmail || ''} disabled
                                className={`${inputCls} opacity-60 cursor-not-allowed`} style={inputStyle} />
                        </div>
                        <div>
                            <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">Phone</label>
                            <input value={contact.contactPhone} onChange={e => setContact(c => ({ ...c, contactPhone: e.target.value }))}
                                placeholder="+91 …" className={inputCls} style={inputStyle} />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-5">
                        <button onClick={saveContact} disabled={busy}
                            className="pp-btn inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-60"
                            style={{
                                background: 'linear-gradient(160deg, #1e293b, #0f172a)',
                                boxShadow: '0 14px 30px -12px rgba(15,23,42,0.5), 0 1px 0 rgba(255,255,255,0.12) inset',
                            }}>
                            <span className="pp-btn-sweep" />
                            <User size={13} style={{ color: '#a5b4fc' }} />
                            Save Contact Card
                        </button>
                        {contactSaved && <span className="text-xs font-medium text-emerald-600">Saved</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
