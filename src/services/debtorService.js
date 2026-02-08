import api from './api';

const toFormData = (data) => {
    if (data instanceof FormData) return data;
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') fd.append(k, v); });
    return fd;
};

export const debtorService = {
    getDebtors: async (params = {}) => (await api.get('/admin/debtors/', { params })).data,
    getDebtor: async (id) => (await api.get(`/admin/debtors/${id}/`)).data,
    createDebtor: async (data) => (await api.post('/admin/debtors/', data instanceof FormData ? data : toFormData(data), { headers: { 'Content-Type': 'multipart/form-data' } })).data,
    updateDebtor: async (id, data) => (await api.put(`/admin/debtors/${id}/`, data instanceof FormData ? data : toFormData(data), { headers: { 'Content-Type': 'multipart/form-data' } })).data,
    deleteDebtor: async (id) => (await api.delete(`/admin/debtors/${id}/`)).data,
    setPaymentArrangement: async (id, data) => (await api.post(`/admin/debtors/${id}/payment-arrangement/`, data)).data,
    deactivateDebtor: async (id) => (await api.post(`/admin/debtors/${id}/deactivate/`)).data,
    bulkImport: async (file) => { const fd = new FormData(); fd.append('csv_file', file); return (await api.post('/admin/debtors/bulk-import/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data; },

    // Global debtor management (Team Member)
    getGlobalDebtors: async (params = {}) => (await api.get('/admin/debtors/global/', { params })).data,
    assignToMe: async (debtorId) => (await api.post(`/admin/debtors/${debtorId}/assign-to-me/`)).data,
    getMyAssignedDebtors: async (params = {}) => (await api.get('/admin/debtors/my-assigned/', { params })).data,
};

