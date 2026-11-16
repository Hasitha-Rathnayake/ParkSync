import apiClient from './client';

export const createPackage = (data) => apiClient.post('/packages', data);
export const updatePackage = (id, data) => apiClient.put(`/packages/${id}`, data);
export const getPackagesForLot = (lotId, activeOnly = false) =>
  apiClient.get(`/packages/lot/${lotId}`, { params: { activeOnly } });
export const getActivePackages = (lotId, date) =>
  apiClient.get(`/packages/lot/${lotId}/active`, { params: date ? { date } : {} });
/** Valid on a date (default today) — discount apply */
export const getAllActivePackages = (date) =>
  apiClient.get('/packages/active', { params: date ? { date } : {} });
/** Offers tab: all active packages (current + upcoming) */
export const getAllAvailablePackages = () =>
  apiClient.get('/packages/available');
export const uploadPackageImage = (id, file) => {
  const form = new FormData();
  form.append('file', file);
  return apiClient.post(`/packages/${id}/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const deactivatePackage = (id) => apiClient.delete(`/packages/${id}`);
