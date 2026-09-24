import apiClient from './client';

// Member 5 - Dynamic Pricing & Discount Management
export const createPricingRule = (data) => apiClient.post('/pricing', data);
export const getRulesForLot = (lotId) => apiClient.get(`/pricing/lot/${lotId}`);
export const getPricingRule = (id) => apiClient.get(`/pricing/${id}`);
export const updatePricingRule = (id, data) => apiClient.put(`/pricing/${id}`, data);
export const deactivatePricingRule = (id) => apiClient.delete(`/pricing/${id}`);
