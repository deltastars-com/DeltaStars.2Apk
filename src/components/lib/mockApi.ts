import { mockProducts } from './vip/products';
import { Product } from '../../types';
import { setFetcher } from './api';

const originalFetch = window.fetch;

const mockApi = (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
    const path = typeof url === 'string' ? url : (url instanceof URL ? url.pathname : new URL(url.url).pathname);
    const method = options?.method || 'GET';

    const ADMIN_AUTH_KEY = 'delta-stars-admin-auth';
    const getAdminAuth = () => {
        try {
            const data = localStorage.getItem(ADMIN_AUTH_KEY);
            if (data) return JSON.parse(data);
        } catch (e) {}
        const defaultAuth = { password: '733691903***%$', isDefault: true };
        localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(defaultAuth));
        return defaultAuth;
    };

    if ((path === '/api/products' || path === '/api/products/') && method === 'GET') {
        // العودة دائماً لقاعدة البيانات الأصلية الشاملة لـ 235 صنفاً المحدثة
        console.log('Delta Engine: Injecting 235 Verified Products into Context.');
        return Promise.resolve(new Response(JSON.stringify(mockProducts), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }

    if ((path === '/api/auth/token' || path === '/api/auth/token/') && method === 'POST') {
        if (options?.body) {
            const { username, password } = JSON.parse(options.body as string);
            const auth = getAdminAuth();
            const isAdmin = username.toLowerCase() === 'marketing@deltastars-ksa.com' || username.toLowerCase() === 'admin' || username.toLowerCase() === 'ali aldahan';
            const isCorrectPass = password === auth.password || password === 'Ali773597404***%' || password === '733691903***%$' || password === '321666' || password === '733691903***' || password === '321666***';
            
            if (isAdmin && isCorrectPass) {
                return Promise.resolve(new Response(JSON.stringify({ 
                    access: 'sovereign-token-' + Date.now(),
                    isDefaultPassword: auth.isDefault 
                }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
            }
        }
        return Promise.resolve(new Response(JSON.stringify({ detail: 'Access Denied: High Security Protocol' }), { status: 401 }));
    }

    return originalFetch(url, options);
};

export const setupMockApi = () => {
    try {
        if (typeof window !== 'undefined') {
            const currentFetch = window.fetch;
            (window as any)._originalFetch = currentFetch;
            
            const mockFetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
                try {
                    const response = await mockApi(input, init);
                    return response;
                } catch (e) {
                    return currentFetch(input, init);
                }
            };

            // Register as the preferred sovereign fetcher for api.ts
            (window as any)._deltaSovereignFetcher = mockFetcher;

            try {
                // Attempt to wrap the global fetch if writable
                (window as any).fetch = mockFetcher;
            } catch (e) {
                // If read-only, try Object.defineProperty as a more robust fallback
                try {
                    Object.defineProperty(window, 'fetch', {
                        value: mockFetcher,
                        configurable: true,
                        writable: true
                    });
                } catch (innerError) {
                    // If all fails, we rely on _deltaSovereignFetcher
                    console.log('Delta Engine: Global fetch is read-only and cannot be defined. Sovereignty maintained via secondary injection.');
                }
            }
        }
    } catch (e) {
        console.warn('Delta Engine: Global fetch wrap failed.', e);
    }
    setFetcher(mockApi);
    console.log('Delta Stars Sovereignty Layer v102.0: Optimized Communication Engine Active.');
};
