'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Brain, AlertCircle, TrendingUp, MessageSquare, CheckCircle, Clock, Link2, Upload } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';

type Mode = 'url' | 'file' | 'manual';

export default function VideoIntelligencePage() {
    const { id } = useParams();
    const router = useRouter();
    const [mode, setMode] = useState<Mode>('url');
    const [videoUrl, setVideoUrl] = useState('');
    const [transcript, setTranscript] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const handleProcess = async () => {
        setProcessing(true);
        setError('');
        try {
            if (mode === 'url') {
                if (!videoUrl.trim()) throw new Error('Enter a video URL');
                await api.post('/api/video/process-url', { assetId: id, videoUrl });
            } else if (mode === 'file') {
                if (!file) throw new Error('Select a video file');
                const formData = new FormData();
                formData.append('video', file);
                formData.append('assetId', String(id));
                await api.post('/api/video/process-file', formData);
            } else {
                if (!transcript.trim()) throw new Error('Enter a transcript');
                await api.post('/api/video/process-manual', { assetId: id, transcript });
            }
            setDone(true);
            setTimeout(() => router.push(`/dashboard/assets/${id}`), 2000);
        } catch (err: any) {
            setError(err.message || 'Processing failed.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <Link href={`/dashboard/assets/${id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft size={16} /> Back to Asset
            </Link>
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Brain size={24} className="text-indigo-500" />
                    <h1 className="text-3xl font-semibold">Video Intelligence</h1>
                </div>
                <p className="text-muted-foreground">Claude will extract structured business intelligence from your video.</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                    { key: 'url', icon: Link2, label: 'SharePoint / Public URL', desc: 'Paste a public video link' },
                    { key: 'file', icon: Upload, label: 'Upload Video', desc: 'Upload MP4 or audio file' },
                    { key: 'manual', icon: Brain, label: 'Paste Transcript', desc: 'Already have a transcript?' },
                ].map((m) => {
                    const Icon = m.icon;
                    return (
                        <button key={m.key} onClick={() => setMode(m.key as Mode)}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${mode === m.key ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                            <Icon size={18} className={mode === m.key ? 'text-indigo-500' : 'text-slate-400'} />
                            <p className={`text-sm font-medium mt-2 ${mode === m.key ? 'text-indigo-700' : ''}`}>{m.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                    { icon: Clock, label: 'Topic Segmentation' },
                    { icon: AlertCircle, label: 'Pain Points' },
                    { icon: TrendingUp, label: 'Business Metrics' },
                    { icon: MessageSquare, label: 'Objections' },
                    { icon: CheckCircle, label: 'Follow-ups' },
                    { icon: Brain, label: 'AI Summary' },
                ].map((item) => {
                    const Icon = item.icon;
                    return (
                        <div key={item.label} className="bg-white border-2 border-slate-200 rounded-lg p-3 flex items-center gap-3">
                            <Icon size={14} className="text-indigo-500 shrink-0" />
                            <p className="text-sm">{item.label}</p>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-lg p-6">
                {mode === 'url' && (
                    <div>
                        <label className="text-sm font-medium block mb-2">SharePoint or Public Video URL</label>
                        <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                            placeholder="https://company.sharepoint.com/video... or https://..."
                            className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500" />
                        <p className="text-xs text-muted-foreground mt-2">Works with public SharePoint links and any direct video URL. Private SharePoint links require manual transcript.</p>
                    </div>
                )}

                {mode === 'file' && (
                    <div>
                        <label className="text-sm font-medium block mb-2">Upload Video or Audio File</label>
                        <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${file ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}>
                            <Upload size={24} className="mx-auto text-slate-300 mb-3" />
                            {file ? (
                                <div>
                                    <p className="text-sm font-medium text-indigo-600">{file.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm text-muted-foreground">Drag and drop or click to upload</p>
                                    <p className="text-xs text-muted-foreground mt-1">MP4, MP3, WAV, M4A supported</p>
                                </div>
                            )}
                            <input type="file" accept="video/*,audio/*" className="hidden" id="file-upload"
                                onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
                            <label htmlFor="file-upload" className="mt-3 inline-block px-4 py-2 bg-white border-2 border-slate-200 rounded-lg text-sm cursor-pointer hover:border-slate-300">
                                Browse Files
                            </label>
                        </div>
                    </div>
                )}

                {mode === 'manual' && (
                    <div>
                        <label className="text-sm font-medium block mb-2">Paste Transcript</label>
                        <textarea value={transcript} onChange={e => setTranscript(e.target.value)} rows={12}
                            placeholder={`[00:00:00] Speaker A: Welcome everyone...\n[00:02:30] Customer: We've been struggling with...`}
                            className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 resize-none font-mono" />
                    </div>
                )}

                {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
                {done && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                        ✅ Intelligence extracted! Redirecting...
                    </div>
                )}

                <div className="flex justify-end mt-4">
                    <button onClick={handleProcess} disabled={processing}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                        {processing ? '⟳ Processing...' : <><Brain size={16} /> Extract Intelligence</>}
                    </button>
                </div>
            </div>
        </div>
    );
}