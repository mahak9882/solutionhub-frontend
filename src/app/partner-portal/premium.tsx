'use client';

// Presentation-only helpers for the Partner Accelerator Portal.
// No business logic lives here — purely visual physics.

import { useCallback, useRef } from 'react';

export const PAGE_BG = 'linear-gradient(180deg, #fafbfc 0%, #f2f4f8 100%)';

// Immersive, near-imperceptible ambient environment:
// slow aurora fields + architectural grid + film grain + cursor spotlight.
export function AmbientEnvironment() {
    return (
        <>
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
                <div className="pp-grid" />
                <div className="pp-aurora pp-aurora-a w-[640px] h-[640px] -top-56 -left-48 opacity-[0.5]"
                    style={{ background: 'radial-gradient(circle, rgba(199,210,254,0.55) 0%, transparent 62%)' }} />
                <div className="pp-aurora pp-aurora-b w-[700px] h-[700px] top-1/4 -right-64 opacity-[0.45]"
                    style={{ background: 'radial-gradient(circle, rgba(186,230,253,0.5) 0%, transparent 62%)' }} />
                <div className="pp-aurora pp-aurora-c w-[560px] h-[560px] -bottom-56 left-1/4 opacity-[0.4]"
                    style={{ background: 'radial-gradient(circle, rgba(226,232,240,0.8) 0%, transparent 62%)' }} />
            </div>
            <div className="pp-noise" aria-hidden />
        </>
    );
}

// Tracks the cursor inside a .pp-card so its internal highlight follows the mouse.
export function useCardGlow() {
    return useCallback((e: React.MouseEvent<HTMLElement>) => {
        const el = e.currentTarget as HTMLElement;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--px', `${e.clientX - r.left}px`);
        el.style.setProperty('--py', `${e.clientY - r.top}px`);
    }, []);
}

// Subtle mouse-follow perspective tilt. Max a few degrees — physically believable,
// spring-returns on leave. rAF-throttled, transform-only (GPU).
export function TiltCard({
    children,
    className = '',
    style,
    max = 3,
    onMouseMove,
}: {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    max?: number;
    onMouseMove?: (e: React.MouseEvent<HTMLElement>) => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const frame = useRef<number>(0);

    const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        onMouseMove?.(e);
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;   // -0.5 .. 0.5
        const ny = (e.clientY - r.top) / r.height - 0.5;
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => {
            el.style.transform =
                `perspective(1200px) rotateX(${(-ny * max).toFixed(2)}deg) rotateY(${(nx * max).toFixed(2)}deg) translateZ(0)`;
        });
    }, [max, onMouseMove]);

    const handleLeave = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        cancelAnimationFrame(frame.current);
        el.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0)';
    }, []);

    return (
        <div
            ref={ref}
            className={className}
            style={{ transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)', willChange: 'transform', ...style }}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
        >
            {children}
        </div>
    );
}
