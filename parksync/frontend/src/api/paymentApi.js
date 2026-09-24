import apiClient from './client';

// Member 4 - Billing & Payment Management
// NOTE: no pricingRuleId here - the rate is resolved automatically on the
// backend from the reservation's parking lot.
export const chargePayment = (reservationId, discountCode, method) =>
  apiClient.post('/payments/charge', null, {
    params: { reservationId, discountCode, method },
  });
export const getPaymentHistory = (userId) => apiClient.get(`/payments/user/${userId}`);
export const getPayment = (id) => apiClient.get(`/payments/${id}`);
export const getPaymentForReservation = (reservationId) =>
  apiClient.get(`/payments/reservation/${reservationId}`);
export const refundPayment = (reservationId) =>
  apiClient.put('/payments/refund', null, { params: { reservationId } });
export const applyOverstayPenalty = (reservationId, pricingRuleId, bookedEndTime, actualExitTime) =>
  apiClient.put('/payments/overstay-penalty', null, {
    params: { reservationId, pricingRuleId, bookedEndTime, actualExitTime },
  });
export const deletePayment = (id) => apiClient.delete(`/payments/${id}`);
