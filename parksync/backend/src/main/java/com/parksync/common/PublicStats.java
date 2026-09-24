package com.parksync.common;

// Plain response shape for GET /api/stats/public - powers the live numbers
// shown on the landing page (Total Lots, Total Slots, etc.)
public record PublicStats(
        long totalLots,
        long totalSlots,
        long totalReservations,
        long totalCustomers
) {}
