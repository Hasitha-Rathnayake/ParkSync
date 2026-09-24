package com.parksync.reservation;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    @Autowired
    private ReservationService reservationService;

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody Reservation reservation) {
        try {
            return ResponseEntity.ok(reservationService.createReservation(reservation));
        } catch (IllegalStateException e) {
            // e.g. buffer/overlap conflict - return 409 Conflict with a clear message
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public List<Reservation> getByUser(@PathVariable Long userId) {
        return reservationService.getReservationsByUser(userId);
    }

    @GetMapping("/lot/{lotId}")
    public List<Reservation> getByLot(@PathVariable Long lotId) {
        return reservationService.getReservationsForLot(lotId);
    }

    @GetMapping("/{id}")
    public Reservation getOne(@PathVariable Long id) {
        return reservationService.getReservation(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
                                     @RequestParam LocalDateTime startTime,
                                     @RequestParam LocalDateTime endTime,
                                     @RequestParam(required = false) Long parkingSlotId) {
        try {
            return ResponseEntity.ok(
                    reservationService.updateReservation(id, startTime, endTime, parkingSlotId));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Reservation cancel(@PathVariable Long id) {
        return reservationService.cancelReservation(id);
    }
}
