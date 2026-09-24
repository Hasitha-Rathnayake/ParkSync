import apiClient from './client';

// Member 3 - Vehicle Check-in / Check-out (e-ticket)
export const getEligibleReservations = () => apiClient.get('/tickets/checkin/eligible');
export const checkInByReservation = (reservationId) =>
  apiClient.post(`/tickets/checkin/reservation/${reservationId}`);
export const checkIn = (data) => apiClient.post('/tickets/checkin', data);
export const getActiveTickets = () => apiClient.get('/tickets/active');
export const getTicketHistory = () => apiClient.get('/tickets/history');
export const getTicketsForUser = (userId) => apiClient.get(`/tickets/user/${userId}`);
export const getTicketsForReservation = (reservationId) =>
  apiClient.get(`/tickets/reservation/${reservationId}`);
export const getTicket = (id) => apiClient.get(`/tickets/${id}`);
export const checkOut = (id) => apiClient.put(`/tickets/${id}/checkout`);
export const voidTicket = (id) => apiClient.delete(`/tickets/${id}`);
