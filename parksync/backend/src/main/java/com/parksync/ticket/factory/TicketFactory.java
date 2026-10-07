package com.parksync.ticket.factory;

import com.parksync.ticket.Ticket;

import java.time.LocalDateTime;

/**
 * Member pattern: FACTORY METHOD (Creational).
 * Creates reservation-based or walk-in tickets without scattering construction logic.
 * Used by: TicketService.checkInByReservation / checkInWalkIn
 */
public final class TicketFactory {

    private TicketFactory() {}

    public static Ticket createForReservation(Long reservationId, String plate, Long slotId) {
        Ticket t = new Ticket();
        t.setReservationId(reservationId);
        t.setVehiclePlateNumber(plate);
        t.setParkingSlotId(slotId);
        t.setEntryTime(LocalDateTime.now());
        t.setStatus(Ticket.TicketStatus.ACTIVE);
        t.setOverstayed(false);
        return t;
    }

    public static Ticket createWalkIn(String plate, Long slotId) {
        Ticket t = new Ticket();
        t.setReservationId(null);
        t.setVehiclePlateNumber(plate);
        t.setParkingSlotId(slotId);
        t.setEntryTime(LocalDateTime.now());
        t.setStatus(Ticket.TicketStatus.ACTIVE);
        t.setOverstayed(false);
        return t;
    }
}
