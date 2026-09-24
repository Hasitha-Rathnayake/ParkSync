package com.parksync.ticket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    @Autowired
    private TicketService ticketService;

    /** Check-in by reservation ID (preferred professional path). */
    
    /** Confirmed reservations that do not yet have an active ticket — for attendant picker. */
    @GetMapping("/checkin/eligible")
    public List<Map<String, Object>> eligibleForCheckIn() {
        return ticketService.listEligibleForCheckIn();
    }

    @PostMapping("/checkin/reservation/{reservationId}")
    public ResponseEntity<?> checkInByReservation(@PathVariable Long reservationId) {
        try {
            Ticket ticket = ticketService.checkInByReservation(reservationId);
            return ResponseEntity.ok(ticketService.toDetails(ticket));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    /** Walk-in or body with reservationId (legacy-compatible). */
    @PostMapping("/checkin")
    public ResponseEntity<?> checkIn(@Valid @RequestBody Ticket ticket) {
        try {
            Ticket saved = ticketService.checkIn(ticket);
            return ResponseEntity.ok(ticketService.toDetails(saved));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @GetMapping("/active")
    public List<TicketDetails> getActive() {
        return ticketService.toDetailsList(ticketService.getActiveTickets());
    }

    /** Completed visits history (attendant / admin). */
    @GetMapping("/history")
    public List<TicketDetails> history() {
        return ticketService.toDetailsList(ticketService.getCompletedHistory());
    }

    /** Customer e-tickets (view only). */
    @GetMapping("/user/{userId}")
    public List<TicketDetails> forUser(@PathVariable Long userId) {
        return ticketService.getDetailsForUser(userId);
    }

    @GetMapping("/reservation/{reservationId}")
    public List<TicketDetails> forReservation(@PathVariable Long reservationId) {
        return ticketService.toDetailsList(ticketService.getTicketsForReservation(reservationId));
    }

    @GetMapping("/{id}")
    public TicketDetails getOne(@PathVariable Long id) {
        return ticketService.toDetails(ticketService.getTicket(id));
    }

    @PutMapping("/{id}/checkout")
    public ResponseEntity<?> checkOut(@PathVariable Long id) {
        try {
            Ticket ticket = ticketService.checkOut(id);
            return ResponseEntity.ok(ticketService.toDetails(ticket));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    /** Attendant voids a false / duplicate active ticket. */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> voidTicket(@PathVariable Long id) {
        try {
            ticketService.voidTicket(id);
            return ResponseEntity.ok(Map.of("message", "Ticket voided and slot freed."));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }
}
