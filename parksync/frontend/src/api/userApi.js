import apiClient from './client';

// Minor function - Registration, Login, Profile, Password Reset
export const register = (data) => apiClient.post('/users/register', data);
export const login = (email, password) => apiClient.post('/users/login', { email, password });
export const getProfile = (id) => apiClient.get(`/users/${id}`);
export const updateProfile = (id, fullName, phoneNumber) =>
  apiClient.put(`/users/${id}`, null, { params: { fullName, phoneNumber } });
export const resetPassword = (id, newPassword) =>
  apiClient.put(`/users/${id}/reset-password`, { newPassword });

// System Admin - Manage Staff
export const createStaffAccount = (data) => apiClient.post('/users/staff', data);
export const getUsersByRole = (role) => apiClient.get(`/users/role/${role}`);
export const deleteUser = (id) => apiClient.delete(`/users/${id}`);
