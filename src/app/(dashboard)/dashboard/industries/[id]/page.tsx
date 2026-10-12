'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, Play, X, Maximize2, ExternalLink, Upload, Link2, HardDriveUpload, Trash2, Plus, CheckCircle2, Circle, Pencil, Milestone, ChevronDown, Layers, BookOpen } from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '@/lib/axios';
import { useAuth } from '@clerk/nextjs';
import PdfThumbnail from '@/components/PdfThumbnail';

const ASSET_TYPES = ['PITCH_DECK','PROPOSAL','CASE_STUDY','PRODUCT_PRESENTATION','PDF_DOCUMENT','MEETING_RECORDING','DEMO_RECORDING','VIDEO_WALKTHROUGH','CUSTOMER_SUMMARY_NOTE','PLAYBOOK','SOW','BUSINESS_CASE','ROADMAP','WHITEPAPER'];

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ps-backend-production-42e4.up.railway.app';

function LevelRow({ n, icon, title, subtitle, count, open, onToggle, search, isFirst, isLast, children }: {
    n: number; icon: React.ReactNode; title: string; subtitle: string; count: number;
    open: boolean; onToggle: () => void; search?: React.ReactNode;
    isFirst?: boolean; isLast?: boolean; children: React.ReactNode;
}) {
    const filled = count > 0;
    const lineStyle: React.CSSProperties = { position: 'absolute', left: 15, width: 1, background: '#e2e8f0' };
    if (isFirst && isLast) lineStyle.display = 'none';
    else if (isFirst) { lineStyle.top = 30; lineStyle.bottom = 0; }
    else if (isLast) { lineStyle.top = 0; lineStyle.height = 30; }
    else { lineStyle.top = 0; lineStyle.bottom = 0; }

    return (
        <div className="relative">
            <div style={lineStyle} />
            <div className="flex items-center gap-3 py-3.5 cursor-pointer select-none rounded-xl hover:bg-slate-50/70 transition-colors"
                onClick={onToggle}>
                <div className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all"
                    style={filled
                        ? { background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: '#fff', boxShadow: '0 2px 8px rgba(124,58,237,0.25)' }
                        : { background: '#fff', color: '#cbd5e1', border: '1.5px solid #e2e8f0' }}>
                    {n}
                </div>
                <span className="shrink-0" style={{ opacity: filled ? 1 : 0.45 }}>{icon}</span>
                <p className="text-sm font-semibold shrink-0" style={{ color: filled ? '#334155' : '#94a3b8' }}>{title}</p>
                <p className="text-xs text-slate-400 hidden lg:block truncate">{subtitle}</p>
                <div style={{ flex: 1 }} />
                {open && search}
                {filled
                    ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: '#f3f0ff', color: '#7c3aed' }}>{count}</span>
                    : <span className="text-[11px] text-slate-300 shrink-0">Empty</span>}
                <ChevronDown size={14} color="#94a3b8" className="shrink-0"
                    style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
            </div>
            {open && <div className="pl-11 pb-6 pt-1">{children}</div>}
        </div>
    );
}

function UploadModal({ industryId, existingCustomers, onClose, onDone }: { industryId: string; existingCustomers: any[]; onClose: () => void; onDone: () => void }) {
    const { getToken } = useAuth();
    const [mode, setMode] = useState<'link' | 'file'>('link');
    const [form, setForm] = useState({ title: '', sourceLink: '', assetType: 'PITCH_DECK', summary: '' });
    const [files, setFiles] = useState<File[]>([]);
    const [saving, setSaving] = useState(false);
    const [progress, setProgress] = useState('');
    const [uploadPct, setUploadPct] = useState(0);
    // Customer selection: '' = none, '__new__' = new, or customer id
    const [customerSel, setCustomerSel] = useState('');
    const [newCustomerName, setNewCustomerName] = useState('');

    const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    const handleUrlChange = async (url: string) => {
        set('sourceLink', url);
        if (!url.startsWith('http')) return;
        if (/docs\.google\.com\/presentation|\.pptx?$/i.test(url)) set('assetType', 'PITCH_DECK');
        else if (/youtube\.com|youtu\.be|loom\.com|vimeo\.com/i.test(url)) set('assetType', 'MEETING_RECORDING');
        else if (/\.pdf$/i.test(url)) set('assetType', 'PDF_DOCUMENT');
        if (!form.title) {
            api.post('/api/unfurl', { url }).then(r => {
                const t = r.data?.data?.title;
                if (t) set('title', t);
            }).catch(() => {});
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        setFiles(prev => [...prev, ...selected]);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const items = Array.from(e.dataTransfer.items);
        const allFiles: File[] = [];
        let pending = 0;
        const tryAdd = () => { if (pending === 0) setFiles(prev => [...prev, ...allFiles]); };
        const readEntry = (entry: any) => {
            if (entry.isFile) {
                pending++;
                entry.file((f: File) => { allFiles.push(f); pending--; tryAdd(); });
            } else if (entry.isDirectory) {
                const reader = entry.createReader();
                pending++;
                const readAll = () => reader.readEntries((entries: any[]) => {
                    if (!entries.length) { pending--; tryAdd(); return; }
                    entries.forEach(readEntry);
                    readAll();
                });
                readAll();
            }
        };
        items.forEach(item => { const entry = item.webkitGetAsEntry(); if (entry) readEntry(entry); });
    };

    const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

    // Resolve customer fields to pass to API
    const getCustomerPayload = () => {
        if (customerSel === '__new__' && newCustomerName.trim()) return { customerName: newCustomerName.trim() };
        if (customerSel && customerSel !== '__new__') return { customerId: customerSel };
        return {};
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const cust = getCustomerPayload();
            if (mode === 'link') {
                if (!form.title.trim() || !form.sourceLink.trim()) return;
                // For link mode, if new customer name, create customer first then pass id
                let customerIds: string[] | undefined;
                if ('customerName' in cust && cust.customerName) {
                    const r = await api.post('/api/customers', { name: cust.customerName, industryId });
                    customerIds = [r.data.data.id];
                } else if ('customerId' in cust) {
                    customerIds = [cust.customerId as string];
                }
                await api.post('/api/assets', { ...form, industryIds: [industryId], customerIds, status: 'PUBLISHED' });
            } else {
                if (!files.length) return;
                setProgress(`Uploading ${files.length} file${files.length > 1 ? 's' : ''}…`);
                const fd = new FormData();
                files.forEach(f => fd.append('files', f));
                fd.append('industryId', industryId);
                if (form.title.trim()) fd.append('title', form.title.trim());
                if (form.summary.trim()) fd.append('summary', form.summary.trim());
                if ('customerId' in cust) fd.append('customerId', cust.customerId as string);
                if ('customerName' in cust) fd.append('customerName', cust.customerName as string);
                // Upload directly to backend with progress tracking — bypasses Vercel's 4.5MB proxy limit
                const token = await getToken();
                await new Promise<void>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', `${BACKEND_URL}/api/assets/upload-files`);
                    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100));
                    };
                    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.responseText));
                    xhr.onerror = () => reject(new Error('Network error'));
                    xhr.send(fd);
                });
            }
            onDone();
        } catch { alert('Upload failed'); }
        finally { setSaving(false); setProgress(''); setUploadPct(0); }
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const canSubmit = mode === 'link' ? (form.title.trim() && form.sourceLink.trim()) : files.length > 0;

    const modal = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <div>
                        <p className="font-bold text-slate-800 text-lg">Add Asset</p>
                        <p className="text-xs text-slate-400 mt-0.5">Link or upload a file to this industry</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors"><X size={15} color="#94a3b8" /></button>
                </div>

                {/* Mode toggle */}
                <div className="px-6 pb-4">
                    <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f1f5f9' }}>
                        {(['link', 'file'] as const).map(m => (
                            <button key={m} onClick={() => setMode(m)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all"
                                style={mode === m ? { background: '#fff', color: '#7c3aed', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' } : { color: '#94a3b8' }}>
                                {m === 'link' ? <><Link2 size={12} /> Paste Link</> : <><HardDriveUpload size={12} /> Upload File</>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 pb-2 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                    {mode === 'link' ? (
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1.5">Link</p>
                                <input value={form.sourceLink} onChange={e => handleUrlChange(e.target.value)}
                                    placeholder="YouTube, Google Slides, SharePoint…"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:bg-white transition-colors" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1.5">Title</p>
                                <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Give it a name"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:bg-white transition-colors" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1.5">Type</p>
                                    <select value={form.assetType} onChange={e => set('assetType', e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400">
                                        {ASSET_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1.5">Customer</p>
                                    <select value={customerSel} onChange={e => setCustomerSel(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400">
                                        <option value="">No customer</option>
                                        {existingCustomers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        <option value="__new__">+ New customer</option>
                                    </select>
                                </div>
                            </div>
                            {customerSel === '__new__' && (
                                <input value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)}
                                    placeholder="Customer name"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-violet-300 rounded-xl text-sm focus:outline-none focus:border-violet-500" />
                            )}
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1.5">Summary <span className="text-slate-400 font-normal">(optional)</span></p>
                                <textarea value={form.summary} onChange={e => set('summary', e.target.value)} rows={4}
                                    placeholder="Brief description…"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:bg-white transition-colors resize-none" />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed transition-colors"
                                style={{ borderColor: '#ddd6fe', background: '#faf5ff', minHeight: 110 }}
                                onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
                                <input id="file-input" type="file" multiple className="hidden" accept=".pptx,.ppt,.pdf,.docx,.doc,.mp4,.mov,.webm,.xlsx,.xls,.csv" onChange={handleFileChange} />
                                <input id="folder-input" type="file" className="hidden" onChange={handleFileChange} {...{ webkitdirectory: '', directory: '' } as any} />
                                <HardDriveUpload size={24} color="#7c3aed" />
                                <p className="mt-2 text-sm font-semibold text-violet-600">
                                    <label htmlFor="file-input" className="cursor-pointer hover:underline">Click to browse files</label>
                                    <span className="text-slate-300 mx-1.5">or</span>
                                    <label htmlFor="folder-input" className="cursor-pointer hover:underline">select a folder</label>
                                    <span className="text-slate-400 mx-1.5">or drag & drop</span>
                                </p>
                                <p className="text-xs text-slate-400 mt-1">PPTX, PDF, DOCX, MP4 · max 600 MB</p>
                            </div>
                            {files.length > 0 && (
                                <div className="space-y-1.5">
                                    {files.map((f, i) => (
                                        <div key={i} className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl">
                                            <FileText size={13} color="#7c3aed" className="shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-700 truncate">{f.name}</p>
                                                <p className="text-xs text-slate-400">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                                            </div>
                                            <button onClick={() => removeFile(i)} className="p-1 text-slate-300 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1.5">Title <span className="text-slate-400 font-normal">(optional)</span></p>
                                <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Give it a name"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:bg-white transition-colors" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1.5">Summary <span className="text-slate-400 font-normal">(optional)</span></p>
                                <textarea value={form.summary} onChange={e => set('summary', e.target.value)} rows={3}
                                    placeholder="Brief description…"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:bg-white transition-colors resize-none" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1.5">Customer <span className="text-slate-400 font-normal">(optional)</span></p>
                                <select value={customerSel} onChange={e => setCustomerSel(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400">
                                    <option value="">No customer</option>
                                    {existingCustomers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    <option value="__new__">+ New customer</option>
                                </select>
                                {customerSel === '__new__' && (
                                    <input value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)}
                                        placeholder="Customer name"
                                        className="mt-2 w-full px-3.5 py-2.5 bg-slate-50 border border-violet-300 rounded-xl text-sm focus:outline-none focus:border-violet-500" />
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {saving && mode === 'file' && uploadPct > 0 && (
                    <div className="px-6 pb-2">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-200" style={{ width: `${uploadPct}%`, background: 'linear-gradient(90deg, #7c3aed, #6366f1)' }} />
                            </div>
                            <span className="text-xs text-slate-400 shrink-0">{uploadPct}%</span>
                        </div>
                    </div>
                )}
                <div className="px-6 py-5 flex items-center justify-between">
                    {progress ? <p className="text-xs text-violet-500 font-medium">{progress}</p> : <span />}
                    <div className="flex gap-2 ml-auto">
                        <button onClick={onClose} className="px-4 py-2.5 text-sm text-slate-500 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
                        <button onClick={handleSubmit} disabled={saving || !canSubmit}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-40 transition-all"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
                            {saving ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />{uploadPct > 0 ? `${uploadPct}%` : 'Uploading…'}</> : <><Upload size={13} />Add Asset</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
    if (typeof document === 'undefined') return null;
    return createPortal(modal, document.body);
}

// Uploads a single file as an Asset of the given type and returns the created asset.
async function uploadRoadmapFile(file: File, industryId: string, title: string, token: string | null, onProgress?: (pct: number) => void): Promise<any> {
    const fd = new FormData();
    fd.append('files', file);
    fd.append('industryId', industryId);
    fd.append('assetType', 'ROADMAP');
    if (title.trim()) fd.append('title', title.trim());
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${BACKEND_URL}/api/assets/upload-files`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.upload.onprogress = e => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try { resolve(JSON.parse(xhr.responseText)?.data?.[0]); }
                catch { reject(new Error('Bad upload response')); }
            } else reject(new Error(xhr.responseText));
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(fd);
    });
}

function RoadmapItemModal({ initial, industryId, onClose, onSave }: { initial: { id?: string; title: string; description: string; buildStatus: 'BUILT' | 'TO_BE_BUILT'; asset?: any }; industryId: string; onClose: () => void; onSave: (data: { title: string; description: string; buildStatus: 'BUILT' | 'TO_BE_BUILT'; assetId?: string | null }) => void }) {
    const { getToken } = useAuth();
    const [title, setTitle] = useState(initial.title);
    const [description, setDescription] = useState(initial.description);
    const [buildStatus, setBuildStatus] = useState<'BUILT' | 'TO_BE_BUILT'>(initial.buildStatus);
    const [saving, setSaving] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [existingAsset, setExistingAsset] = useState<any>(initial.asset || null);
    const [uploadPct, setUploadPct] = useState(0);
    const [uploadError, setUploadError] = useState('');

    const canSubmit = title.trim().length > 0;

    const handleSave = async () => {
        if (!canSubmit || saving) return;
        setSaving(true);
        setUploadError('');
        try {
            let assetId: string | null | undefined;
            if (file) {
                const token = await getToken();
                const asset = await uploadRoadmapFile(file, industryId, title, token, setUploadPct);
                if (!asset?.id) throw new Error('Upload failed');
                assetId = asset.id;
            } else if (initial.asset && !existingAsset) {
                assetId = null; // deck was removed
            }
            await onSave({ title: title.trim(), description: description.trim(), buildStatus, assetId });
        } catch (err: any) {
            setUploadError('Upload failed. Please try again.');
        } finally {
            setSaving(false);
            setUploadPct(0);
        }
    };

    const modal = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <div>
                        <p className="font-bold text-slate-800 text-lg">{initial.id ? 'Edit Roadmap Item' : 'Add Roadmap Item'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Story built vs to be built for this industry</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors"><X size={15} color="#94a3b8" /></button>
                </div>
                <div className="px-6 pb-6 space-y-3">
                    <div>
                        <p className="text-sm font-medium text-slate-600 mb-1.5">Title</p>
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. AI-powered claims triage"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:bg-white transition-colors" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-600 mb-1.5">Description <span className="text-slate-400 font-normal">(optional)</span></p>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                            placeholder="What is this capability / story?"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:bg-white transition-colors resize-none" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-600 mb-1.5">Status</p>
                        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f1f5f9' }}>
                            {(['BUILT', 'TO_BE_BUILT'] as const).map(s => (
                                <button key={s} onClick={() => setBuildStatus(s)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all"
                                    style={buildStatus === s ? { background: '#fff', color: '#7c3aed', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' } : { color: '#94a3b8' }}>
                                    {s === 'BUILT' ? <><CheckCircle2 size={13} /> Built</> : <><Circle size={13} /> To Be Built</>}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-600 mb-1.5">Deck <span className="text-slate-400 font-normal">(optional)</span></p>
                        {file ? (
                            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-violet-200" style={{ background: '#faf5ff' }}>
                                <FileText size={13} color="#7c3aed" className="shrink-0" />
                                <p className="text-sm text-slate-700 truncate flex-1">{file.name}</p>
                                <button onClick={() => setFile(null)} className="p-1 rounded-lg hover:bg-white shrink-0"><X size={12} color="#94a3b8" /></button>
                            </div>
                        ) : existingAsset ? (
                            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50">
                                <FileText size={13} color="#7c3aed" className="shrink-0" />
                                <p className="text-sm text-slate-700 truncate flex-1">{existingAsset.title}</p>
                                <button onClick={() => setExistingAsset(null)} className="p-1 rounded-lg hover:bg-white shrink-0" title="Remove deck"><X size={12} color="#94a3b8" /></button>
                            </div>
                        ) : (
                            <>
                                <input id="roadmap-item-file" type="file" className="hidden"
                                    accept=".pptx,.ppt,.pdf,.docx,.doc"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
                                <label htmlFor="roadmap-item-file"
                                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:bg-violet-50"
                                    style={{ borderColor: '#ddd6fe' }}>
                                    <HardDriveUpload size={13} color="#7c3aed" />
                                    <span className="text-xs font-semibold text-violet-600">Attach a PPTX</span>
                                </label>
                            </>
                        )}
                        {saving && uploadPct > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-200" style={{ width: `${uploadPct}%`, background: 'linear-gradient(90deg, #7c3aed, #6366f1)' }} />
                                </div>
                                <span className="text-xs text-slate-400 shrink-0">{uploadPct}%</span>
                            </div>
                        )}
                        {uploadError && <p className="text-xs text-red-500 mt-1.5">{uploadError}</p>}
                    </div>
                </div>
                <div className="px-6 pb-6 flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                    <button onClick={handleSave} disabled={!canSubmit || saving}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                        style={{ background: '#7c3aed' }}>
                        {saving ? (uploadPct > 0 ? `Uploading ${uploadPct}%` : 'Saving…') : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
    if (typeof document === 'undefined') return null;
    return createPortal(modal, document.body);
}

function RoadmapSection({ industryId, open, onToggle, deckAssets = [], onAssetsChanged }: { industryId: string; open: boolean; onToggle: () => void; deckAssets?: any[]; onAssetsChanged?: () => void }) {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalState, setModalState] = useState<{ open: boolean; item?: any; defaultStatus?: 'BUILT' | 'TO_BE_BUILT' }>({ open: false });
    const [previewAsset, setPreviewAsset] = useState<any>(null);
    const [deckUploading, setDeckUploading] = useState(false);
    const [deckPct, setDeckPct] = useState(0);
    const { getToken } = useAuth();

    const load = () => api.get(`/api/industries/${industryId}/roadmap`).then(r => setItems(r.data.data || [])).finally(() => setLoading(false));

    useEffect(() => { load(); }, [industryId]);

    const handleSave = async (data: { title: string; description: string; buildStatus: 'BUILT' | 'TO_BE_BUILT'; assetId?: string | null }) => {
        if (modalState.item?.id) {
            await api.patch(`/api/industries/${industryId}/roadmap/${modalState.item.id}`, data);
        } else {
            await api.post(`/api/industries/${industryId}/roadmap`, data);
        }
        setModalState({ open: false });
        load();
        if (data.assetId !== undefined) onAssetsChanged?.();
    };

    const handleDelete = async (itemId: string) => {
        if (!confirm('Remove this roadmap item?')) return;
        await api.delete(`/api/industries/${industryId}/roadmap/${itemId}`);
        load();
    };

    const handleDeckUpload = async (f: File) => {
        setDeckUploading(true);
        try {
            const token = await getToken();
            await uploadRoadmapFile(f, industryId, f.name.replace(/\.[^.]+$/, ''), token, setDeckPct);
            onAssetsChanged?.();
        } catch { alert('Upload failed'); }
        finally { setDeckUploading(false); setDeckPct(0); }
    };

    // The section deck is the newest ROADMAP asset not already attached to an individual item
    const linkedAssetIds = new Set(items.map(i => i.assetId).filter(Boolean));
    const sectionDeck = [...deckAssets]
        .filter(a => !linkedAssetIds.has(a.id))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;

    const built = items.filter(i => i.buildStatus === 'BUILT');
    const toBeBuilt = items.filter(i => i.buildStatus === 'TO_BE_BUILT');

    const Column = ({ label, icon, color, list, defaultStatus }: { label: string; icon: React.ReactNode; color: string; list: any[]; defaultStatus: 'BUILT' | 'TO_BE_BUILT' }) => (
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
                {icon}
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{label}</p>
                <span className="text-xs text-slate-400">{list.length}</span>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                <button onClick={() => setModalState({ open: true, defaultStatus })}
                    className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                    <Plus size={13} color="#94a3b8" />
                </button>
            </div>
            <div className="space-y-2">
                {list.length === 0 && <p className="text-xs text-slate-300 italic">Nothing here yet</p>}
                {list.map(item => (
                    <div key={item.id} className="group flex items-start gap-2 px-3.5 py-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 transition-colors">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{item.title}</p>
                            {item.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>}
                            {item.asset && (
                                <button onClick={() => setPreviewAsset(item.asset)}
                                    className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors hover:bg-violet-100"
                                    style={{ background: '#f3f0ff' }}>
                                    <FileText size={10} color="#7c3aed" />
                                    <span className="text-[11px] font-semibold text-violet-600 truncate" style={{ maxWidth: 160 }}>{item.asset.title}</span>
                                </button>
                            )}
                        </div>
                        <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                            <button onClick={() => setModalState({ open: true, item })} className="p-1 rounded-lg hover:bg-slate-100"><Pencil size={11} color="#94a3b8" /></button>
                            <button onClick={() => handleDelete(item.id)} className="p-1 rounded-lg hover:bg-red-50"><Trash2 size={11} color="#f87171" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <>
            {previewAsset && <PreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} />}
            {modalState.open && (
                <RoadmapItemModal
                    industryId={industryId}
                    initial={modalState.item
                        ? { id: modalState.item.id, title: modalState.item.title, description: modalState.item.description || '', buildStatus: modalState.item.buildStatus, asset: modalState.item.asset }
                        : { title: '', description: '', buildStatus: modalState.defaultStatus || 'BUILT' }}
                    onClose={() => setModalState({ open: false })}
                    onSave={handleSave}
                />
            )}
            <LevelRow
                n={1} isFirst
                icon={<Milestone size={14} color="#7c3aed" />}
                title="Strategic Roadmap"
                subtitle="Story built vs to be built"
                count={items.length}
                open={open}
                onToggle={onToggle}>
                {loading ? (
                    <p className="text-xs text-slate-300 italic">Loading…</p>
                ) : (
                    <>
                        {/* Industry-level roadmap deck */}
                        <div className="flex items-center gap-3 mb-5 pb-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 shrink-0">Roadmap Deck</p>
                            {sectionDeck ? (
                                <>
                                    <button onClick={() => setPreviewAsset(sectionDeck)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-violet-100 min-w-0"
                                        style={{ background: '#f3f0ff' }}>
                                        <FileText size={12} color="#7c3aed" className="shrink-0" />
                                        <span className="text-xs font-semibold text-violet-600 truncate">{sectionDeck.title}</span>
                                    </button>
                                    <span className="text-xs text-slate-300 shrink-0">{new Date(sectionDeck.createdAt).toLocaleDateString()}</span>
                                </>
                            ) : (
                                <span className="text-xs text-slate-300 italic">No deck uploaded yet</span>
                            )}
                            <div style={{ flex: 1 }} />
                            <input id={`roadmap-deck-${industryId}`} type="file" className="hidden"
                                accept=".pptx,.ppt,.pdf,.docx,.doc"
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleDeckUpload(f); e.target.value = ''; }} />
                            <label htmlFor={`roadmap-deck-${industryId}`}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-violet-50 shrink-0">
                                <HardDriveUpload size={12} color="#7c3aed" />
                                <span className="text-[11px] font-semibold text-violet-600">
                                    {deckUploading ? (deckPct > 0 ? `Uploading ${deckPct}%` : 'Uploading…') : sectionDeck ? 'Replace' : 'Upload deck'}
                                </span>
                            </label>
                        </div>
                        <div className="flex gap-8">
                            <Column label="Built" icon={<CheckCircle2 size={13} color="#16a34a" />} color="#16a34a" list={built} defaultStatus="BUILT" />
                            <Column label="To Be Built" icon={<Circle size={13} color="#f59e0b" />} color="#f59e0b" list={toBeBuilt} defaultStatus="TO_BE_BUILT" />
                        </div>
                    </>
                )}
            </LevelRow>
        </>
    );
}

export default function IndustryPage() {
    const { id } = useParams();
    const [industry, setIndustry] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [activeTab, setActiveTab] = useState('ALL');
    const [search, setSearch] = useState('');
    const [sourceTab, setSourceTab] = useState<'AIONOS' | 'PARTNER'>('AIONOS');
    const [pitchSearch, setPitchSearch] = useState('');
    const [demoSearch, setDemoSearch] = useState('');
    const [docSearch, setDocSearch] = useState('');
    const [caseSearch, setCaseSearch] = useState('');
    const [paperSearch, setPaperSearch] = useState('');
    const [roadmapOpen, setRoadmapOpen] = useState(false);
    const [pitchOpen, setPitchOpen] = useState(false);
    const [demoOpen, setDemoOpen] = useState(false);
    const [docOpen, setDocOpen] = useState(false);
    const [caseOpen, setCaseOpen] = useState(false);
    const [paperOpen, setPaperOpen] = useState(false);
    const allLevelsOpen = roadmapOpen && pitchOpen && demoOpen && docOpen && caseOpen && paperOpen;
    const toggleAllLevels = () => {
        const next = !allLevelsOpen;
        setRoadmapOpen(next); setPitchOpen(next); setDemoOpen(next); setDocOpen(next); setCaseOpen(next); setPaperOpen(next);
    };

    const reload = () => api.get(`/api/industries/${id}`).then(r => setIndustry(r.data.data));

    useEffect(() => {
        api.get(`/api/industries/${id}`).then(r => setIndustry(r.data.data)).finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
    );
    if (!industry) return <div>Not found</div>;

    // Hide non-primary batch files — they're accessible via the Files section on the detail page
    const publishedAssets: any[] = (industry.assets || [])
      .map((a: any) => a.asset)
      .filter((a: any) => a.status !== 'ARCHIVED' && a.status !== 'PENDING_REVIEW' && a.status !== 'REJECTED' && (a.isPrimary !== false));
    const archivedAssets: any[] = (industry.assets || []).map((a: any) => a.asset).filter((a: any) => a.status === 'ARCHIVED');
    const hasArchived = archivedAssets.length > 0;

    const aionosAssets = publishedAssets.filter((a: any) => !a.partnerId);
    const partnerAssets = publishedAssets.filter((a: any) => a.partnerId);
    const allAssets: any[] = sourceTab === 'PARTNER' ? partnerAssets : aionosAssets;

    // Level 2 — latest PITCH_DECK per customer (derived, no separate data model)
    const latestPitchByCustomer = (() => {
        const pitchDecks = publishedAssets.filter((a: any) => a.assetType === 'PITCH_DECK');
        const byCustomer = new Map<string, { name: string; asset: any }>();
        let generalLatest: any = null;
        pitchDecks.forEach((asset: any) => {
            const assetCustomers: any[] = (asset.customers || []).map((ac: any) => ac.customer).filter(Boolean);
            if (assetCustomers.length === 0) {
                if (!generalLatest || new Date(asset.createdAt) > new Date(generalLatest.createdAt)) generalLatest = asset;
                return;
            }
            assetCustomers.forEach((c: any) => {
                const existing = byCustomer.get(c.id);
                if (!existing || new Date(asset.createdAt) > new Date(existing.asset.createdAt)) {
                    byCustomer.set(c.id, { name: c.name, asset });
                }
            });
        });
        const list = Array.from(byCustomer.values());
        if (generalLatest) list.push({ name: 'General', asset: generalLatest });
        return list;
    })();

    // Level 3 — all demonstrations built so far, industry-wide (derived, no separate data model)
    const roadmapDeckAssets = publishedAssets.filter((a: any) => a.assetType === 'ROADMAP');

    // Level 6 — all whitepapers for this industry (derived, no separate data model)
    const allWhitepapers = publishedAssets
        .filter((a: any) => a.assetType === 'WHITEPAPER')
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const allDemos = publishedAssets
        .filter((a: any) => ['DEMO_RECORDING', 'VIDEO_WALKTHROUGH'].includes(a.assetType))
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Level 4 — latest Playbook/Proposal/SOW per customer
    const latestDocByCustomer = (() => {
        const docs = publishedAssets.filter((a: any) => ['PLAYBOOK', 'PROPOSAL', 'SOW'].includes(a.assetType));
        const byCustomer = new Map<string, { name: string; asset: any }>();
        let generalLatest: any = null;
        docs.forEach((asset: any) => {
            const assetCustomers: any[] = (asset.customers || []).map((ac: any) => ac.customer).filter(Boolean);
            if (assetCustomers.length === 0) {
                if (!generalLatest || new Date(asset.createdAt) > new Date(generalLatest.createdAt)) generalLatest = asset;
                return;
            }
            assetCustomers.forEach((c: any) => {
                const existing = byCustomer.get(c.id);
                if (!existing || new Date(asset.createdAt) > new Date(existing.asset.createdAt)) {
                    byCustomer.set(c.id, { name: c.name, asset });
                }
            });
        });
        const list = Array.from(byCustomer.values());
        if (generalLatest) list.push({ name: 'General', asset: generalLatest });
        return list;
    })();

    // Level 5 — latest business case / financial costing (xls) per customer
    const latestCaseByCustomer = (() => {
        const cases = publishedAssets.filter((a: any) => a.assetType === 'BUSINESS_CASE');
        const byCustomer = new Map<string, { name: string; asset: any }>();
        let generalLatest: any = null;
        cases.forEach((asset: any) => {
            const assetCustomers: any[] = (asset.customers || []).map((ac: any) => ac.customer).filter(Boolean);
            if (assetCustomers.length === 0) {
                if (!generalLatest || new Date(asset.createdAt) > new Date(generalLatest.createdAt)) generalLatest = asset;
                return;
            }
            assetCustomers.forEach((c: any) => {
                const existing = byCustomer.get(c.id);
                if (!existing || new Date(asset.createdAt) > new Date(existing.asset.createdAt)) {
                    byCustomer.set(c.id, { name: c.name, asset });
                }
            });
        });
        const list = Array.from(byCustomer.values());
        if (generalLatest) list.push({ name: 'General', asset: generalLatest });
        return list;
    })();

    // Build tabs from unique asset types present
    const typesPresent = Array.from(new Set(allAssets.map((a: any) => a.assetType).filter(Boolean))) as string[];
    const tabs = ['ALL', ...typesPresent, ...(hasArchived ? ['ARCHIVED'] : [])];

    const tabAssets = activeTab === 'ARCHIVED' ? archivedAssets : activeTab === 'ALL' ? allAssets : allAssets.filter((a: any) => a.assetType === activeTab);
    const visibleAssets = search.trim()
        ? tabAssets.filter((a: any) => {
            const q = search.toLowerCase();
            const matchesTitle = a.title?.toLowerCase().includes(q);
            const matchesCustomer = (a.customers || []).some((ac: any) => ac.customer?.name?.toLowerCase().includes(q));
            return matchesTitle || matchesCustomer;
          })
        : tabAssets;

    // Group visible assets by customer — an asset with multiple customers appears in each group
    const customerMap = new Map<string, { id: string; name: string; assets: any[] }>();
    const unassigned: any[] = [];
    visibleAssets.forEach((asset: any) => {
        const assetCustomers: any[] = (asset.customers || []).map((ac: any) => ac.customer).filter(Boolean);
        if (assetCustomers.length === 0) {
            unassigned.push(asset);
        } else {
            assetCustomers.forEach(c => {
                if (!customerMap.has(c.id)) customerMap.set(c.id, { id: c.id, name: c.name, assets: [] });
                customerMap.get(c.id)!.assets.push(asset);
            });
        }
    });
    const customerGroups = Array.from(customerMap.values());

    return (
        <div className="-mt-8 -mx-8" style={{ overflowX: 'hidden' }}>
            {showUpload && (
                <UploadModal
                    industryId={id as string}
                    existingCustomers={industry.customers || []}
                    onClose={() => setShowUpload(false)}
                    onDone={() => { setShowUpload(false); reload(); }}
                />
            )}

            {/* Banner + Tabs — unified card */}
            <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-100">
            <div className="relative overflow-hidden">
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 60%, #5b21b6 100%)' }} />
                <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #7c3aed 0%, transparent 60%), radial-gradient(circle at 20% 80%, #a78bfa 0%, transparent 50%)' }} />
                <div className="relative z-10 px-10 py-5 flex items-center justify-between gap-8">
                    <h1 className="text-4xl font-bold text-white leading-tight">{industry.name}</h1>
                    <div className="flex items-center gap-3 shrink-0">
                        <button onClick={() => setShowUpload(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
                            style={{ background: 'rgba(99,102,241,0.5)', border: '1px solid rgba(165,180,252,0.3)' }}>
                            <Upload size={14} /> Upload Asset
                        </button>
                        <div className="text-center px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <p className="text-xl font-bold text-white">{industry._count?.assets || 0}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Assets</p>
                        </div>
                        <div className="text-center px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <p className="text-xl font-bold text-white">{industry._count?.customers || 0}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Customers</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Source tab — AIonOS vs Partner solutions */}
            <div className="flex items-center gap-2 px-10 pt-4 bg-white border-t border-slate-100">
                {(['AIONOS', 'PARTNER'] as const).map(s => (
                    <button key={s} onClick={() => { setSourceTab(s); setActiveTab('ALL'); }}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
                        style={sourceTab === s
                            ? { background: '#f3f0ff', color: '#7c3aed' }
                            : { background: '#f8fafc', color: '#94a3b8' }}>
                        {s === 'AIONOS' ? 'AIonOS Solutions' : 'Partner Solutions'}
                        <span className="ml-1.5 opacity-70">({s === 'AIONOS' ? aionosAssets.length : partnerAssets.length})</span>
                    </button>
                ))}
            </div>

            {/* Tab bar */}
            <div className="flex items-center bg-white" style={{ minHeight: 48 }}>
                <div className="flex items-center gap-1 px-10 flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {tabs.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className="shrink-0 px-4 py-3 text-xs font-semibold transition-all relative whitespace-nowrap"
                            style={activeTab === tab
                                ? { color: '#6366f1', borderBottom: '2px solid #6366f1', marginBottom: -1 }
                                : { color: '#94a3b8', borderBottom: '2px solid transparent', marginBottom: -1 }}>
                            {tab === 'ALL' ? 'All' : tab === 'ARCHIVED' ? 'Archived' : tab.replace(/_/g, ' ')}
                            <span className="ml-1.5 text-xs"
                                style={{ color: activeTab === tab ? '#a5b4fc' : '#cbd5e1' }}>
                                {tab === 'ALL' ? allAssets.length : tab === 'ARCHIVED' ? archivedAssets.length : allAssets.filter((a: any) => a.assetType === tab).length}
                            </span>
                        </button>
                    ))}
                </div>
                {/* Search bar */}
                <div className="shrink-0 px-4">
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search assets or customers…"
                        className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-400 focus:bg-white transition-colors"
                        style={{ width: 220 }}
                    />
                </div>
            </div>
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 mb-6 mt-6 overflow-hidden">
                <div className="flex items-center gap-2.5 px-8 pt-5 pb-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <Layers size={15} color="#7c3aed" />
                    <p className="text-sm font-bold text-slate-700">Solution Journey</p>
                    <p className="text-xs text-slate-400 hidden md:block">Five levels from strategy to commercials</p>
                    <div style={{ flex: 1 }} />
                    <button onClick={toggleAllLevels}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors hover:bg-violet-50"
                        style={{ color: '#7c3aed' }}>
                        {allLevelsOpen ? 'Collapse all' : 'Expand all'}
                    </button>
                </div>

                <div className="px-8 py-2">
                    <RoadmapSection industryId={id as string} open={roadmapOpen} onToggle={() => setRoadmapOpen(o => !o)}
                        deckAssets={roadmapDeckAssets} onAssetsChanged={reload} />

                    <LevelRow
                        n={2}
                        icon={<FileText size={14} color="#7c3aed" />}
                        title="Latest Pitch to Enterprise"
                        subtitle="Most recent PPTX per customer"
                        count={latestPitchByCustomer.length}
                        open={pitchOpen}
                        onToggle={() => setPitchOpen(o => !o)}
                        search={latestPitchByCustomer.length > 0 && (
                            <input
                                type="text"
                                value={pitchSearch}
                                onClick={e => e.stopPropagation()}
                                onChange={e => setPitchSearch(e.target.value)}
                                placeholder="Search by customer or title…"
                                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-400 focus:bg-white transition-colors shrink-0"
                                style={{ width: 200 }}
                            />
                        )}>
                        {latestPitchByCustomer.length === 0 ? (
                            <p className="text-xs text-slate-300 italic">Nothing here yet</p>
                        ) : (
                            <div className="overflow-x-auto w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                <div className="flex gap-5 pb-2" style={{ width: 'max-content' }}>
                                    {latestPitchByCustomer
                                        .filter(({ name, asset }) => {
                                            const q = pitchSearch.trim().toLowerCase();
                                            if (!q) return true;
                                            return name.toLowerCase().includes(q) || asset.title?.toLowerCase().includes(q);
                                        })
                                        .map(({ name, asset }) => (
                                            <div key={asset.id} className="w-80">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <p className="text-xs font-semibold text-slate-500 truncate">{name}</p>
                                                    <p className="text-xs text-slate-300 shrink-0 ml-2">{new Date(asset.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <AssetCard asset={asset} industryCustomers={industry.customers || []} onReload={reload} />
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </LevelRow>

                    <LevelRow
                        n={3}
                        icon={<Play size={14} color="#7c3aed" />}
                        title="Demonstrations Built"
                        subtitle="All use cases demoed so far"
                        count={allDemos.length}
                        open={demoOpen}
                        onToggle={() => setDemoOpen(o => !o)}
                        search={allDemos.length > 0 && (
                            <input
                                type="text"
                                value={demoSearch}
                                onClick={e => e.stopPropagation()}
                                onChange={e => setDemoSearch(e.target.value)}
                                placeholder="Search by title or use case…"
                                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-400 focus:bg-white transition-colors shrink-0"
                                style={{ width: 200 }}
                            />
                        )}>
                        {allDemos.length === 0 ? (
                            <p className="text-xs text-slate-300 italic">Nothing here yet</p>
                        ) : (
                            <div className="overflow-x-auto w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                <div className="flex gap-5 pb-2" style={{ width: 'max-content' }}>
                                    {allDemos
                                        .filter((asset: any) => {
                                            const q = demoSearch.trim().toLowerCase();
                                            if (!q) return true;
                                            return asset.title?.toLowerCase().includes(q) || asset.useCases?.toLowerCase().includes(q);
                                        })
                                        .map((asset: any) => (
                                            <div key={asset.id} className="w-80">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <p className="text-xs font-semibold text-slate-500 truncate">{asset.useCases || asset.assetType.replace(/_/g, ' ')}</p>
                                                    <p className="text-xs text-slate-300 shrink-0 ml-2">{new Date(asset.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <AssetCard asset={asset} industryCustomers={industry.customers || []} onReload={reload} />
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </LevelRow>

                    <LevelRow
                        n={4}
                        icon={<FileText size={14} color="#7c3aed" />}
                        title="Playbook / Proposal / SOW"
                        subtitle="Latest documentation of solutions per customer"
                        count={latestDocByCustomer.length}
                        open={docOpen}
                        onToggle={() => setDocOpen(o => !o)}
                        search={latestDocByCustomer.length > 0 && (
                            <input
                                type="text"
                                value={docSearch}
                                onClick={e => e.stopPropagation()}
                                onChange={e => setDocSearch(e.target.value)}
                                placeholder="Search by customer or title…"
                                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-400 focus:bg-white transition-colors shrink-0"
                                style={{ width: 200 }}
                            />
                        )}>
                        {latestDocByCustomer.length === 0 ? (
                            <p className="text-xs text-slate-300 italic">Nothing here yet</p>
                        ) : (
                            <div className="overflow-x-auto w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                <div className="flex gap-5 pb-2" style={{ width: 'max-content' }}>
                                    {latestDocByCustomer
                                        .filter(({ name, asset }) => {
                                            const q = docSearch.trim().toLowerCase();
                                            if (!q) return true;
                                            return name.toLowerCase().includes(q) || asset.title?.toLowerCase().includes(q);
                                        })
                                        .map(({ name, asset }) => (
                                            <div key={asset.id} className="w-80">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <p className="text-xs font-semibold text-slate-500 truncate">{name} · {asset.assetType.replace(/_/g, ' ')}</p>
                                                    <p className="text-xs text-slate-300 shrink-0 ml-2">{new Date(asset.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <AssetCard asset={asset} industryCustomers={industry.customers || []} onReload={reload} />
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </LevelRow>

                    <LevelRow
                        n={5}
                        icon={<FileText size={14} color="#7c3aed" />}
                        title="Business Case / Financial Costings"
                        subtitle="Latest XLS costing per customer"
                        count={latestCaseByCustomer.length}
                        open={caseOpen}
                        onToggle={() => setCaseOpen(o => !o)}
                        search={latestCaseByCustomer.length > 0 && (
                            <input
                                type="text"
                                value={caseSearch}
                                onClick={e => e.stopPropagation()}
                                onChange={e => setCaseSearch(e.target.value)}
                                placeholder="Search by customer or title…"
                                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-400 focus:bg-white transition-colors shrink-0"
                                style={{ width: 200 }}
                            />
                        )}>
                        {latestCaseByCustomer.length === 0 ? (
                            <p className="text-xs text-slate-300 italic">Nothing here yet</p>
                        ) : (
                            <div className="overflow-x-auto w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                <div className="flex gap-5 pb-2" style={{ width: 'max-content' }}>
                                    {latestCaseByCustomer
                                        .filter(({ name, asset }) => {
                                            const q = caseSearch.trim().toLowerCase();
                                            if (!q) return true;
                                            return name.toLowerCase().includes(q) || asset.title?.toLowerCase().includes(q);
                                        })
                                        .map(({ name, asset }) => (
                                            <div key={asset.id} className="w-80">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <p className="text-xs font-semibold text-slate-500 truncate">{name}</p>
                                                    <p className="text-xs text-slate-300 shrink-0 ml-2">{new Date(asset.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <AssetCard asset={asset} industryCustomers={industry.customers || []} onReload={reload} />
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </LevelRow>

                    <LevelRow
                        n={6} isLast
                        icon={<BookOpen size={14} color="#7c3aed" />}
                        title="Whitepapers"
                        subtitle="Long-form thought leadership per solution"
                        count={allWhitepapers.length}
                        open={paperOpen}
                        onToggle={() => setPaperOpen(o => !o)}
                        search={allWhitepapers.length > 0 && (
                            <input
                                type="text"
                                value={paperSearch}
                                onClick={e => e.stopPropagation()}
                                onChange={e => setPaperSearch(e.target.value)}
                                placeholder="Search whitepapers…"
                                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-400 focus:bg-white transition-colors shrink-0"
                                style={{ width: 200 }}
                            />
                        )}>
                        {allWhitepapers.length === 0 ? (
                            <p className="text-xs text-slate-300 italic">Nothing here yet</p>
                        ) : (
                            <div className="overflow-x-auto w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                <div className="flex gap-5 pb-2" style={{ width: 'max-content' }}>
                                    {allWhitepapers
                                        .filter((asset: any) => {
                                            const q = paperSearch.trim().toLowerCase();
                                            if (!q) return true;
                                            return asset.title?.toLowerCase().includes(q) || asset.summary?.toLowerCase().includes(q);
                                        })
                                        .map((asset: any) => (
                                            <div key={asset.id} className="w-80">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <p className="text-xs font-semibold text-slate-500 truncate">{asset.title}</p>
                                                    <p className="text-xs text-slate-300 shrink-0 ml-2">{new Date(asset.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <AssetCard asset={asset} industryCustomers={industry.customers || []} onReload={reload} />
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </LevelRow>
                </div>
            </div>

            {/* Content */}
            <div className="pt-8 pb-12">
                {visibleAssets.length === 0 ? (
                    <div className="mx-10 bg-white border-2 border-slate-100 rounded-2xl p-16 text-center">
                        <FileText size={40} className="mx-auto text-slate-200 mb-3" />
                        <p className="text-slate-400">No assets yet.</p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Customer groups */}
                        {customerGroups.map(group => (
                            <div key={group.id}>
                                <div className="px-10 mb-4 flex items-center gap-3">
                                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{group.name}</h2>
                                    <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                                    <span className="text-xs text-slate-400">{group.assets.length}</span>
                                </div>
                                <div className="overflow-x-auto w-full" style={{ paddingLeft: 40, paddingRight: 40, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                    <div className="flex gap-5 pb-4" style={{ width: 'max-content' }}>
                                        {group.assets.map((asset: any) => (
                                            <AssetCard key={asset.id} asset={asset} industryCustomers={industry.customers || []} onReload={reload} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Unassigned assets */}
                        {unassigned.length > 0 && (
                            <div>
                                {customerGroups.length > 0 && (
                                    <div className="px-10 mb-4 flex items-center gap-3">
                                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Unassigned</h2>
                                        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                                        <span className="text-xs text-slate-300">{unassigned.length}</span>
                                    </div>
                                )}
                                <div className="overflow-x-auto w-full" style={{ paddingLeft: 40, paddingRight: 40, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                    <div className="flex gap-5 pb-4" style={{ width: 'max-content' }}>
                                        {unassigned.map((asset: any) => (
                                            <AssetCard key={asset.id} asset={asset} industryCustomers={industry.customers || []} onReload={reload} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}


function getVideoEmbedUrl(url: string): string | null {
    if (!url) return null;
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    // Direct video file
    if (url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)) return url;
    return null;
}

function PreviewModal({ asset, onClose }: { asset: any; onClose: () => void }) {
    const isDeck = ['PITCH_DECK', 'PROPOSAL', 'PRODUCT_PRESENTATION', 'CASE_STUDY'].includes(asset.assetType);
    const isVideo = ['DEMO_RECORDING', 'VIDEO_WALKTHROUGH', 'MEETING_RECORDING'].includes(asset.assetType);
    const isPdf = asset.assetType === 'PDF_DOCUMENT';
    const isNote = asset.assetType === 'CUSTOMER_SUMMARY_NOTE';

    const embedUrl = isVideo && asset.sourceLink ? getVideoEmbedUrl(asset.sourceLink) : null;
    const isDirectVideo = embedUrl && asset.sourceLink?.match(/\.(mp4|webm|ogg|mov)(\?|$)/i);
    // Use backend URL directly for file-proxy — Office Online must fetch a public URL, Vercel proxy won't work
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ps-backend-production-42e4.up.railway.app';
    const proxyUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/assets/${asset.id}/file-proxy`;
    const publicProxyUrl = `${backendUrl}/api/assets/${asset.id}/file-proxy`;
    const isGoogleSlides = asset.sourceLink?.includes('docs.google.com/presentation');
    const isUploadedFile = asset.sourceLink?.includes('railway.app') || asset.sourceLink?.includes('/uploads/');
    // Office Online needs a publicly accessible URL — use backend proxy directly
    const deckFileUrl = isDeck && asset.sourceLink
        ? (isGoogleSlides || isUploadedFile) ? publicProxyUrl : asset.sourceLink
        : null;
    const deckSrc = deckFileUrl
        ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(deckFileUrl)}`
        : null;
    const pdfSrc = isPdf && asset.sourceLink ? proxyUrl : null;

    const textContent = asset.summary || asset.content || asset.transcript;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [onClose]);

    const renderContent = () => {
        // 1. Deck with a link — interactive slides
        if (isDeck && deckSrc) {
            return <iframe src={deckSrc} className="w-full h-full" style={{ border: 'none' }} allowFullScreen />;
        }
        // 2. Video — embeddable player
        if (isVideo && embedUrl) {
            return isDirectVideo
                ? <video src={embedUrl} className="w-full h-full object-contain bg-black" controls autoPlay />
                : <iframe src={embedUrl} className="w-full h-full" style={{ border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen />;
        }
        // 3. PDF — iframe embed
        if (isPdf && pdfSrc) {
            return <iframe src={`${pdfSrc}#toolbar=1`} className="w-full h-full bg-white" style={{ border: 'none' }} />;
        }
        // 4. Text / note / video-without-link — rich content card
        if (isNote || isVideo || textContent) {
            return (
                <div className="h-full overflow-y-auto p-8" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
                    {textContent && (
                        <div className="mb-6 p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#a5b4fc' }}>
                                {isNote ? 'Summary Note' : 'Summary'}
                            </p>
                            <p className="text-sm text-slate-300 leading-relaxed">{textContent}</p>
                        </div>
                    )}
                    {/* External link fallback */}
                    {isVideo && !embedUrl && asset.sourceLink && (
                        <div className="mt-4 flex justify-center">
                            <a href={asset.sourceLink} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg font-medium"
                                style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
                                <ExternalLink size={12} /> Open video link
                            </a>
                        </div>
                    )}
                </div>
            );
        }
        // 5. Deck without a link — no source yet
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3">
                <FileText size={40} color="#475569" />
                <p className="text-slate-400 text-sm">No file link attached to this asset yet.</p>
                <a href={`/dashboard/assets/${asset.id}`}
                    className="text-xs px-4 py-2 rounded-lg font-medium"
                    style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
                    View full details →
                </a>
            </div>
        );
    };

    const modal = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}>
            <div className="relative flex flex-col rounded-2xl overflow-hidden shadow-2xl"
                style={{ width: '92vw', maxWidth: 1300, height: '90vh', background: isPdf ? '#525659' : '#000' }}
                onClick={e => e.stopPropagation()}>

                {/* Header bar */}
                <div className="flex items-center justify-between px-5 py-3 shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{asset.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#a5b4fc' }}>{asset.assetType?.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                        {asset.sourceLink && (
                            <a href={asset.sourceLink} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                                style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}
                                onClick={e => e.stopPropagation()}>
                                <ExternalLink size={12} /> Open original
                            </a>
                        )}
                        <a href={`/dashboard/assets/${asset.id}`}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                            style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}
                            onClick={e => e.stopPropagation()}>
                            <ExternalLink size={12} /> Full Details
                        </a>
                        <button onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                            style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 relative">
                    {renderContent()}
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modal, document.body);
}

function VideoThumbnail({ src }: { src: string }) {
    const [thumb, setThumb] = useState<string | null>(null);
    useEffect(() => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.src = src;
        video.currentTime = 3;
        video.muted = true;
        video.onloadeddata = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 320;
            canvas.height = video.videoHeight || 180;
            canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
            setThumb(canvas.toDataURL('image/jpeg'));
        };
    }, [src]);
    if (!thumb) return (
        <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.3)', border: '1.5px solid rgba(99,102,241,0.5)' }}>
            <Play size={18} color="#a5b4fc" fill="#a5b4fc" />
        </div>
    );
    return <img src={thumb} className="w-full h-full object-cover absolute inset-0" alt="" />;
}

function AssetCard({ asset, industryCustomers = [], onReload }: { asset: any; industryCustomers?: any[]; onReload?: () => void }) {
    const isVideo = ['DEMO_RECORDING', 'VIDEO_WALKTHROUGH', 'MEETING_RECORDING'].includes(asset.assetType);
    const isDeck = ['PITCH_DECK', 'PROPOSAL', 'PRODUCT_PRESENTATION', 'CASE_STUDY'].includes(asset.assetType);
    const isPdf = asset.assetType === 'PDF_DOCUMENT';
    const [expanded, setExpanded] = useState<string | null>(null);
    const [hovering, setHovering] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const assignedCustomers: any[] = (asset.customers || []).map((ac: any) => ac.customer).filter(Boolean);

    const isVideoAsset = isVideo;
    const hasPreview = true; // all asset types have something to show

    const sections = [
        { key: 'problem', label: 'Problem Stats', value: asset.problemStatement, bg: '#ef4444', light: '#fef2f2', text: '#991b1b' },
        {
            key: 'solution',
            label: isVideoAsset ? 'Solution' : (() => {
                const text = (asset.summary || asset.aiSummary || '').toLowerCase();
                return text.includes('platform') || text.includes('software') || text.includes('tool') || text.includes('system') ? 'Product' : 'Solution';
            })(),
            value: isVideoAsset ? asset.aiSummary : (asset.summary || asset.aiSummary),
            bg: '#22c55e', light: '#f0fdf4', text: '#166634'
        },
        { key: 'impact', label: 'Business Impact', value: asset.businessImpact, bg: '#06b6d4', light: '#ecfeff', text: '#155e75' },
    ].filter(s => s.value);

    return (
        <>
            {previewOpen && <PreviewModal asset={asset} onClose={() => setPreviewOpen(false)} />}

            <div
                className="group shrink-0 w-80 bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-indigo-300 hover:shadow-2xl"
                style={{ transition: 'transform 0.25s ease, box-shadow 0.25s ease', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.zIndex = '50'; setHovering(true); }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.zIndex = '1'; setHovering(false); setExpanded(null); }}>

                {/* Thumbnail — click opens preview */}
                {(() => {
                    const ytMatch = asset.sourceLink?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
                    const ytId = ytMatch?.[1];
                    const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
                    const bgStyle = ytThumb
                        ? { height: '160px', backgroundImage: `url(${ytThumb})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : { height: '160px', background: isVideo ? 'linear-gradient(135deg, #0f172a, #1e1b4b)' : 'linear-gradient(135deg, #f8fafc, #f1f5f9)' };
                    return (
                <div className="relative flex items-center justify-center cursor-pointer"
                    style={bgStyle}
                    onClick={() => setPreviewOpen(true)}>

                    {!ytThumb && isDeck && asset.sourceLink ? (
                        <iframe
                            src={asset.sourceLink.includes('docs.google.com/presentation')
                                ? `https://docs.google.com/presentation/d/${asset.sourceLink.split('/presentation/d/')[1]?.split('/')[0]}/preview`
                                : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(`https://ps-backend-production-42e4.up.railway.app/api/assets/${asset.id}/file-proxy`)}`}
                            className="w-full h-full"
                            style={{ border: 'none', pointerEvents: 'none' }}
                        />
                    ) : !ytThumb && isVideo && asset.sourceLink?.match(/\.(mp4|webm|mov)(\?|$)/i) ? (
                        <VideoThumbnail src={asset.sourceLink} />
                    ) : !ytThumb && isVideo ? (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(99,102,241,0.3)', border: '1.5px solid rgba(99,102,241,0.5)' }}>
                            <Play size={18} color="#a5b4fc" fill="#a5b4fc" />
                        </div>
                    ) : !ytThumb && isPdf && asset.sourceLink ? (
                        <PdfThumbnail url={`${process.env.NEXT_PUBLIC_API_URL}/api/assets/${asset.id}/file-proxy`} />
                    ) : !ytThumb ? (
                        <FileText size={32} color="#cbd5e1" />
                    ) : null}

                    {/* YouTube-style hover overlay */}
                    {hasPreview && (
                        <div className="absolute inset-0 flex items-center justify-center transition-opacity"
                            style={{ opacity: hovering ? 1 : 0, background: 'rgba(0,0,0,0.45)' }}>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                                    style={{ background: 'rgba(99,102,241,0.9)', boxShadow: '0 0 20px rgba(99,102,241,0.6)' }}>
                                    {isVideo
                                        ? <Play size={20} color="white" fill="white" />
                                        : <Maximize2 size={18} color="white" />}
                                </div>
                                <span className="text-white text-xs font-medium">{isVideo ? 'Play' : 'Preview'}</span>
                            </div>
                        </div>
                    )}

                    <div className="absolute top-2 right-2">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                                background: asset.status === 'PUBLISHED' ? '#dcfce7' : '#f1f5f9',
                                color: asset.status === 'PUBLISHED' ? '#15803d' : '#64748b'
                            }}>
                            {asset.status}
                        </span>
                    </div>
                </div>
                    );
                })()}

                {/* Card body */}
                <div className="px-4 pt-3 pb-2 cursor-pointer" style={{ height: 120 }} onClick={() => window.location.href = `/dashboard/assets/${asset.id}`}>
                    <p className="text-sm font-semibold text-slate-800 mb-1 line-clamp-1">{asset.title}</p>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{asset.assetType?.replace(/_/g, ' ')}</p>
                    {(asset.summary) && (
                        <p className="text-xs text-slate-500 line-clamp-4 leading-relaxed mt-1">
                            {asset.summary}
                        </p>
                    )}
                </div>

                {/* Customer tag row */}
                {assignedCustomers.length === 0 && industryCustomers.length > 0 && (
                    <div className="px-4 pb-3 relative">
                        {assignedCustomers.length > 0 ? (
                            <button onClick={() => setAssignOpen(v => !v)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                                style={{ background: '#ede9fe', color: '#6d28d9' }}>
                                {assignedCustomers[0].name}
                                <span className="opacity-50 text-xs">▾</span>
                            </button>
                        ) : (
                            <button onClick={() => setAssignOpen(v => !v)}
                                className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-500 transition-colors">
                                <span>+ Assign customer</span>
                            </button>
                        )}
                        {assignOpen && (
                            <div className="absolute left-4 bottom-full mb-1 z-50 bg-white rounded-xl shadow-xl border border-slate-100 py-1 min-w-[180px]">
                                {industryCustomers.map((c: any) => (
                                    <button key={c.id} onClick={async () => {
                                        setAssignOpen(false);
                                        await api.post(`/api/assets/${asset.id}/assign-customer`, { customerId: c.id });
                                        onReload?.();
                                    }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">
                                        {c.name}
                                    </button>
                                ))}
                                {assignedCustomers.length > 0 && (
                                    <button onClick={async () => {
                                        setAssignOpen(false);
                                        await api.post(`/api/assets/${asset.id}/assign-customer`, {});
                                        onReload?.();
                                    }} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-400 border-t border-slate-100">
                                        Remove customer
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}