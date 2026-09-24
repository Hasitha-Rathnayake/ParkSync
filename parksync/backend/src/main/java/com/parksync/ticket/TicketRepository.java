package com.parksync.ticket;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByStatus(Ticket.TicketStatus status);
    List<Ticket> findByStatusOrderByExitTimeDesc(Ticket.TicketStatus status);
    Optional<Ticket> findByReservationIdAndStatus(Long reservationId, Ticket.TicketStatus status);
    List<Ticket> findByReservationId(Long reservationId);
    List<Ticket> findByVehiclePlateNumberIgnoreCaseAndStatus(String plate, Ticket.TicketStatus status);
    // Completed tickets whose slot is still held and ready to free
    List<Ticket> findByStatusAndSlotReleaseAtBefore(Ticket.TicketStatus status, LocalDateTime cutoff);
}
