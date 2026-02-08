import api from './api';

export const authService = {
    login: async (email, password) => { const r = await api.post('/auth/login/', { email, password }); return r.data; },
    verifyOTP: async (tempToken, otp) => {
        const r = await api.post('/auth/verify-otp/', { temp_token: tempToken, otp });
        if (r.data.status === 'success') {
            localStorage.setItem('access_token', r.data.access_token);
            localStorage.setItem('refresh_token', r.data.refresh_token);
            localStorage.setItem('user', JSON.stringify(r.data.user));
        }
        return r.data;
    },
    logout: async () => { try { await api.post('/auth/logout/'); } catch {} finally { localStorage.clear(); } },
    getProfile: async () => { const r = await api.get('/auth/profile/'); return r.data; },
    isAuthenticated: () => !!localStorage.getItem('access_token'),
    getCurrentUser: () => { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; },
};
