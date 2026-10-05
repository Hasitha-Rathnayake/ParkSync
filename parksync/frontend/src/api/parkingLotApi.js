import apiClient from './client';

export const createLot = (data) => apiClient.post('/lots', data);
export const addSlot = (lotId, data) => apiClient.post(`/lots/${lotId}/slots`, data);
export const addSlotsBatch = (lotId, count, floor) =>
  apiClient.post(`/lots/${lotId}/slots/batch`, null, {
    params: { count, ...(floor ? { floor } : {}) },
  });
export const getAllLots = () => apiClient.get('/lots');
export const getLot = (id) => apiClient.get(`/lots/${id}`);
export const getSlotsForLot = (lotId) => apiClient.get(`/lots/${lotId}/slots`);
export const getOccupancy = (lotId) => apiClient.get(`/lots/${lotId}/occupancy`);
export const updateLot = (id, data) => apiClient.put(`/lots/${id}`, data);
export const updateSlotStatus = (slotId, status) =>
  apiClient.put(`/lots/slots/${slotId}/status`, null, { params: { status } });
export const deleteLot = (id) => apiClient.delete(`/lots/${id}`);
export const deleteSlot = (slotId) => apiClient.delete(`/lots/slots/${slotId}`);

export const uploadLotPhoto = (lotId, file) => {
  const form = new FormData();
  form.append('file', file);
  return apiClient.post(`/lots/${lotId}/photo`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const deleteLotPhoto = (lotId) => apiClient.delete(`/lots/${lotId}/photo`);

export const getLotPhotos = (lotId) => apiClient.get(`/lots/${lotId}/photos`);
export const addLotPhoto = (lotId, file) => {
  const form = new FormData();
  form.append('file', file);
  return apiClient.post(`/lots/${lotId}/photos`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const deleteLotPhotoById = (photoId) => apiClient.delete(`/lots/photos/${photoId}`);
