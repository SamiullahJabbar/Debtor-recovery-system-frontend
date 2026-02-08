import api from './api';

export const clientService = {
    getClients: async (params = {}) => (await api.get('/admin/clients/', { params })).data,
    getClient: async (id) => (await api.get(`/admin/clients/${id}/`)).data,
    createClient: async (data) => (await api.post('/admin/clients/', data instanceof FormData ? data : data, { headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {} })).data,
    updateClient: async (id, data) => (await api.put(`/admin/clients/${id}/`, data instanceof FormData ? data : data, { headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {} })).data,
    deleteClient: async (id) => (await api.delete(`/admin/clients/${id}/`)).data,
    bulkImport: async (file) => { const fd = new FormData(); fd.append('csv_file', file); return (await api.post('/admin/clients/bulk-import/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data; },
};
