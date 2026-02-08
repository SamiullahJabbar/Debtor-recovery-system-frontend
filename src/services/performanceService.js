import API from './api';

const performanceService = {
    // Get team member performance (Admin)
    getTeamMemberPerformance: async (userId) => {
        const response = await API.get(`/admin/users/${userId}/performance/`);
        return response.data;
    },

    // Get my performance (Team Member)
    getMyPerformance: async () => {
        const response = await API.get('/users/my-performance/');
        return response.data;
    },

    // Get activity logs (Admin)
    getActivityLogs: async (filters = {}) => {
        const response = await API.get('/users/activity-logs/', { params: filters });
        return response.data;
    },

    // Get recent activities (Team Member)
    getRecentActivities: async () => {
        const response = await API.get('/users/recent-activities/');
        return response.data;
    },
};

export default performanceService;
