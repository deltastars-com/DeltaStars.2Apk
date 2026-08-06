
import { sovereignBackend } from './SovereignBackend';

export class ApiError extends Error {
    status: number;
    data: any;
    constructor(message: string, status: number, data: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Delta Stars API Core v60.0
 * محرك تواصل موحد يربط الواجهات بالنظام السيادي.
 */
export const setFetcher = (f: any) => {
    (window as any)._deltaSovereignFetcher = f;
};

const getFetcher = () => (window as any)._deltaSovereignFetcher || window.fetch;

const api = {
    // --- AUTH ENGINE ---
    async sendOtp(phone: string) {
        try {
            const res = await getFetcher()('/api/health'); // Just a health check for now
            return await sovereignBackend.sendOTP(phone);
        } catch (e) {
            return await sovereignBackend.sendOTP(phone);
        }
    },

    async verifyOtp(phone: string, code: string) {
        return await sovereignBackend.verifyOTP(phone, code);
    },

    async login(phone: string) {
        return await sovereignBackend.authenticate(phone);
    },

    // --- ORDER ENGINE ---
    async createOrder(payload: any) {
        try {
            const res = await getFetcher()('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) return await res.json();
        } catch (e) {
            console.warn("Backend offline, using Sovereign fallback");
        }
        return await sovereignBackend.createOrder(payload);
    },

    // --- MONITORING ---
    getSystemLogs() {
        return sovereignBackend.getLogs();
    },

    // --- REPAIR ---
    async triggerEmergencyRepair() {
        return await sovereignBackend.fullSystemReset();
    },

    // --- DATA FETCHING ---
    async get(endpoint: string) {
        try {
            const res = await getFetcher()(`/api/${endpoint}`);
            if (res.ok) return await res.json();
        } catch (e) {
            console.warn(`Backend offline for ${endpoint}, using Local fallback`);
        }
        
        if(endpoint.includes('products')) {
             const saved = localStorage.getItem('delta-products-v50');
             return saved ? JSON.parse(saved) : [];
        }
        return [];
    }
};

export default api;
