import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://ps-backend-production-42e4.up.railway.app';

async function handler(req: NextRequest) {
    // Prefer a token the client already attached (fetched via Clerk's client-side
    // session — proven reliable) over this route's own server-side auth() lookup,
    // which has been inconsistent with this Next.js/Clerk version pairing.
    const incomingAuth = req.headers.get('authorization');
    let token: string | null = incomingAuth ? incomingAuth.replace(/^Bearer /i, '') : null;

    if (!token) {
        try {
            const { getToken } = await auth();
            token = await getToken();
        } catch { }
    }

    const pathname = req.nextUrl.pathname;
    const search = req.nextUrl.search;
    const url = `${BACKEND_URL}${pathname}${search}`;

    console.log('Proxying to:', url, req.method);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const contentType = req.headers.get('content-type') || '';
    let body: any = undefined;

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'DELETE') {
        if (contentType.includes('multipart/form-data')) {
            // Forward raw bytes — keep the original content-type (with boundary)
            body = await req.arrayBuffer();
            headers['content-type'] = contentType;
        } else {
            body = await req.text();
            headers['content-type'] = 'application/json';
        }
    }

    try {
        const res = await fetch(url, {
            method: req.method,
            headers,
            body,
            // @ts-ignore — disable compression to preserve raw binary
            duplex: 'half',
        });

        const resContentType = res.headers.get('content-type') || '';
        if (resContentType.includes('application/json')) {
            const data = await res.json();
            return NextResponse.json(data, { status: res.status });
        } else {
            // Binary / non-JSON response — stream back as-is
            const buf = await res.arrayBuffer();
            return new NextResponse(buf, {
                status: res.status,
                headers: { 'content-type': resContentType },
            });
        }
    } catch (err) {
        console.error('Proxy fetch error:', err);
        return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
    }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
