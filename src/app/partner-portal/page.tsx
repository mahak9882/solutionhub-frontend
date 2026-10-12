'use client';

import UploadForm from './UploadForm';

export default function PartnerApplySolutionPage() {
    return (
        <div>
            <div className="mb-10">
                <p className="pp-reveal text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 mb-4"
                    style={{ animationDelay: '0.05s' }}>
                    Submit a Solution
                </p>
                <h1 className="pp-reveal text-[38px] font-semibold tracking-tight text-slate-900 leading-[1.1]"
                    style={{ animationDelay: '0.12s' }}>
                    Share your next{' '}
                    <span style={{
                        background: 'linear-gradient(100deg, #0f172a 10%, #475569 45%, #6366f1 90%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        big solution
                    </span>
                </h1>
                <p className="pp-reveal text-sm text-slate-500 mt-3 max-w-md leading-relaxed"
                    style={{ animationDelay: '0.2s' }}>
                    Upload your solution and our team will review it for the Solution Hub.
                </p>
            </div>
            <UploadForm />
        </div>
    );
}
