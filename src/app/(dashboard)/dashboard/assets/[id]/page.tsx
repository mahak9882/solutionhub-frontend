'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Clock, Trash2, FileText, Play, X, Archive, History, ChevronDown, ChevronUp, Presentation, Video, File } from 'lucide-react';
import api from '@/lib/axios';
import PdfViewer from '@/components/PdfViewer';

export default function AssetPage() {
    const { id } = useParams();
    const router = useRouter();
    const [asset, setAsset] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [assigning, setAssigning] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [newCustomerName, setNewCustomerName] = useState('');
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const [relatedAssets, setRelatedAssets] = useState<any[]>([]);
    const [batchSiblings, setBatchSiblings] = useState<any[]>([]);
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
    const [settingPrimary, setSettingPrimary] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        api.get(`/api/assets/${id}`).then(r => {
            const a = r.data.data;
            setAsset(a);
            // Push to recently viewed in localStorage
            if (a) {
                try {
                    const key = 'ps_recently_viewed';
                    const prev = JSON.parse(localStorage.getItem(key) || '[]');
                    const entry = { id: a.id, title: a.title, assetType: a.assetType, status: a.status, viewedAt: new Date().toISOString() };
                    const filtered = prev.filter((x: any) => x.id !== a.id);
                    localStorage.setItem(key, JSON.stringify([entry, ...filtered].slice(0, 10)));
                } catch {}
            }
        }).finally(() => setLoading(false));
        api.get('/api/customers').then(r => setCustomers(r.data.data));
        api.get(`/api/assets/${id}/related`).then(r => setRelatedAssets(r.data.data || [])).catch(() => {});
        api.get(`/api/assets/${id}/batch`).then(r => setBatchSiblings(r.data.data || [])).catch(() => {});
    }, [id]);

    const handleArchive = async () => {
        if (!confirm('Archive this asset? It will be hidden from the main list but not deleted.')) return;
        setArchiving(true);
        try {
            await api.patch(`/api/assets/${id}/archive`);
            const r = await api.get(`/api/assets/${id}`);
            setAsset(r.data.data);
        } catch { alert('Archive failed'); }
        finally { setArchiving(false); }
    };

    const handleUnarchive = async () => {
        setArchiving(true);
        try {
            await api.put(`/api/assets/${id}`, { status: 'PUBLISHED' });
            const r = await api.get(`/api/assets/${id}`);
            setAsset(r.data.data);
        } catch { alert('Unarchive failed'); }
        finally { setArchiving(false); }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this asset? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await api.delete(`/api/assets/${id}`);
            router.push('/dashboard');
        } catch (err) {
            alert('Delete failed');
            setDeleting(false);
        }
    };

    const handleEdit = () => {
        setEditForm({
            title: asset.title,
            summary: asset.summary || '',
            problemStatement: asset.problemStatement || '',
            businessImpact: asset.businessImpact || '',
            timeToDeployment: asset.timeToDeployment || '',
            sourceLink: asset.sourceLink || '',
        });
        setEditing(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/api/assets/${id}`, editForm);
            const r = await api.get(`/api/assets/${id}`);
            setAsset(r.data.data);
            setEditing(false);
        } catch (err) {
            alert('Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedCustomer) return;
        setAssigning(true);
        try {
            if (selectedCustomer === '__new__') {
                if (!newCustomerName.trim()) return;
                const industryId = asset.industries?.[0]?.industry?.id;
                const res = await api.post('/api/customers', { name: newCustomerName.trim(), industryId });
                await api.post(`/api/assets/${id}/assign-customer`, { customerId: res.data.data.id });
                setNewCustomerName('');
            } else {
                await api.post(`/api/assets/${id}/assign-customer`, { customerId: selectedCustomer });
            }
            const r = await api.get(`/api/assets/${id}`);
            setAsset(r.data.data);
            const cust = await api.get('/api/customers');
            setCustomers(cust.data.data);
            setSelectedCustomer('');
        } catch (err) {
            alert('Failed to assign customer');
        } finally {
            setAssigning(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
    );
    if (!asset) return <div>Not found</div>;

    const getFileIcon = () => {
        const type = asset.assetType;
        if (['DEMO_RECORDING', 'VIDEO_WALKTHROUGH', 'MEETING_RECORDING'].includes(type)) return { icon: Video, color: '#8b5cf6', bg: '#f5f3ff' };
        if (['PITCH_DECK', 'PROPOSAL', 'PRODUCT_PRESENTATION', 'CASE_STUDY'].includes(type)) return { icon: Presentation, color: '#6366f1', bg: '#eef2ff' };
        if (type === 'PDF_DOCUMENT') return { icon: FileText, color: '#ef4444', bg: '#fef2f2' };
        return { icon: File, color: '#64748b', bg: '#f8fafc' };
    };

    const getFileLabel = () => {
        if (asset.sourceLink?.includes('docs.google.com/presentation')) return 'Google Slides';
        if (asset.sourceLink?.includes('sharepoint.com')) return 'SharePoint Document';
        if (asset.sourceLink?.includes('1drv.ms') || asset.sourceLink?.includes('onedrive')) return 'OneDrive File';
        if (asset.sourceLink?.match(/\.(mp4|webm|mov)$/i)) return 'Video File';
        if (asset.sourceLink?.match(/\.pdf$/i)) return 'PDF Document';
        if (asset.sourceLink?.includes('loom.com')) return 'Loom Recording';
        if (asset.sourceLink?.includes('youtube.com') || asset.sourceLink?.includes('youtu.be')) return 'YouTube Video';
        return 'Linked Document';
    };

    return (
        <div className="max-w-5xl mx-auto">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft size={16} /> Back
            </button>
            <div className="grid grid-cols-4 gap-6">
                <div className="col-span-3 space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6">
                        <div className="mb-4">
                            <h1 className="text-2xl font-bold text-slate-800">{asset.title}</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">{asset.assetType?.replace(/_/g, ' ')}</span>
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${asset.status === 'PUBLISHED' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-600'}`}>{asset.status}</span>
                            </div>
                        </div>
                        <div className="flex gap-2 mb-6 flex-wrap">
                            <button onClick={editing ? handleSave : handleEdit} disabled={saving}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                                style={{ background: editing ? '#f0fdf4' : '#f8fafc', color: editing ? '#16a34a' : '#475569', border: '1px solid', borderColor: editing ? '#bbf7d0' : '#e2e8f0' }}>
                                {saving ? 'Saving...' : editing ? '✓ Save' : '✎ Edit'}
                            </button>
                            {editing && (
                                <button onClick={() => setEditing(false)}
                                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-500 rounded-lg text-sm">
                                    Cancel
                                </button>
                            )}
                            {asset.status !== 'ARCHIVED' ? (
                                <button onClick={handleArchive} disabled={archiving}
                                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-500 rounded-lg text-sm hover:bg-slate-200 transition-colors">
                                    <Archive size={14} /> {archiving ? 'Archiving...' : 'Archive'}
                                </button>
                            ) : (
                                <button onClick={handleUnarchive} disabled={archiving}
                                    className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm hover:bg-emerald-100 transition-colors">
                                    <Archive size={14} /> {archiving ? 'Restoring...' : 'Unarchive'}
                                </button>
                            )}
                            <button onClick={handleDelete} disabled={deleting}
                                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-500 rounded-lg text-sm hover:bg-red-100 transition-colors">
                                <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>

                        {/* Files */}
                        {asset.sourceLink && (() => {
                            const { icon: Icon, color, bg } = getFileIcon();
                            const isVideo = ['DEMO_RECORDING', 'VIDEO_WALKTHROUGH', 'MEETING_RECORDING'].includes(asset.assetType);
                            const isYouTube = /youtube\.com|youtu\.be/.test(asset.sourceLink);
                            const isLoom = /loom\.com/.test(asset.sourceLink);
                            const isDirectVideo = /\.(mp4|webm|mov)(\?|$)/i.test(asset.sourceLink);
                            const proxyUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/assets/${asset.id}/file-proxy`;

                            // Build viewer src
                            let viewerSrc: string | null = null;
                            let viewerType: 'iframe' | 'video' | 'office' | null = null;
                            const isPdf = asset.assetType === 'PDF_DOCUMENT' || /\.pdf(\?|$)/i.test(asset.sourceLink);

                            if (isYouTube) {
                                const m = asset.sourceLink.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
                                if (m) { viewerSrc = `https://www.youtube.com/embed/${m[1]}`; viewerType = 'iframe'; }
                            } else if (isLoom) {
                                const m = asset.sourceLink.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
                                if (m) { viewerSrc = `https://www.loom.com/embed/${m[1]}`; viewerType = 'iframe'; }
                            } else if (isDirectVideo) {
                                viewerSrc = asset.sourceLink; viewerType = 'video';
                            } else if (!isVideo) {
                                if (isPdf) {
                                    viewerSrc = proxyUrl; viewerType = 'iframe';
                                } else {
                                    viewerSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(proxyUrl)}`;
                                    viewerType = 'office';
                                }
                            }

                            return (
                                <div className="rounded-2xl border border-slate-200 mb-6 overflow-hidden">
                                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Files</p>
                                        <a href={asset.sourceLink} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium">
                                            <ExternalLink size={11} /> Open original
                                        </a>
                                    </div>
                                    {/* All files — current + batch siblings */}
                                    {[{ id: asset.id, title: asset.title, assetType: asset.assetType, sourceLink: asset.sourceLink, isPrimary: asset.isPrimary, isCurrent: true }, ...batchSiblings.map((s: any) => ({ ...s, isCurrent: false }))].map((file: any) => {
                                        const isExpanded = expandedFiles.has(file.id);
                                        const toggleExpand = () => setExpandedFiles(prev => {
                                            const next = new Set(prev);
                                            if (next.has(file.id)) next.delete(file.id); else next.add(file.id);
                                            return next;
                                        });
                                        const handleSetPrimary = async (e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            setSettingPrimary(file.id);
                                            try {
                                                await api.post(`/api/assets/${file.id}/set-primary`);
                                                // Refresh asset + siblings to reflect new isPrimary state
                                                const [assetRes, batchRes] = await Promise.all([
                                                    api.get(`/api/assets/${id}`),
                                                    api.get(`/api/assets/${id}/batch`),
                                                ]);
                                                setAsset(assetRes.data.data);
                                                setBatchSiblings(batchRes.data.data || []);
                                            } finally {
                                                setSettingPrimary(null);
                                            }
                                        };
                                        const fileProxyUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/assets/${file.id}/file-proxy`;
                                        const fileIsPdf = file.assetType === 'PDF_DOCUMENT' || /\.pdf(\?|$)/i.test(file.sourceLink || '');
                                        const fileIsVideo = ['DEMO_RECORDING', 'VIDEO_WALKTHROUGH', 'MEETING_RECORDING'].includes(file.assetType);
                                        const fileIsYouTube = /youtube\.com|youtu\.be/.test(file.sourceLink || '');
                                        const fileIsLoom = /loom\.com/.test(file.sourceLink || '');
                                        const fileIsDirectVideo = /\.(mp4|webm|mov)(\?|$)/i.test(file.sourceLink || '');
                                        let fileViewerSrc: string | null = null;
                                        let fileViewerType: 'iframe' | 'video' | 'office' | 'pdf' | null = null;
                                        if (fileIsYouTube) { const m = file.sourceLink.match(/(?:v=|youtu\.be\/)([^&\s]+)/); if (m) { fileViewerSrc = `https://www.youtube.com/embed/${m[1]}`; fileViewerType = 'iframe'; } }
                                        else if (fileIsLoom) { const m = file.sourceLink.match(/loom\.com\/share\/([a-zA-Z0-9]+)/); if (m) { fileViewerSrc = `https://www.loom.com/embed/${m[1]}`; fileViewerType = 'iframe'; } }
                                        else if (fileIsDirectVideo) { fileViewerSrc = file.sourceLink; fileViewerType = 'video'; }
                                        else if (!fileIsVideo) { if (fileIsPdf) { fileViewerType = 'pdf'; } else { fileViewerSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileProxyUrl)}`; fileViewerType = 'office'; } }
                                        return (
                                            <div key={file.id} className="border-b border-slate-100 last:border-b-0">
                                                <div className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                                                    <button onClick={toggleExpand} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                                                            <Icon size={15} color={color} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="text-sm font-medium text-slate-800 truncate">{file.title}</p>
                                                                {file.isPrimary && (
                                                                    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                                                                        PREVIEW
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-400">{file.assetType?.replace(/_/g, ' ')}</p>
                                                        </div>
                                                    </button>
                                                    {!file.isPrimary && (
                                                        <button
                                                            onClick={handleSetPrimary}
                                                            disabled={settingPrimary === file.id}
                                                            className="shrink-0 text-xs px-2.5 py-1 rounded-lg border transition-colors"
                                                            style={{ borderColor: '#6366f1', color: '#6366f1', background: 'white' }}
                                                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#eef2ff'; }}
                                                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; }}
                                                        >
                                                            {settingPrimary === file.id ? '…' : 'Set as Preview'}
                                                        </button>
                                                    )}
                                                    <button onClick={toggleExpand} className="shrink-0 p-1">
                                                        {isExpanded ? <ChevronUp size={15} color="#94a3b8" /> : <ChevronDown size={15} color="#94a3b8" />}
                                                    </button>
                                                </div>
                                                {isExpanded && (
                                                    <div className="border-t border-slate-100">
                                                        {fileViewerType === 'video' && <video controls className="w-full" style={{ maxHeight: 400, background: '#000' }} src={fileViewerSrc!} />}
                                                        {fileViewerType === 'pdf' && <PdfViewer url={fileProxyUrl} />}
                                                        {(fileViewerType === 'iframe' || fileViewerType === 'office') && fileViewerSrc && <iframe src={fileViewerSrc} className="w-full" style={{ height: 460, border: 'none' }} allowFullScreen />}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}

                        {editing ? (
                            <div className="space-y-3">
                                {[
                                    { key: 'title', label: 'Title' },
                                    { key: 'summary', label: 'Summary' },
                                    { key: 'problemStatement', label: 'Problem Statement' },
                                    { key: 'businessImpact', label: 'Business Impact' },
                                    { key: 'timeToDeployment', label: 'Time to Deployment' },
                                    { key: 'sourceLink', label: 'Source Link' },
                                ].map(f => (
                                    <div key={f.key}>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{f.label}</p>
                                        <textarea value={editForm[f.key]} onChange={e => setEditForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 resize-none"
                                            rows={f.key === 'title' || f.key === 'timeToDeployment' ? 1 : 3} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                {asset.summary && <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Summary</p><p className="text-sm text-slate-600">{asset.summary}</p></div>}
                                {asset.problemStatement && <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Problem Statement</p><p className="text-sm text-slate-600">{asset.problemStatement}</p></div>}
                                {asset.businessImpact && <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Business Impact</p><p className="text-sm text-slate-600">{asset.businessImpact}</p></div>}
                            </>
                        )}
                    </div>


                    {asset.timestamps?.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 p-6">
                            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Clock size={16} color="#6366f1" /> Video Chapters
                            </h2>
                            <div className="space-y-3">
                                {asset.timestamps.map((t: any) => (
                                    <div key={t.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                                        <span className="text-xs font-mono text-indigo-500 mt-0.5 shrink-0 font-semibold">{t.startTime}</span>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">{t.topicName}</p>
                                            {t.summary && <p className="text-xs text-slate-400 mt-0.5">{t.summary}</p>}
                                            {t.painPoints?.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {t.painPoints.map((p: string, i: number) => (
                                                        <span key={i} className="text-xs px-2 py-0.5 bg-red-50 text-red-500 rounded-full">{p}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-100 p-5">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">Details</h3>
                        <div className="space-y-3">
                            {asset.industries?.[0] && <div><p className="text-xs text-slate-400">Industry</p><p className="text-sm font-semibold text-slate-700">{asset.industries[0].industry.name}</p></div>}
                            {asset.customers?.length > 0 && (
                                <div>
                                    <p className="text-xs text-slate-400">Customers</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {asset.customers.map((c: any) => (
                                            <span key={c.customer.id} className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">{c.customer.name}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {asset.timeToDeployment && <div><p className="text-xs text-slate-400">Time to Deployment</p><p className="text-sm font-semibold text-slate-700">{asset.timeToDeployment}</p></div>}
                            <div><p className="text-xs text-slate-400">Published by</p><p className="text-sm font-semibold text-slate-700">{asset.createdBy?.name}</p></div>
                            <div><p className="text-xs text-slate-400">Date</p><p className="text-sm font-semibold text-slate-700">{new Date(asset.createdAt).toLocaleDateString()}</p></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-5">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">{asset.customers?.length > 0 ? 'Change Customer' : 'Assign Customer'}</h3>
                        <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 mb-2">
                            <option value="">Select customer</option>
                            {customers
                                .filter((c: any) => !asset.industries?.[0] || c.industryId === asset.industries[0].industry.id)
                                .map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            <option value="__new__">+ New customer</option>
                        </select>
                        {selectedCustomer === '__new__' && (
                            <input value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)}
                                placeholder="Customer name"
                                className="w-full px-3 py-2 bg-slate-50 border border-violet-300 rounded-xl text-sm focus:outline-none focus:border-violet-500 mb-2" />
                        )}
                        <button onClick={handleAssign} disabled={assigning || !selectedCustomer || (selectedCustomer === '__new__' && !newCustomerName.trim())}
                            className="w-full py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            {assigning ? 'Assigning...' : 'Assign'}
                        </button>
                    </div>

                    {asset.productServices?.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 p-5">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Products / Services</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {asset.productServices.map((p: any) => (
                                    <span key={p.productService.id} className="px-2.5 py-1 rounded-full text-xs font-medium"
                                        style={{ background: '#f0fdf4', color: '#16a34a' }}>
                                        {p.productService.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Related Assets */}
                    {relatedAssets.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 p-5">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Related Assets</h3>
                            <div className="space-y-2">
                                {relatedAssets.map((r: any) => (
                                    <Link key={r.id} href={`/dashboard/assets/${r.id}`}
                                        className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                                            <FileText size={12} color="#6366f1" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-slate-700 truncate">{r.title}</p>
                                            <p className="text-xs text-slate-400">{r.assetType?.replace(/_/g, ' ')}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Version History */}
                    {asset.versions?.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 p-5">
                            <button className="flex items-center justify-between w-full" onClick={() => setShowHistory(v => !v)}>
                                <div className="flex items-center gap-2">
                                    <History size={13} color="#94a3b8" />
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Version History</h3>
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">{asset.versions.length}</span>
                                </div>
                                {showHistory ? <ChevronUp size={13} color="#94a3b8" /> : <ChevronDown size={13} color="#94a3b8" />}
                            </button>
                            {showHistory && (
                                <div className="mt-3 space-y-2">
                                    {[...asset.versions].reverse().map((v: any) => (
                                        <div key={v.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50">
                                            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-[9px] font-bold text-indigo-600">v{v.versionNumber}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-slate-600">{v.changeSummary || 'Updated'}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {v.changedBy?.name} · {new Date(v.changedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
