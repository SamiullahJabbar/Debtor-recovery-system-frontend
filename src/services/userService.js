import api from './api';

export const userService = {
    getUsers: async (params = {}) => (await api.get('/admin/users/', { params })).data,
    getUser: async (id) => (await api.get(`/admin/users/${id}/`)).data,
    createUser: async (data) => (await api.post('/admin/users/', data)).data,
    updateUser: async (id, data) => (await api.put(`/admin/users/${id}/`, data)).data,
    deleteUser: async (id) => (await api.delete(`/admin/users/${id}/`)).data,
};
