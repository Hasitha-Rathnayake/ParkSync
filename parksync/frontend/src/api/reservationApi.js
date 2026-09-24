import apiClient from './client';

// Member 1 - Slot Search & Reservation
export const createReservation = (data) => apiClient.post('/reservations', data);
export const getReservationsByUser = (userId) => apiClient.get(`/reservations/user/${userId}`);
export const getReservationsForLot = (lotId) => apiClient.get(`/reservations/lot/${lotId}`);
export const getReservation = (id) => apiClient.get(`/reservations/${id}`);
// parkingSlotId is optional — omit to keep the current slot (time-only edit).
export const updateReservation = (id, startTime, endTime, parkingSlotId = null) =>
  apiClient.put(`/reservations/${id}`, null, {
    params: {
      startTime,
      endTime,
      ...(parkingSlotId != null && parkingSlotId !== '' ? { parkingSlotId } : {}),
    },
  });
export const cancelReservation = (id) => apiClient.delete(`/reservations/${id}`);
