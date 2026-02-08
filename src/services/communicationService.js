import api from './api';

export const communicationService = {
    getNotes: async (debtorId) => (await api.get(`/communications/debtors/${debtorId}/notes/`)).data,
    addNote: async (debtorId, data) => (await api.post(`/communications/debtors/${debtorId}/notes/`, data)).data,
    getTemplates: async () => (await api.get('/communications/templates/')).data,
    createTemplate: async (data) => (await api.post('/communications/templates/', data)).data,
    updateTemplate: async (id, data) => (await api.put(`/communications/templates/${id}/`, data)).data,
    deleteTemplate: async (id) => (await api.delete(`/communications/templates/${id}/`)).data,
    previewTemplate: async (id, data) => (await api.post(`/communications/templates/${id}/preview/`, data)).data,
    sendCommunication: async (debtorId, data) => (await api.post(`/communications/debtors/${debtorId}/send/`, data)).data,
    getHistory: async (debtorId) => (await api.get(`/communications/debtors/${debtorId}/history/`)).data,
};
