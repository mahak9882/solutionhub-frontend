'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';

export default function PdfThumbnail({ url }: { url: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const pdfjsLib = await import('pdfjs-dist');
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

                const pdf = await pdfjsLib.getDocument({ url, withCredentials: false }).promise;
                if (cancelled) return;
                const page = await pdf.getPage(1);
                if (cancelled) return;

                const canvas = canvasRef.current;
                if (!canvas) return;

                const viewport = page.getViewport({ scale: 1 });
                const scale = canvas.offsetWidth / viewport.width || 1;
                const scaled = page.getViewport({ scale });

                canvas.width = scaled.width;
                canvas.height = scaled.height;

                await page.render({ canvasContext: canvas.getContext('2d')!, viewport: scaled, canvas }).promise;
            } catch {
                if (!cancelled) setFailed(true);
            }
        })();
        return () => { cancelled = true; };
    }, [url]);

    if (failed) return <FileText size={32} color="#cbd5e1" />;

    return <canvas ref={canvasRef} className="w-full h-full object-cover" style={{ display: 'block' }} />;
}
