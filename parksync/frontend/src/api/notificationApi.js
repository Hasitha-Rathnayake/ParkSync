import apiClient from './client';

// Member 6 - Notifications & Customer Review/Feedback Management
export const sendNotification = (userId, message, type) =>
  apiClient.post('/notifications/send', null, { params: { userId, message, type } });
export const getNotificationHistory = (userId) => apiClient.get(`/notifications/user/${userId}`);
export const markNotificationRead = (id) => apiClient.put(`/notifications/${id}/read`);
export const deleteNotification = (id) => apiClient.delete(`/notifications/${id}`);

export const submitReview = (data) => apiClient.post('/notifications/reviews', data);
export const getEligibleReviewReservations = (userId) =>
  apiClient.get(`/notifications/reviews/eligible/${userId}`);
export const getReviewsForLot = (lotId) => apiClient.get(`/notifications/reviews/lot/${lotId}`);
export const getAverageRating = (lotId) => apiClient.get(`/notifications/reviews/lot/${lotId}/average`);
export const respondToReview = (id, response) =>
  apiClient.put(`/notifications/reviews/${id}/respond`, null, { params: { response } });
export const flagReviewSpam = (id) => apiClient.put(`/notifications/reviews/${id}/flag-spam`);
