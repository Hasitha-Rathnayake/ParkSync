import apiClient from './client';

// Member 2 - Parking Lot & Slot Management
export const createLot = (data) => apiClient.post('/lots', data);
export const addSlot = (lotId, data) => apiClient.post(`/lots/${lotId}/slots`, data);
export const getAllLots = () => apiClient.get('/lots');
export const getLot = (id) => apiClient.get(`/lots/${id}`);
export const getSlotsForLot = (lotId) => apiClient.get(`/lots/${lotId}/slots`);
export const getOccupancy = (lotId) => apiClient.get(`/lots/${lotId}/occupancy`);
export const updateLot = (id, data) => apiClient.put(`/lots/${id}`, data);
export const updateSlotStatus = (slotId, status) =>
  apiClient.put(`/lots/slots/${slotId}/status`, null, { params: { status } });
export const deleteLot = (id) => apiClient.delete(`/lots/${id}`);
export const deleteSlot = (slotId) => apiClient.delete(`/lots/slots/${slotId}`);
