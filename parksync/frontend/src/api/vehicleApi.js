import apiClient from './client';

// A user's saved vehicles (profile feature)
export const addVehicle = (data) => apiClient.post('/vehicles', data);
export const getVehiclesForUser = (userId) => apiClient.get(`/vehicles/user/${userId}`);
export const getVehicle = (id) => apiClient.get(`/vehicles/${id}`);
export const updateVehicle = (id, data) => apiClient.put(`/vehicles/${id}`, data);
export const deleteVehicle = (id) => apiClient.delete(`/vehicles/${id}`);
