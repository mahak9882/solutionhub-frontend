'use client';

import { useEffect, useState } from 'react';
import { X, Search, CheckCircle2, Circle, FileText, Globe, MapPin, Mail, Phone, User, Briefcase } from 'lucide-react';
import api from '@/lib/axios';
import { useCardGlow } from '@/app/partner-portal/premium';

const STATUS_STYLES: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-600',
    INFO_REQUESTED: 'bg-sky-50 text-sky-600',
    HOLD: 'bg-slate-100 text-slate-500',
    APPROVED: 'bg-emerald-50 text-emerald-600',
    REJECTED: 'bg-red-50 text-red-500',
    SUSPENDED: 'bg-slate-100 text-slate-500',
    ARCHIVED: 'bg-slate-100 text-slate-400',
};

const GEOGRAPHY_OPTIONS = [
    'India', 'Middle East (GCC)', 'Southeast Asia', 'Japan',
    'Australia & New Zealand', 'Europe', 'North America', 'Other',
];

const SOLUTION_CATEGORY_OPTIONS = [
    'Data & Analytics', 'AI & Machine Learning', 'Martech', 'Customer Experience (CX)',
    'Cybersecurity', 'Enterprise Software', 'Cloud & Infrastructure', 'Other',
];

const TIER_OPTIONS = ['COMMUNITY', 'REGISTERED', 'PREFERRED'];
const PARTNERSHIP_TYPE_OPTIONS = ['Co-sell', 'Co-build', 'Referral', 'Delivery'];
const DIRECTORY_CATEGORY_OPTIONS = [
    { value: 'SOLUTIONS_PARTNER', label: 'Solutions Partner' },
    { value: 'ALLIANCE', label: 'Alliance' },
];

const tierBadgeStyle = (tier: string): React.CSSProperties =>
    tier === 'PREFERRED'
        ? { background: 'linear-gradient(160deg, #1e293b, #0f172a)', color: '#e0e7ff' }
        : tier === 'REGISTERED'
        ? { background: '#eef2ff', color: '#4f46e5' }
        : { background: '#f1f5f9', color: '#64748b' };

const DOC_TYPE_LABELS: Record<string, string> = {
    COMPANY_OVERVIEW: 'Company Overview Deck',
    SOLUTION_BRIEF: 'Solution Briefs & Demo Decks',
    CASE_STUDY: 'Reference Case Studies',
    DEMO: 'Recorded Demo',
    LOGO: 'Company Logo',
    CERTIFICATION: 'Certifications',
    RECOGNITION: 'Recognition, Awards & Press',
    FINANCIAL_OVERVIEW: 'Financial Overview',
};

const MANDATORY_DOC_TYPES = ['COMPANY_OVERVIEW', 'SOLUTION_BRIEF', 'CASE_STUDY'];
const OTHER_DOC_TYPES = ['DEMO', 'LOGO', 'CERTIFICATION', 'RECOGNITION', 'FINANCIAL_OVERVIEW'];

const glassCard = {
    border: '1px solid rgba(15,23,42,0.06)',
    boxShadow: '0 20px 50px -24px rgba(15,23,42,0.18), 0 1px 0 rgba(255,255,255,0.9) inset',
};

const inputStyle = { border: '1px solid rgba(15,23,42,0.08)' };
const inputCls = "pp-input text-sm px-3.5 py-2.5 rounded-xl bg-white/90 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";

const selectedChipStyle = {
    background: 'linear-gradient(160deg, #1e293b, #0f172a)',
    boxShadow: '0 8px 18px -8px rgba(15,23,42,0.5), 0 1px 0 rgba(255,255,255,0.12) inset',
};
const chipCls = (selected: boolean) =>
    `pp-chip px-3.5 py-1.5 rounded-full text-xs font-medium border ${
        selected ? 'text-white border-transparent' : 'bg-white/90 text-slate-600 hover:text-slate-900'
    }`;
const chipBorder = (selected: boolean) =>
    selected ? selectedChipStyle : { borderColor: 'rgba(15,23,42,0.1)' };

// A partner is a full Partner (vs in-pipeline) once approved AND their documents
// have passed QC (profile live in the staff directory).
const isFullPartner = (p: any) => p.status === 'APPROVED' && !!p.profileLiveAt;

function PendingSolutions() {
    const glow = useCardGlow();
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState('');

    const load = () => {
        setLoading(true);
        api.get('/api/assets', { params: { status: 'PENDING_REVIEW' } })
            .then(r => setAssets(r.data.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const act = async (id: string, action: 'publish' | 'reject') => {
        setBusyId(id);
        try {
            const reason = action === 'reject' ? window.prompt('Reason for declining (optional):') || undefined : undefined;
            await api.patch(`/api/assets/${id}/${action}`, action === 'reject' ? { reason } : {});
            load();
        } catch {
            alert('Action failed');
        } finally {
            setBusyId('');
        }
    };

    if (loading) return null;
    if (assets.length === 0) return null;

    return (
        <div className="pp-reveal mb-8" style={{ animationDelay: '0.1s' }}>
            <h2 className="font-semibold text-slate-900 tracking-tight mb-3">Solutions Awaiting Review</h2>
            <div onMouseMove={glow} className="pp-card rounded-2xl divide-y bg-white/85"
                style={{ ...glassCard, borderColor: 'rgba(15,23,42,0.06)' }}>
                {assets.map(a => (
                    <div key={a.id} className="px-5 py-3.5 flex items-center justify-between" style={{ borderColor: 'rgba(15,23,42,0.05)' }}>
                        <div>
                            <p className="font-medium text-slate-700 text-sm">{a.title}</p>
                            <p className="text-xs text-slate-400">{a.assetType?.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="flex gap-2">
                            <button disabled={busyId === a.id} onClick={() => act(a.id, 'publish')}
                                className="pp-chip px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium hover:bg-emerald-100 disabled:opacity-50">
                                Approve
                            </button>
                            <button disabled={busyId === a.id} onClick={() => act(a.id, 'reject')}
                                className="pp-chip px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 disabled:opacity-50">
                                Decline
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Field({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{label}</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{value}</p>
        </div>
    );
}

function InfoRow({ icon: Icon, value, href }: { icon: any; value?: string | null; href?: string }) {
    if (!value) return null;
    return (
        <div className="flex items-center gap-2.5 min-w-0">
            <Icon size={13} color="#94a3b8" className="shrink-0" />
            {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-700 hover:text-indigo-600 hover:underline truncate transition-colors">{value}</a>
            ) : (
                <p className="text-sm text-slate-700 truncate">{value}</p>
            )}
        </div>
    );
}

function TagGroup({ label, items }: { label: string; items?: string[] }) {
    if (!items || items.length === 0) return null;
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">{label}</p>
            <div className="flex flex-wrap gap-1.5">
                {items.map(t => (
                    <span key={t} className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 font-medium"
                        style={{ border: '1px solid rgba(15,23,42,0.06)' }}>
                        {t}
                    </span>
                ))}
            </div>
        </div>
    );
}

type Action = 'approve' | 'reject' | 'request-info' | 'hold' | 'nda-approve' | 'nda-sign';
const ACTIONABLE_STATUSES = ['PENDING', 'INFO_REQUESTED', 'HOLD'];

// Full NDA-aware action set — used only in the detailed drawer
function ActionButtons({ partner, busy, onAct }: { partner: any; busy: boolean; onAct: (id: string, action: Action) => void }) {
    if (!ACTIONABLE_STATUSES.includes(partner.status)) return null;
    return (
        <>
            {!partner.ndaApprovedAt ? (
                <button disabled={busy} onClick={() => onAct(partner.id, 'nda-approve')}
                    className="pp-chip px-3 py-1.5 rounded-lg text-white text-xs font-medium disabled:opacity-50"
                    style={selectedChipStyle}>
                    NDA Approved
                </button>
            ) : !partner.ndaSignedAt ? (
                <button disabled={busy} onClick={() => onAct(partner.id, 'nda-sign')}
                    className="pp-chip px-3 py-1.5 rounded-lg text-white text-xs font-medium disabled:opacity-50"
                    style={selectedChipStyle}>
                    NDA Signed
                </button>
            ) : (
                <button disabled={busy} onClick={() => onAct(partner.id, 'approve')}
                    className="pp-chip px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium hover:bg-emerald-100 disabled:opacity-50">
                    Give Portal Access
                </button>
            )}
            <button disabled={busy} onClick={() => onAct(partner.id, 'request-info')}
                className="pp-chip px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 text-xs font-medium hover:bg-sky-100 disabled:opacity-50">
                Request Info
            </button>
            <button disabled={busy} onClick={() => onAct(partner.id, 'hold')}
                className="pp-chip px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium hover:bg-slate-200 disabled:opacity-50">
                Hold
            </button>
            <button disabled={busy} onClick={() => onAct(partner.id, 'reject')}
                className="pp-chip px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 disabled:opacity-50">
                Decline
            </button>
        </>
    );
}

// Lightweight action set for the table row — NDA/access-granting steps only live in the drawer
function QuickActions({ partner, busy, onAct }: { partner: any; busy: boolean; onAct: (id: string, action: Action) => void }) {
    if (!ACTIONABLE_STATUSES.includes(partner.status)) return null;
    return (
        <>
            <button disabled={busy} onClick={() => onAct(partner.id, 'request-info')}
                className="pp-chip px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 text-xs font-medium hover:bg-sky-100 disabled:opacity-50">
                Request Info
            </button>
            <button disabled={busy} onClick={() => onAct(partner.id, 'hold')}
                className="pp-chip px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium hover:bg-slate-200 disabled:opacity-50">
                Hold
            </button>
            <button disabled={busy} onClick={() => onAct(partner.id, 'reject')}
                className="pp-chip px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 disabled:opacity-50">
                Decline
            </button>
        </>
    );
}

const DRAWER_TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'application', label: 'Application' },
    { key: 'documents', label: 'Documents' },
    { key: 'manage', label: 'Manage' },
];

function TimelineRow({ label, date, done }: { label: string; date?: string | null; done: boolean }) {
    return (
        <div className="flex items-center gap-3">
            {done ? <CheckCircle2 size={15} color="#10b981" className="shrink-0" /> : <Circle size={15} color="#cbd5e1" className="shrink-0" />}
            <p className={`text-sm flex-1 ${done ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{label}</p>
            <p className={`text-xs ${done ? 'text-slate-500' : 'text-slate-300'}`}>
                {done && date ? new Date(date).toLocaleDateString() : 'Pending'}
            </p>
        </div>
    );
}

function PartnerDrawer({ partner, onClose, onAct, onMeta, onProfileLive, onArchive, onDelete, busy }: {
    partner: any;
    onClose: () => void;
    onAct: (id: string, action: Action) => void;
    onMeta: (id: string, payload: any) => void;
    onProfileLive: (id: string, live: boolean) => void;
    onArchive: (id: string, archived: boolean) => void;
    onDelete: (id: string, name: string) => void;
    busy: boolean;
}) {
    const [tab, setTab] = useState('overview');
    const [ownerInput, setOwnerInput] = useState(partner.relationshipOwner || '');

    useEffect(() => {
        setOwnerInput(partner.relationshipOwner || '');
        setTab('overview');
    }, [partner.id]);

    useEffect(() => { setOwnerInput(partner.relationshipOwner || ''); }, [partner.relationshipOwner]);

    const togglePartnershipType = (t: string) => {
        const current: string[] = partner.partnershipTypes || [];
        const next = current.includes(t) ? current.filter(x => x !== t) : [...current, t];
        onMeta(partner.id, { partnershipTypes: next });
    };

    const docs: any[] = partner.documents || [];
    const docsByType = (type: string) => docs.filter(d => d.docType === type);
    const contactCardComplete = !!(partner.contactPerson && partner.contactDesignation && partner.contactEmail && partner.contactPhone);

    const sectionCard = "rounded-2xl p-5 bg-slate-50/60";
    const sectionStyle = { border: '1px solid rgba(15,23,42,0.05)' };

    return (
        <div className="fixed inset-0 z-[9999] flex justify-end">
            <div className="pp-fade absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]" onClick={onClose} />
            <div className="pp-drawer relative w-full max-w-lg h-full bg-white flex flex-col"
                style={{ boxShadow: '-24px 0 80px -20px rgba(15,23,42,0.35)', borderLeft: '1px solid rgba(15,23,42,0.06)' }}>

                {/* Header */}
                <div className="px-6 pt-5 pb-0 bg-white" style={{ borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                            {partner.logoUrl ? (
                                <img src={partner.logoUrl} alt="" className="w-12 h-12 rounded-xl object-contain bg-white shrink-0"
                                    style={{ border: '1px solid rgba(15,23,42,0.08)' }} />
                            ) : (
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-slate-400 font-semibold"
                                    style={{ background: 'linear-gradient(145deg, #f8fafc, #eef1f6)', border: '1px solid rgba(15,23,42,0.06)' }}>
                                    {partner.companyName?.charAt(0) || '?'}
                                </div>
                            )}
                            <div className="min-w-0">
                                <h2 className="font-semibold text-slate-900 tracking-tight text-lg truncate">{partner.companyName}</h2>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[partner.status] || 'bg-slate-100 text-slate-500'}`}>
                                        {partner.status.replace('_', ' ')}
                                    </span>
                                    {partner.status === 'APPROVED' && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={tierBadgeStyle(partner.tier)}>
                                            {(partner.tier || 'COMMUNITY').charAt(0) + (partner.tier || 'COMMUNITY').slice(1).toLowerCase()}
                                        </span>
                                    )}
                                    {isFullPartner(partner) && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-600">
                                            Live
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors duration-300 shrink-0">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1">
                        {DRAWER_TABS.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className="px-3.5 py-2 text-sm font-medium transition-colors duration-200 relative"
                                style={{ color: tab === t.key ? '#0f172a' : '#94a3b8' }}>
                                {t.label}
                                {tab === t.key && (
                                    <span className="absolute left-3 right-3 bottom-0 h-0.5 rounded-full"
                                        style={{ background: 'linear-gradient(90deg, #1e293b, #6366f1)' }} />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {(partner.status === 'REJECTED' || partner.status === 'INFO_REQUESTED') && partner.rejectionReason && (
                        <div className="rounded-xl px-4 py-3 text-sm"
                            style={{ background: partner.status === 'REJECTED' ? 'rgba(239,68,68,0.06)' : 'rgba(14,165,233,0.06)', border: '1px solid rgba(15,23,42,0.06)' }}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                                {partner.status === 'REJECTED' ? 'Decline Reason' : 'Info Requested'}
                            </p>
                            <p className="text-slate-700">{partner.rejectionReason}</p>
                        </div>
                    )}

                    {tab === 'overview' && (
                        <>
                            <div className={sectionCard} style={sectionStyle}>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Contact</p>
                                <div className="space-y-2.5">
                                    <InfoRow icon={User} value={partner.contactPerson ? `${partner.contactPerson}${partner.contactDesignation ? ` · ${partner.contactDesignation}` : ''}` : null} />
                                    <InfoRow icon={Mail} value={partner.contactEmail} href={`mailto:${partner.contactEmail}`} />
                                    <InfoRow icon={Phone} value={partner.contactPhone} />
                                    <InfoRow icon={Globe} value={partner.website} href={partner.website?.startsWith('http') ? partner.website : `https://${partner.website}`} />
                                    <InfoRow icon={MapPin} value={partner.hqLocation} />
                                    <InfoRow icon={Briefcase} value={partner.companySize ? `${partner.companySize} people` : null} />
                                </div>
                            </div>

                            {partner.description && (
                                <div className={sectionCard} style={sectionStyle}>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Solution Description</p>
                                    <p className="text-sm text-slate-700 leading-relaxed">{partner.description}</p>
                                </div>
                            )}

                            <div className={`${sectionCard} space-y-4`} style={sectionStyle}>
                                <TagGroup label="Solution Category" items={partner.solutionCategories} />
                                <TagGroup label="Industries Deployed In" items={partner.industriesServed} />
                                <TagGroup label="Geographies Served" items={partner.geographiesServed} />
                                <TagGroup label="Technology Expertise" items={partner.technologyExpertise} />
                            </div>

                            <div className={sectionCard} style={sectionStyle}>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Journey</p>
                                <div className="space-y-2.5">
                                    <TimelineRow label="Applied" date={partner.createdAt} done={!!partner.createdAt} />
                                    <TimelineRow label="NDA Approved" date={partner.ndaApprovedAt} done={!!partner.ndaApprovedAt} />
                                    <TimelineRow label="NDA Signed" date={partner.ndaSignedAt} done={!!partner.ndaSignedAt} />
                                    <TimelineRow label="Portal Access Granted" date={partner.reviewedAt} done={partner.status === 'APPROVED' && !!partner.reviewedAt} />
                                    <TimelineRow label="Documents Approved — Profile Live" date={partner.profileLiveAt} done={!!partner.profileLiveAt} />
                                </div>
                            </div>
                        </>
                    )}

                    {tab === 'application' && (
                        <div className={`${sectionCard} space-y-4`} style={sectionStyle}>
                            <Field label="Reference Clients" value={partner.existingCustomers} />
                            <Field label="Number of Enterprise Deployments" value={partner.enterpriseDeployments} />
                            <Field label="Worked with an SI/Consulting Firm?" value={partner.workedWithSI === true ? `Yes${partner.siDetails ? ` — ${partner.siDetails}` : ''}` : partner.workedWithSI === false ? 'No' : undefined} />
                            <Field label="How They Heard About Us" value={partner.hearAboutUs} />
                            <Field label="Referred By" value={partner.referredBy} />
                            <Field label="Partnership Goal" value={partner.partnershipGoal} />
                            <Field label="Expected Contribution Volume" value={partner.expectedContributionVolume} />
                            <Field label="Applied On" value={partner.createdAt ? new Date(partner.createdAt).toLocaleString() : undefined} />

                            {partner.supportingDocuments?.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Application Attachments</p>
                                    <div className="space-y-1">
                                        {partner.supportingDocuments.map((url: string, i: number) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                className="block text-sm text-indigo-600 hover:underline truncate">
                                                Attachment {i + 1}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'documents' && (
                        <>
                            <div className={sectionCard} style={sectionStyle}>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Mandatory</p>
                                <div className="space-y-3">
                                    {MANDATORY_DOC_TYPES.map(type => {
                                        const typeDocs = docsByType(type);
                                        return (
                                            <div key={type} className="flex items-start gap-2.5">
                                                {typeDocs.length > 0
                                                    ? <CheckCircle2 size={15} color="#10b981" className="mt-0.5 shrink-0" />
                                                    : <Circle size={15} color="#cbd5e1" className="mt-0.5 shrink-0" />}
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-sm font-medium ${typeDocs.length ? 'text-slate-700' : 'text-slate-400'}`}>{DOC_TYPE_LABELS[type]}</p>
                                                    {typeDocs.map(d => (
                                                        <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline truncate mt-1">
                                                            <FileText size={11} className="shrink-0" /> {d.fileName || 'Document'}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="flex items-start gap-2.5">
                                        {contactCardComplete
                                            ? <CheckCircle2 size={15} color="#10b981" className="mt-0.5 shrink-0" />
                                            : <Circle size={15} color="#cbd5e1" className="mt-0.5 shrink-0" />}
                                        <p className={`text-sm font-medium ${contactCardComplete ? 'text-slate-700' : 'text-slate-400'}`}>Named Partner Contact Card</p>
                                    </div>
                                </div>
                            </div>

                            <div className={sectionCard} style={sectionStyle}>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Recommended & Optional</p>
                                <div className="space-y-3">
                                    {OTHER_DOC_TYPES.map(type => {
                                        const typeDocs = docsByType(type);
                                        const providedViaLogo = type === 'LOGO' && !!partner.logoUrl;
                                        if (typeDocs.length === 0 && !providedViaLogo) return (
                                            <div key={type} className="flex items-center gap-2.5">
                                                <Circle size={15} color="#e2e8f0" className="shrink-0" />
                                                <p className="text-sm text-slate-300">{DOC_TYPE_LABELS[type]}</p>
                                            </div>
                                        );
                                        return (
                                            <div key={type} className="flex items-start gap-2.5">
                                                <CheckCircle2 size={15} color="#10b981" className="mt-0.5 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-slate-700">{DOC_TYPE_LABELS[type]}</p>
                                                    {typeDocs.map(d => (
                                                        <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline truncate mt-1">
                                                            <FileText size={11} className="shrink-0" /> {d.fileName || 'Document'}
                                                        </a>
                                                    ))}
                                                    {providedViaLogo && typeDocs.length === 0 && (
                                                        <p className="text-xs text-slate-400 mt-0.5">Provided with application</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className={`${sectionCard} flex items-center justify-between gap-3`} style={sectionStyle}>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">Documents Approval</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {partner.profileLiveAt
                                            ? `Approved — profile live since ${new Date(partner.profileLiveAt).toLocaleDateString()}`
                                            : 'Hidden from Find a Partner until documents are approved'}
                                    </p>
                                </div>
                                {partner.profileLiveAt ? (
                                    <button disabled={busy} onClick={() => onProfileLive(partner.id, false)}
                                        className="pp-chip px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium hover:bg-slate-200 disabled:opacity-50 shrink-0">
                                        Take Offline
                                    </button>
                                ) : (
                                    <button disabled={busy || partner.status !== 'APPROVED'} onClick={() => onProfileLive(partner.id, true)}
                                        title={partner.status !== 'APPROVED' ? 'Partner must be approved first' : undefined}
                                        className="pp-chip px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium hover:bg-emerald-100 disabled:opacity-50 shrink-0">
                                        Approve Documents
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {tab === 'manage' && (
                        <div className={`${sectionCard} space-y-5`} style={sectionStyle}>
                            <div>
                                <p className="text-[13px] font-medium text-slate-700 mb-1.5">Tier</p>
                                <div className="flex gap-2">
                                    {TIER_OPTIONS.map(t => (
                                        <button key={t} disabled={busy} onClick={() => onMeta(partner.id, { tier: t })}
                                            className="pp-chip flex-1 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-50"
                                            style={partner.tier === t
                                                ? { ...tierBadgeStyle(t), borderColor: 'transparent' }
                                                : { borderColor: 'rgba(15,23,42,0.1)', color: '#64748b', background: '#fff' }}>
                                            {t.charAt(0) + t.slice(1).toLowerCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-[13px] font-medium text-slate-700 mb-1.5">Category</p>
                                <div className="flex gap-2">
                                    {DIRECTORY_CATEGORY_OPTIONS.map(c => (
                                        <button key={c.value} disabled={busy} onClick={() => onMeta(partner.id, { directoryCategory: c.value })}
                                            className="pp-chip flex-1 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-50"
                                            style={partner.directoryCategory === c.value
                                                ? { background: 'linear-gradient(160deg, #1e293b, #0f172a)', color: '#fff', borderColor: 'transparent' }
                                                : { borderColor: 'rgba(15,23,42,0.1)', color: '#64748b', background: '#fff' }}>
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-[13px] font-medium text-slate-700 mb-1.5">Partnership Type</p>
                                <div className="flex flex-wrap gap-2">
                                    {PARTNERSHIP_TYPE_OPTIONS.map(t => (
                                        <button key={t} disabled={busy} onClick={() => togglePartnershipType(t)}
                                            className="pp-chip px-3 py-1.5 rounded-full text-xs font-medium border disabled:opacity-50"
                                            style={(partner.partnershipTypes || []).includes(t)
                                                ? { background: 'linear-gradient(160deg, #1e293b, #0f172a)', color: '#fff', borderColor: 'transparent' }
                                                : { borderColor: 'rgba(15,23,42,0.1)', color: '#64748b', background: '#fff' }}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-[13px] font-medium text-slate-700 mb-1.5">AIONOS Relationship Owner</p>
                                <div className="flex gap-2">
                                    <input value={ownerInput} onChange={e => setOwnerInput(e.target.value)} placeholder="Who owns this relationship?"
                                        className="flex-1 px-3.5 py-2 rounded-lg text-sm bg-white text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-400"
                                        style={{ border: '1px solid rgba(15,23,42,0.1)' }} />
                                    <button disabled={busy || ownerInput === (partner.relationshipOwner || '')}
                                        onClick={() => onMeta(partner.id, { relationshipOwner: ownerInput.trim() })}
                                        className="pp-chip px-3.5 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
                                        style={{ background: 'linear-gradient(160deg, #1e293b, #0f172a)' }}>
                                        Save
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 space-y-3" style={{ borderTop: '1px solid rgba(15,23,42,0.06)' }}>
                                <p className="text-xs font-semibold uppercase tracking-wide text-red-300">Danger Zone</p>
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">{partner.status === 'ARCHIVED' ? 'Restore Partner' : 'Archive Partner'}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {partner.status === 'ARCHIVED'
                                                ? 'Return this partner to Approved status'
                                                : 'Removes portal access and hides them from the directory — reversible'}
                                        </p>
                                    </div>
                                    <button disabled={busy} onClick={() => onArchive(partner.id, partner.status !== 'ARCHIVED')}
                                        className="pp-chip px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 disabled:opacity-50 shrink-0">
                                        {partner.status === 'ARCHIVED' ? 'Restore' : 'Archive'}
                                    </button>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">Delete Partner</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Permanently removes this partner and their documents — cannot be undone</p>
                                    </div>
                                    <button disabled={busy} onClick={() => onDelete(partner.id, partner.companyName)}
                                        className="pp-chip px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 disabled:opacity-50 shrink-0">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sticky footer actions for in-review applications */}
                {ACTIONABLE_STATUSES.includes(partner.status) && (
                    <div className="bg-white p-4 flex gap-2 flex-wrap" style={{ borderTop: '1px solid rgba(15,23,42,0.06)' }}>
                        <ActionButtons partner={partner} busy={busy} onAct={onAct} />
                    </div>
                )}
            </div>
        </div>
    );
}

function FindPartner({ partners }: { partners: any[] }) {
    const glow = useCardGlow();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [industries, setIndustries] = useState('');
    const [tech, setTech] = useState('');
    const [geographies, setGeographies] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [tiers, setTiers] = useState<string[]>([]);
    const [ptypes, setPtypes] = useState<string[]>([]);
    const [dirCats, setDirCats] = useState<string[]>([]);

    const toggleIn = (setter: (fn: (prev: string[]) => string[]) => void) => (v: string) =>
        setter(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
    const toggleGeo = toggleIn(setGeographies);
    const toggleCategory = toggleIn(setCategories);
    const toggleTier = toggleIn(setTiers);
    const togglePtype = toggleIn(setPtypes);
    const toggleDirCat = toggleIn(setDirCats);

    const wantedIndustries = industries.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const wantedTech = tech.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const q = query.trim().toLowerCase();
    const hasScoredCriteria = wantedIndustries.length > 0 || wantedTech.length > 0 || geographies.length > 0 || categories.length > 0;
    const hasCriteria = hasScoredCriteria || tiers.length > 0 || ptypes.length > 0 || dirCats.length > 0 || q.length > 0;

    // Only QC-signed-off (profile live) approved partners surface in the staff directory.
    const scored = partners
        .filter(p => p.status === 'APPROVED' && p.profileLiveAt)
        .filter(p => tiers.length === 0 || tiers.includes(p.tier))
        .filter(p => dirCats.length === 0 || dirCats.includes(p.directoryCategory))
        .filter(p => ptypes.length === 0 || ptypes.some(t => (p.partnershipTypes || []).includes(t)))
        .filter(p => {
            if (!q) return true;
            const haystack = [
                p.companyName, p.description,
                ...(p.technologyExpertise || []), ...(p.industriesServed || []),
                ...(p.solutionCategories || []), ...(p.geographiesServed || []),
                ...(p.partnershipTypes || []),
            ].join(' ').toLowerCase();
            return haystack.includes(q);
        })
        .map(p => {
            const pIndustries = (p.industriesServed || []).map((s: string) => s.toLowerCase());
            const pTech = (p.technologyExpertise || []).map((s: string) => s.toLowerCase());
            const pGeo: string[] = p.geographiesServed || [];
            const pCategories: string[] = p.solutionCategories || [];
            let score = 0;
            score += wantedIndustries.filter(w => pIndustries.some((i: string) => i.includes(w))).length;
            score += wantedTech.filter(w => pTech.some((t: string) => t.includes(w))).length;
            score += geographies.filter(g => pGeo.includes(g)).length;
            score += categories.filter(c => pCategories.includes(c)).length;
            return { partner: p, score };
        })
        .filter(r => !hasScoredCriteria || r.score > 0)
        .sort((a, b) => b.score - a.score);

    return (
        <div className="pp-reveal mb-8" style={{ animationDelay: '0.16s' }}>
            <button onClick={() => setOpen(v => !v)}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-300 mb-3">
                <Search size={15} />
                Find a Partner
            </button>
            {open && (
                <div onMouseMove={glow} className="pp-reveal pp-card rounded-2xl p-6 bg-white/85" style={glassCard}>
                    <div className="mb-4">
                        <div className="relative">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input value={query} onChange={e => setQuery(e.target.value)}
                                placeholder="Free text — company, solution description, any tag…"
                                className={`${inputCls} pl-9 w-full`} style={inputStyle} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-[13px] font-medium text-slate-700 mb-1.5">Industries <span className="text-slate-400 font-normal">(comma separated)</span></p>
                            <input value={industries} onChange={e => setIndustries(e.target.value)} placeholder="Healthcare, BFSI"
                                className={`${inputCls} w-full`} style={inputStyle} />
                        </div>
                        <div>
                            <p className="text-[13px] font-medium text-slate-700 mb-1.5">Technology <span className="text-slate-400 font-normal">(comma separated)</span></p>
                            <input value={tech} onChange={e => setTech(e.target.value)} placeholder="AI, Cloud"
                                className={`${inputCls} w-full`} style={inputStyle} />
                        </div>
                    </div>
                    <div className="mb-4">
                        <p className="text-[13px] font-medium text-slate-700 mb-1.5">Geography</p>
                        <div className="flex flex-wrap gap-2">
                            {GEOGRAPHY_OPTIONS.map(g => (
                                <button key={g} type="button" onClick={() => toggleGeo(g)}
                                    className={chipCls(geographies.includes(g))} style={chipBorder(geographies.includes(g))}>
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mb-4">
                        <p className="text-[13px] font-medium text-slate-700 mb-1.5">Solution Category</p>
                        <div className="flex flex-wrap gap-2">
                            {SOLUTION_CATEGORY_OPTIONS.map(c => (
                                <button key={c} type="button" onClick={() => toggleCategory(c)}
                                    className={chipCls(categories.includes(c))} style={chipBorder(categories.includes(c))}>
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <p className="text-[13px] font-medium text-slate-700 mb-1.5">Tier</p>
                            <div className="flex flex-wrap gap-2">
                                {TIER_OPTIONS.map(t => (
                                    <button key={t} type="button" onClick={() => toggleTier(t)}
                                        className={chipCls(tiers.includes(t))} style={chipBorder(tiers.includes(t))}>
                                        {t.charAt(0) + t.slice(1).toLowerCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-[13px] font-medium text-slate-700 mb-1.5">Partnership Type</p>
                            <div className="flex flex-wrap gap-2">
                                {PARTNERSHIP_TYPE_OPTIONS.map(t => (
                                    <button key={t} type="button" onClick={() => togglePtype(t)}
                                        className={chipCls(ptypes.includes(t))} style={chipBorder(ptypes.includes(t))}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-[13px] font-medium text-slate-700 mb-1.5">Category</p>
                            <div className="flex flex-wrap gap-2">
                                {DIRECTORY_CATEGORY_OPTIONS.map(c => (
                                    <button key={c.value} type="button" onClick={() => toggleDirCat(c.value)}
                                        className={chipCls(dirCats.includes(c.value))} style={chipBorder(dirCats.includes(c.value))}>
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {hasCriteria && (
                        scored.length === 0 ? (
                            <p className="text-sm text-slate-400">No approved partners match these criteria.</p>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Top Matches</p>
                                {scored.slice(0, 5).map(({ partner, score }, i) => (
                                    <div key={partner.id}
                                        className="pp-reveal pp-lift flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/90 transition-all duration-300"
                                        style={{ animationDelay: `${i * 0.05}s`, border: '1px solid rgba(15,23,42,0.06)' }}>
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {partner.logoUrl && (
                                                <img src={partner.logoUrl} alt="" className="w-7 h-7 rounded-md object-contain bg-white shrink-0"
                                                    style={{ border: '1px solid rgba(15,23,42,0.08)' }} />
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-700 truncate">{partner.companyName}</p>
                                                <p className="text-xs text-slate-400 truncate">{partner.description || (partner.industriesServed || []).join(', ') || '—'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0 ml-3">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={tierBadgeStyle(partner.tier)}>
                                                {(partner.tier || 'COMMUNITY').charAt(0) + (partner.tier || 'COMMUNITY').slice(1).toLowerCase()}
                                            </span>
                                            {score > 0 && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                                                    {score} match{score !== 1 ? 'es' : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}

export default function PartnersPage() {
    const glow = useCardGlow();
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'PARTNERS' | 'PIPELINE'>('PARTNERS');
    const [filter, setFilter] = useState('');
    const [catFilter, setCatFilter] = useState('');
    const [search, setSearch] = useState('');
    const [busyId, setBusyId] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        api.get('/api/partners', { params: filter ? { status: filter } : {} })
            .then(r => setPartners(r.data.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [filter]);

    const act = async (id: string, action: Action) => {
        if (action === 'nda-approve' && !window.confirm('Confirm the NDA has been approved for this partner?')) return;
        if (action === 'nda-sign' && !window.confirm('Confirm the NDA has been fully signed (both sides)?')) return;
        if (action === 'approve' && !window.confirm('Give this partner access to their Partner Portal now?')) return;

        setBusyId(id);
        try {
            if (action === 'reject') {
                const reason = window.prompt('Reason for declining (optional):') || undefined;
                await api.patch(`/api/partners/${id}/reject`, { reason });
            } else if (action === 'request-info') {
                const note = window.prompt('What information do you need from this partner?') || undefined;
                await api.patch(`/api/partners/${id}/request-info`, { note });
            } else if (action === 'hold') {
                await api.patch(`/api/partners/${id}/hold`, {});
            } else if (action === 'nda-approve') {
                await api.patch(`/api/partners/${id}/nda-approve`, {});
            } else if (action === 'nda-sign') {
                await api.patch(`/api/partners/${id}/nda-sign`, {});
            } else {
                await api.patch(`/api/partners/${id}/approve`, {});
            }
            load();
            if (action === 'approve' || action === 'reject') setSelectedId(null);
        } catch (err: any) {
            alert(err?.response?.data?.error || 'Action failed');
        } finally {
            setBusyId('');
        }
    };

    const setMeta = async (id: string, payload: any) => {
        setBusyId(id);
        try {
            await api.patch(`/api/partners/${id}/meta`, payload);
            load();
        } catch (err: any) {
            alert(err?.response?.data?.error || 'Update failed');
        } finally {
            setBusyId('');
        }
    };

    const setProfileLive = async (id: string, live: boolean) => {
        if (live && !window.confirm('Approve this partner\'s documents? Their profile becomes visible in Find a Partner and they move to Partners.')) return;
        if (!live && !window.confirm('Take this partner profile offline from the staff directory?')) return;
        setBusyId(id);
        try {
            await api.patch(`/api/partners/${id}/profile-live`, { live });
            load();
        } catch (err: any) {
            alert(err?.response?.data?.error || 'Update failed');
        } finally {
            setBusyId('');
        }
    };

    const archive = async (id: string, archived: boolean) => {
        if (archived && !window.confirm('Archive this partner? They lose portal access and disappear from Find a Partner. You can restore them later.')) return;
        if (!archived && !window.confirm('Restore this partner to Approved? Their documents will need approval again before going live.')) return;
        setBusyId(id);
        try {
            await api.patch(`/api/partners/${id}/archive`, { archive: archived });
            load();
        } catch (err: any) {
            alert(err?.response?.data?.error || 'Action failed');
        } finally {
            setBusyId('');
        }
    };

    const remove = async (id: string, name: string) => {
        if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
        if (!window.confirm('Last check — their profile documents are deleted and their submitted solutions are archived. Delete permanently?')) return;
        setBusyId(id);
        try {
            await api.delete(`/api/partners/${id}`);
            setSelectedId(null);
            load();
        } catch (err: any) {
            alert(err?.response?.data?.error || 'Delete failed');
        } finally {
            setBusyId('');
        }
    };

    const matchesSearch = (p: any) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return p.companyName?.toLowerCase().includes(q) || p.contactPerson?.toLowerCase().includes(q) || p.contactEmail?.toLowerCase().includes(q);
    };

    const fullPartners = partners.filter(isFullPartner).filter(matchesSearch)
        .filter(p => !catFilter || (p.directoryCategory || 'SOLUTIONS_PARTNER') === catFilter);
    const pipelinePartners = partners.filter(p => !isFullPartner(p)).filter(matchesSearch);
    const visiblePartners = view === 'PARTNERS' ? fullPartners : pipelinePartners;

    // Approved partners who have uploaded documents but haven't passed the docs approval yet.
    const docsAwaitingReview = partners.filter(p =>
        p.status === 'APPROVED' && !p.profileLiveAt && (p.documents?.length || 0) > 0
    );

    const selectedPartner = partners.find(p => p.id === selectedId) || null;

    return (
        <div>
            <PendingSolutions />

            {docsAwaitingReview.length > 0 && (
                <div className="pp-reveal mb-8" style={{ animationDelay: '0.13s' }}>
                    <h2 className="font-semibold text-slate-900 tracking-tight mb-3">Documents Awaiting Review</h2>
                    <div onMouseMove={glow} className="pp-card rounded-2xl divide-y bg-white/85"
                        style={{ ...glassCard, borderColor: 'rgba(15,23,42,0.06)' }}>
                        {docsAwaitingReview.map(p => (
                            <div key={p.id} className="px-5 py-3.5 flex items-center justify-between" style={{ borderColor: 'rgba(15,23,42,0.05)' }}>
                                <div className="flex items-center gap-2.5 min-w-0">
                                    {p.logoUrl && (
                                        <img src={p.logoUrl} alt="" className="w-7 h-7 rounded-md object-contain bg-white shrink-0"
                                            style={{ border: '1px solid rgba(15,23,42,0.08)' }} />
                                    )}
                                    <div className="min-w-0">
                                        <p className="font-medium text-slate-700 text-sm truncate">{p.companyName}</p>
                                        <p className="text-xs text-slate-400">{p.documents.length} document{p.documents.length !== 1 ? 's' : ''} uploaded</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button disabled={busyId === p.id} onClick={() => setSelectedId(p.id)}
                                        className="pp-chip px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 disabled:opacity-50">
                                        Review
                                    </button>
                                    <button disabled={busyId === p.id} onClick={() => setProfileLive(p.id, true)}
                                        className="pp-chip px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium hover:bg-emerald-100 disabled:opacity-50">
                                        Approve Documents
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <FindPartner partners={partners} />

            <div className="pp-reveal flex items-center justify-between mb-6 gap-3 flex-wrap" style={{ animationDelay: '0.22s' }}>
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 mb-2">Partner Management</p>
                    <h1 className="text-[28px] font-semibold tracking-tight text-slate-900 leading-tight">Partners</h1>
                    <p className="text-sm text-slate-500 mt-1">Review partner applications and manage access</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company, contact, email…"
                            className={`${inputCls} pl-9 w-64`} style={inputStyle} />
                    </div>
                    {view === 'PARTNERS' && (
                        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                            className={inputCls} style={inputStyle}>
                            <option value="">All Categories</option>
                            <option value="SOLUTIONS_PARTNER">Solutions Partner</option>
                            <option value="ALLIANCE">Alliance</option>
                        </select>
                    )}
                    {view === 'PIPELINE' && (
                        <select value={filter} onChange={e => setFilter(e.target.value)}
                            className={inputCls} style={inputStyle}>
                            <option value="">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="INFO_REQUESTED">Info Requested</option>
                            <option value="HOLD">Hold</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Declined</option>
                            <option value="SUSPENDED">Suspended</option>
                            <option value="ARCHIVED">Archived</option>
                        </select>
                    )}
                </div>
            </div>

            {/* Partners vs Pipeline */}
            <div className="pp-reveal flex gap-1 p-1 rounded-xl bg-white/85 w-fit mb-5"
                style={{ ...glassCard, animationDelay: '0.25s' }}>
                {([
                    { key: 'PARTNERS', label: `Partners (${partners.filter(isFullPartner).length})` },
                    { key: 'PIPELINE', label: `Partners in Pipeline (${partners.filter(p => !isFullPartner(p)).length})` },
                ] as const).map(t => (
                    <button key={t.key} onClick={() => setView(t.key)}
                        className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                        style={view === t.key
                            ? { background: 'linear-gradient(160deg, #1e293b, #0f172a)', color: '#fff', boxShadow: '0 8px 18px -8px rgba(15,23,42,0.5), 0 1px 0 rgba(255,255,255,0.12) inset' }
                            : { color: '#64748b' }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16">
                    <div className="pp-spinner" />
                    <p className="text-xs font-medium tracking-[0.2em] uppercase text-slate-400">Loading</p>
                </div>
            ) : visiblePartners.length === 0 ? (
                <div className="pp-reveal pp-card rounded-2xl p-12 text-center text-slate-400 text-sm bg-white/85" style={glassCard}>
                    {view === 'PARTNERS'
                        ? 'No fully onboarded partners yet — partners appear here once approved and their documents pass review.'
                        : 'No partners in the pipeline match.'}
                </div>
            ) : (
                <div className="pp-reveal pp-card rounded-2xl overflow-hidden bg-white/85"
                    style={{ ...glassCard, animationDelay: '0.28s' }} onMouseMove={glow}>
                    <table className="w-full text-sm">
                        <thead className="text-slate-400 text-[11px] uppercase tracking-[0.14em]"
                            style={{ background: 'linear-gradient(180deg, rgba(248,250,252,0.9), rgba(241,245,249,0.7))' }}>
                            <tr>
                                <th className="text-left px-5 py-3.5 font-semibold">Company</th>
                                <th className="text-left px-5 py-3.5 font-semibold">Contact</th>
                                <th className="text-left px-5 py-3.5 font-semibold">Industries</th>
                                <th className="text-left px-5 py-3.5 font-semibold">{view === 'PARTNERS' ? 'Tier' : 'Status'}</th>
                                <th className="text-right px-5 py-3.5 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visiblePartners.map(p => (
                                <tr key={p.id}
                                    className="cursor-pointer transition-colors duration-300 hover:bg-white"
                                    style={{ borderTop: '1px solid rgba(15,23,42,0.05)' }}
                                    onClick={() => setSelectedId(p.id)}>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2.5">
                                            {p.logoUrl && (
                                                <img src={p.logoUrl} alt="" className="w-7 h-7 rounded-md object-contain bg-white shrink-0"
                                                    style={{ border: '1px solid rgba(15,23,42,0.08)' }} />
                                            )}
                                            <div>
                                                <p className="font-medium text-slate-800">{p.companyName}</p>
                                                {p.website && <p className="text-xs text-slate-400">{p.website}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-600">
                                        <p>{p.contactPerson}</p>
                                        <p className="text-xs text-slate-400">{p.contactEmail}</p>
                                        {p.referredBy && <p className="text-xs text-indigo-500 mt-0.5">Referred by {p.referredBy}</p>}
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-600">{(p.industriesServed || []).join(', ') || '—'}</td>
                                    <td className="px-5 py-3.5">
                                        {view === 'PARTNERS' ? (
                                            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold" style={tierBadgeStyle(p.tier)}>
                                                {(p.tier || 'COMMUNITY').charAt(0) + (p.tier || 'COMMUNITY').slice(1).toLowerCase()}
                                            </span>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[p.status] || 'bg-slate-100 text-slate-500'}`}>
                                                        {p.status.replace('_', ' ')}
                                                    </span>
                                                    {p.status === 'APPROVED' && !p.profileLiveAt && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-600">
                                                            {(p.documents?.length || 0) > 0 ? 'Docs In Review' : 'Awaiting Docs'}
                                                        </span>
                                                    )}
                                                </div>
                                                {(p.status === 'REJECTED' || p.status === 'INFO_REQUESTED') && p.rejectionReason && (
                                                    <p className="text-xs text-slate-400 mt-1 max-w-[220px]">{p.rejectionReason}</p>
                                                )}
                                            </>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                                        {ACTIONABLE_STATUSES.includes(p.status) ? (
                                            <div className="flex gap-2 justify-end flex-wrap">
                                                <QuickActions partner={p} busy={busyId === p.id} onAct={act} />
                                            </div>
                                        ) : <span className="text-xs text-slate-300">—</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedPartner && (
                <PartnerDrawer
                    partner={selectedPartner}
                    onClose={() => setSelectedId(null)}
                    onAct={act}
                    onMeta={setMeta}
                    onProfileLive={setProfileLive}
                    onArchive={archive}
                    onDelete={remove}
                    busy={busyId === selectedPartner.id}
                />
            )}
        </div>
    );
}
