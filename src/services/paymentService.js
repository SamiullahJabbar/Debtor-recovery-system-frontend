import api from './api';

export const paymentService = {
    // Debtor payments
    getDebtorPayments: async (debtorId) => (await api.get(`/payments/debtors/${debtorId}/`)).data,
    recordPayment: async (debtorId, data) => (await api.post(`/payments/debtors/${debtorId}/`, data)).data,

    // All payments (Admin/Accountant)
    getPayments: async (params = {}) => (await api.get('/payments/', { params })).data,
    getMyAssignedPayments: async (params = {}) => (await api.get('/payments/my-assigned/', { params })).data,
    verifyPayment: async (paymentId, action) => (await api.post(`/payments/${paymentId}/verify/`, { action })).data,

    // Payment links
    generatePaymentLink: async (data) => (await api.post('/payments/generate-link/', data)).data,
    getPaymentLinks: async (params = {}) => (await api.get('/payments/links/', { params })).data,
    getPaymentLink: async (linkId) => (await api.get(`/payments/links/${linkId}/`)).data,
    getPaymentLinkAnalytics: async (linkId) => (await api.get(`/payments/links/${linkId}/analytics/`)).data,

    // Payment requests
    getPaymentRequests: async (params = {}) => (await api.get('/payments/requests/', { params })).data,
};
