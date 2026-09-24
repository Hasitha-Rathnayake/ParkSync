import apiClient from './client';

// Public, no-auth-needed live counts for the landing page
export const getPublicStats = () => apiClient.get('/stats/public');
