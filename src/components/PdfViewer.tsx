'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';

export default function PdfViewer({ url }: { url: string }) {
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const scale = 2;
    const [failed, setFailed] = useState(false);
    const [loading, setLoading] = useState(true);
    const pdfRef = useRef<any>(null);
    const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const pdfjsLib = await import('pdfjs-dist');
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
                const pdf = await pdfjsLib.getDocument({ url, withCredentials: false }).promise;
                if (cancelled) return;
                pdfRef.current = pdf;
                setTotalPages(pdf.numPages);
                setLoading(false);
            } catch {
                if (!cancelled) { setFailed(true); setLoading(false); }
            }
        })();
        return () => { cancelled = true; };
    }, [url]);

    useEffect(() => {
        if (!pdfRef.current || loading || totalPages === 0) return;
        let cancelled = false;
        (async () => {
            for (let i = 1; i <= totalPages; i++) {
                if (cancelled) break;
                try {
                    const page = await pdfRef.current.getPage(i);
                    if (cancelled) break;
                    const canvas = canvasRefs.current[i - 1];
                    if (!canvas) continue;
                    const viewport = page.getViewport({ scale });
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
                } catch {}
            }
        })();
        return () => { cancelled = true; };
    }, [loading, totalPages]);

    // Track which page is in view while scrolling
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;
        const handleScroll = () => {
            const canvases = canvasRefs.current;
            for (let i = 0; i < canvases.length; i++) {
                const c = canvases[i];
                if (!c) continue;
                const rect = c.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                if (rect.top >= containerRect.top - rect.height / 2) {
                    setCurrentPage(i + 1);
                    break;
                }
            }
        };
        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [loading]);

    if (failed) return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
            <FileText size={36} color="#cbd5e1" />
            <p className="text-sm text-slate-400">Could not load PDF</p>
        </div>
    );

    return (
        <div className="flex flex-col bg-slate-100 relative" style={{ height: 480 }}>
            {/* Toolbar */}
            <div className="flex items-center px-4 py-2 bg-white border-b border-slate-200 shrink-0">
                <span className="text-sm text-slate-500">{loading ? '…' : `${totalPages} pages`}</span>
            </div>

            {/* Scrollable pages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col items-center gap-4 py-4 px-2">
                {loading ? (
                    <div className="flex items-center justify-center w-full h-full">
                        <div className="w-6 h-6 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                    </div>
                ) : (
                    Array.from({ length: totalPages }, (_, i) => (
                        <canvas key={i} ref={el => { canvasRefs.current[i] = el; }}
                            className="shadow-md rounded bg-white max-w-full" />
                    ))
                )}
            </div>

            {/* Floating page indicator */}
            {!loading && totalPages > 0 && (
                <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full text-xs font-medium pointer-events-none"
                    style={{ background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)' }}>
                    {currentPage} / {totalPages}
                </div>
            )}
        </div>
    );
}
