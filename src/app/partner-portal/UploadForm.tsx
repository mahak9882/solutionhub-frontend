'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { FileText, CloudUpload, Trash2, ChevronDown, CheckCircle2, Send } from 'lucide-react';
import api from '@/lib/axios';
import { useCardGlow } from './premium';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ps-backend-production-42e4.up.railway.app';

const inputCls = "pp-input w-full px-4 py-3 bg-white/90 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";
const inputStyle = { border: '1px solid rgba(15,23,42,0.08)' };
const labelCls = "text-[13px] font-medium text-slate-700 mb-1.5 block";

export default function UploadForm({ onDone }: { onDone?: () => void }) {
    const { getToken } = useAuth();
    const glow = useCardGlow();
    const [industries, setIndustries] = useState<any[]>([]);
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [industryId, setIndustryId] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [pct, setPct] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showMore, setShowMore] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [extra, setExtra] = useState({
        problemStatement: '', businessImpact: '', useCases: '', integrations: '',
        architecture: '', roi: '',
    });
    const setExtraField = (k: string, v: string) => setExtra(p => ({ ...p, [k]: v }));

    useEffect(() => {
        api.get('/api/industries').then(r => setIndustries(r.data.data || [])).catch(() => {});
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        setFiles(prev => [...prev, ...selected]);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
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

    const submit = async () => {
        setError('');
        setSuccess(false);
        if (!files.length) { setError('Choose at least one file.'); return; }
        setUploading(true);
        try {
            const fd = new FormData();
            files.forEach(f => fd.append('files', f));
            fd.append('requiresReview', 'true');
            if (industryId) fd.append('industryId', industryId);
            if (title.trim()) fd.append('title', title.trim());
            if (summary.trim()) fd.append('summary', summary.trim());
            Object.entries(extra).forEach(([k, v]) => { if (v.trim()) fd.append(k, v.trim()); });
            const token = await getToken();
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${BACKEND_URL}/api/assets/upload-files`);
                if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.upload.onprogress = e => { if (e.lengthComputable) setPct(Math.round((e.loaded / e.total) * 100)); };
                xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.responseText));
                xhr.onerror = () => reject(new Error('Network error'));
                xhr.send(fd);
            });
            setTitle(''); setSummary(''); setFiles([]); setPct(0);
            setExtra({ problemStatement: '', businessImpact: '', useCases: '', integrations: '', architecture: '', roi: '' });
            setShowMore(false);
            setSuccess(true);
            onDone?.();
        } catch {
            setError('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div
            className="pp-reveal pp-card pp-ring rounded-3xl bg-white/85"
            style={{
                animationDelay: '0.28s',
                boxShadow: '0 40px 90px -30px rgba(15,23,42,0.25), 0 1px 0 rgba(255,255,255,0.9) inset',
                border: '1px solid rgba(15,23,42,0.06)',
            }}
            onMouseMove={glow}>
            <div className="p-9">
                <div className="grid grid-cols-2 gap-5 mb-5">
                    <div>
                        <label className={labelCls}>Solution Name</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your solution a name"
                            className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                        <label className={labelCls}>Industry</label>
                        <select value={industryId} onChange={e => setIndustryId(e.target.value)} className={inputCls} style={inputStyle}>
                            <option value="">Select industry</option>
                            {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="mb-5">
                    <label className={labelCls}>Short Description</label>
                    <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={2}
                        placeholder="What does it do, in a sentence or two?"
                        className={`${inputCls} resize-none`} style={inputStyle} />
                </div>

                <div className="mb-5">
                    <label className={labelCls}>Files</label>
                    <div className="relative flex flex-col items-center justify-center w-full rounded-2xl border border-dashed"
                        style={{
                            borderColor: dragOver ? '#6366f1' : 'rgba(15,23,42,0.14)',
                            background: dragOver ? 'rgba(99,102,241,0.045)' : 'linear-gradient(180deg, rgba(248,250,252,0.7), rgba(241,245,249,0.5))',
                            minHeight: 136,
                            transform: dragOver ? 'scale(1.008)' : 'scale(1)',
                            transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
                        }}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}>
                        <input id="partner-file-input" type="file" multiple className="hidden" onChange={handleFileChange} />
                        <input id="partner-folder-input" type="file" className="hidden" onChange={handleFileChange} {...{ webkitdirectory: '', directory: '' } as any} />
                        <div className="pp-float w-11 h-11 rounded-2xl flex items-center justify-center mb-2.5"
                            style={{ background: 'linear-gradient(145deg, #ffffff, #eef1f6)', boxShadow: '0 10px 24px -10px rgba(15,23,42,0.2), 0 1px 0 rgba(255,255,255,0.9) inset' }}>
                            <CloudUpload size={19} color="#475569" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">
                            <label htmlFor="partner-file-input" className="cursor-pointer font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-indigo-400 transition-colors">Browse files</label>
                            <span className="text-slate-300 mx-1.5">·</span>
                            <label htmlFor="partner-folder-input" className="cursor-pointer font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-indigo-400 transition-colors">select a folder</label>
                            <span className="text-slate-400 mx-1.5">or drag & drop here</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-1.5">Any file type · up to 600 MB per file</p>
                    </div>
                    {files.length > 0 && (
                        <div className="space-y-2 mt-3">
                            {files.map((f, i) => (
                                <div key={i} className="pp-reveal pp-card pp-lift flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/90"
                                    style={{ animationDelay: `${Math.min(i, 6) * 0.05}s`, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 4px 14px -6px rgba(15,23,42,0.08)' }}>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                        style={{ background: 'linear-gradient(145deg, #f8fafc, #eef1f6)' }}>
                                        <FileText size={13} color="#475569" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-700 truncate">{f.name}</p>
                                        <p className="text-xs text-slate-400">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                                    </div>
                                    <button onClick={() => removeFile(i)}
                                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors duration-300">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mb-7">
                    <button type="button" onClick={() => setShowMore(v => !v)}
                        className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-300">
                        <ChevronDown size={14} className={`transition-transform duration-300 ${showMore ? 'rotate-180' : ''}`} />
                        Add more details
                    </button>
                    {showMore && (
                        <div className="pp-reveal mt-3 space-y-4 p-6 rounded-2xl"
                            style={{ background: 'linear-gradient(180deg, rgba(248,250,252,0.8), rgba(241,245,249,0.6))', border: '1px solid rgba(15,23,42,0.05)' }}>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Problem Statement</label>
                                    <textarea value={extra.problemStatement} onChange={e => setExtraField('problemStatement', e.target.value)} rows={2}
                                        className={`${inputCls} resize-none`} style={inputStyle} />
                                </div>
                                <div>
                                    <label className={labelCls}>Business Value</label>
                                    <textarea value={extra.businessImpact} onChange={e => setExtraField('businessImpact', e.target.value)} rows={2}
                                        className={`${inputCls} resize-none`} style={inputStyle} />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Use Cases</label>
                                <textarea value={extra.useCases} onChange={e => setExtraField('useCases', e.target.value)} rows={2}
                                    className={`${inputCls} resize-none`} style={inputStyle} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Integrations</label>
                                    <input value={extra.integrations} onChange={e => setExtraField('integrations', e.target.value)} className={inputCls} style={inputStyle} />
                                </div>
                                <div>
                                    <label className={labelCls}>Architecture</label>
                                    <input value={extra.architecture} onChange={e => setExtraField('architecture', e.target.value)} className={inputCls} style={inputStyle} />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>ROI</label>
                                <input value={extra.roi} onChange={e => setExtraField('roi', e.target.value)} className={inputCls} style={inputStyle} />
                            </div>
                        </div>
                    )}
                </div>

                {uploading && (
                    <div className="h-1.5 rounded-full mb-5 overflow-hidden" style={{ background: 'rgba(15,23,42,0.06)' }}>
                        <div className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #334155, #6366f1)' }} />
                    </div>
                )}
                {success && (
                    <div className="pp-reveal flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5"
                        style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <CheckCircle2 size={15} color="#059669" />
                        <p className="text-sm font-medium text-emerald-700">Submitted! Track its status under My Solutions.</p>
                    </div>
                )}
                {error && <p className="text-sm text-red-500 mb-5">{error}</p>}

                <button onClick={submit} disabled={uploading}
                    className="pp-btn group inline-flex items-center gap-2.5 px-7 py-3 text-white rounded-xl text-sm font-medium disabled:opacity-60"
                    style={{
                        background: 'linear-gradient(160deg, #1e293b, #0f172a)',
                        boxShadow: '0 18px 36px -14px rgba(15,23,42,0.5), 0 0 0 1px rgba(99,102,241,0.12), 0 1px 0 rgba(255,255,255,0.12) inset',
                    }}>
                    <span className="pp-btn-sweep" />
                    <Send size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" style={{ color: '#a5b4fc' }} />
                    {uploading ? `Uploading… ${pct}%` : 'Submit for Review'}
                </button>
            </div>
        </div>
    );
}
