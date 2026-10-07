package com.parksync.common;

/**
 * GET /api/stats/public — landing page live numbers.
 */
public record PublicStats(
        long totalLots,
        long totalSlots,
        long totalReservations,
        long totalCustomers,
        long totalVehicles,
        /** Share of reviews with rating >= 4 (0–100). 0 if no reviews. */
        double positiveFeedbackPercent,
        /** Average booking duration in hours. 0 if no reservations. */
        double avgBookingHours,
        /** Slot code of the most-booked slot, or "—" */
        String mostUsedSlotCode,
        /** That slot's bookings as % of all reservations (0–100). */
        double mostUsedSlotSharePercent
) {}
