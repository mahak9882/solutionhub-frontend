import axios from 'axios';

const api = axios.create({
    baseURL: '',
});

// Attach the Clerk session token client-side (same proven approach the file-upload
// flow already uses) instead of relying on the Next.js API proxy's server-side
// auth() call, which has been unreliable with this Next.js/Clerk version pairing.
api.interceptors.request.use(async (config) => {
    try {
        if (typeof window === 'undefined') return config;
        const clerk = (window as any).Clerk;
        const token = await clerk?.session?.getToken();
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch {
        // no session yet (e.g. public pages) — proceed unauthenticated
    }
    return config;
});

export default api;