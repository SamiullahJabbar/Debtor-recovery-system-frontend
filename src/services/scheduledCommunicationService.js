import API from './api';

const scheduledCommunicationService = {
    // Get all scheduled communications (Admin)
    getScheduledCommunications: async (params = {}) => {
        const response = await API.get('/communications/scheduled/', { params });
        return response.data;
    },

    // Get single scheduled communication
    getScheduledCommunication: async (id) => {
        const response = await API.get(`/communications/scheduled/${id}/`);
        return response.data;
    },

    // Create scheduled communication
    createScheduledCommunication: async (data) => {
        const response = await API.post('/communications/scheduled/', data);
        return response.data;
    },

    // Update scheduled communication
    updateScheduledCommunication: async (id, data) => {
        const response = await API.put(`/communications/scheduled/${id}/`, data);
        return response.data;
    },

    // Delete/Cancel scheduled communication
    deleteScheduledCommunication: async (id) => {
        const response = await API.delete(`/communications/scheduled/${id}/`);
        return response.data;
    },

    // Send now
    sendNow: async (id) => {
        const response = await API.post(`/communications/scheduled/${id}/send_now/`);
        return response.data;
    },

    // Toggle recurring
    toggleRecurring: async (id) => {
        const response = await API.post(`/communications/scheduled/${id}/toggle_recurring/`);
        return response.data;
    },
};

export default scheduledCommunicationService;
