export default function Loading() {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#faf8f4',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
      zIndex: 9999,
    }}>
      <style>{`
        @keyframes spin-ring {
          0%   { stroke-dashoffset: 200; }
          50%  { stroke-dashoffset: 50; }
          100% { stroke-dashoffset: 200; }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .spinner-ring {
          animation: rotate 1.6s linear infinite;
          transform-origin: center;
        }
        .spinner-arc {
          stroke-dasharray: 220;
          stroke-dashoffset: 60;
        }
        .ph-label {
          animation: fade-up 0.5s ease forwards;
        }
      `}</style>

      {/* Spinning ring with PH in center */}
      <div style={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="72" height="72" viewBox="0 0 72 72" className="spinner-ring" style={{ position: 'absolute' }}>
          {/* Track */}
          <circle cx="36" cy="36" r="30" fill="none" stroke="#e8d5b0" strokeWidth="3" />
          {/* Arc */}
          <circle cx="36" cy="36" r="30" fill="none" stroke="#d4a853" strokeWidth="3"
            strokeLinecap="round" className="spinner-arc"
            style={{ transformOrigin: '36px 36px' }} />
        </svg>
        {/* PH monogram */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: '#1c1917',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 15,
          letterSpacing: '-0.02em', userSelect: 'none',
        }}>
          <span style={{ color: '#d4a853' }}>P</span>
          <span style={{ color: '#faf8f4' }}>H</span>
        </div>
      </div>

      {/* Label */}
      <div className="ph-label" style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#1c1917', fontFamily: 'Georgia, serif', letterSpacing: '0.04em', marginBottom: 3 }}>
          Solution Hub
        </p>
        <p style={{ fontSize: 10, color: '#b8b0a6', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Loading…
        </p>
      </div>
    </div>
  );
}
