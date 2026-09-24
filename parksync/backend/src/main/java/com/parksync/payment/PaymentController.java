package com.parksync.payment;

import com.parksync.reservation.Reservation;
import com.parksync.reservation.ReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private ReservationRepository reservationRepository;

    // NOTE: no pricingRuleId here - the rate is resolved automatically from
    // the reservation's parking lot. The customer never needs to know it.
    @PostMapping("/charge")
    public Payment charge(@RequestParam Long reservationId,
                           @RequestParam(required = false) String discountCode,
                           @RequestParam Payment.PaymentMethod method) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));
        return paymentService.createPaymentForReservation(reservation, discountCode, method);
    }

    @GetMapping("/user/{userId}")
    public List<Payment> history(@PathVariable Long userId) {
        return paymentService.getPaymentHistory(userId);
    }

    @GetMapping("/{id}")
    public Payment getOne(@PathVariable Long id) {
        return paymentService.getPayment(id);
    }

    // Used by the frontend right after editing/cancelling a reservation, to
    // show the updated amount or refund without the caller needing to guess
    // a payment ID.
    @GetMapping("/reservation/{reservationId}")
    public Optional<Payment> getForReservation(@PathVariable Long reservationId) {
        return paymentService.findPaymentForReservation(reservationId);
    }

    @PutMapping("/refund")
    public Payment refund(@RequestParam Long reservationId) {
        return paymentService.refundForCancellation(reservationId);
    }

    @PutMapping("/overstay-penalty")
    public Payment overstayPenalty(@RequestParam Long reservationId, @RequestParam Long pricingRuleId,
                                    @RequestParam LocalDateTime bookedEndTime,
                                    @RequestParam LocalDateTime actualExitTime) {
        return paymentService.applyOverstayPenalty(reservationId, pricingRuleId, bookedEndTime, actualExitTime);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        paymentService.deletePayment(id);
    }
}
