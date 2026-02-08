import api from './api';

export const reportService = {
    getDashboardStats: async () => (await api.get('/reports/dashboard/')).data,
    getClientReport: async () => (await api.get('/reports/clients/')).data,
    getTeamPerformance: async () => (await api.get('/reports/team-performance/')).data,
    getTeamMemberDetail: async (userId) => (await api.get(`/reports/team-member/${userId}/`)).data,
    getPaymentReport: async (params = {}) => (await api.get('/reports/payments/', { params })).data,
    getAuditLogs: async (params = {}) => (await api.get('/reports/audit-logs/', { params })).data,
    getActivityLogs: async (params = {}) => (await api.get('/reports/activity-logs/', { params })).data,
};
