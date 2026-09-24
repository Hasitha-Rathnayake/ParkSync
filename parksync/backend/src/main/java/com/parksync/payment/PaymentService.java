package com.parksync.payment;

import com.parksync.pricing.PricingRule;
import com.parksync.pricing.PricingRuleRepository;
import com.parksync.reservation.Reservation;
import com.parksync.reservation.ReservationRepository;
import com.parksync.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private PricingRuleRepository pricingRuleRepository;

    @Autowired
    private NotificationService notificationService;

    // Helper: pick the right rate (peak vs base) for a given rule + start time
    private BigDecimal resolveHourlyRate(PricingRule rule, LocalDateTime start) {
        int hour = start.getHour();
        boolean isPeak = hour >= rule.getPeakStartHour() && hour < rule.getPeakEndHour();
        return isPeak ? rule.getPeakRatePerHour() : rule.getBaseRatePerHour();
    }

    // Shared calculation used both at initial charge and at edit-recalculation,
    // so the two never drift out of sync with each other.
    private BigDecimal calculateAmount(PricingRule rule, LocalDateTime start, LocalDateTime end, String discountCode) {
        long minutes = ChronoUnit.MINUTES.between(start, end);
        BigDecimal hours = BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 4, RoundingMode.HALF_UP);

        BigDecimal rate = resolveHourlyRate(rule, start);
        BigDecimal amount = rate.multiply(hours);

        if (discountCode != null && discountCode.equalsIgnoreCase(rule.getDiscountCode())
                && rule.getDiscountPercentage() != null) {
            BigDecimal discount = amount.multiply(rule.getDiscountPercentage())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            amount = amount.subtract(discount);
        }

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            amount = BigDecimal.valueOf(0.01); // minimum nominal charge, avoids Rs. 0 / negative invoices
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    // CREATE - charge at booking time (NOT at checkout), using estimated duration.
    // Only allowed while the reservation is still PENDING_PAYMENT (within its
    // 15-minute window) - flips it to CONFIRMED once the charge succeeds.
    // NOTE: the pricing rule is resolved automatically from the reservation's
    // parking lot - the customer never sees or supplies a "Pricing Rule ID".
    public Payment createPaymentForReservation(Reservation reservation, String discountCode, Payment.PaymentMethod method) {
        if (reservation.getStatus() != Reservation.ReservationStatus.PENDING_PAYMENT) {
            throw new IllegalStateException(
                    "This reservation is no longer awaiting payment - it may have already been paid, "
                    + "or the 15-minute payment window expired and it was released.");
        }
        if (paymentRepository.findByReservationId(reservation.getId()).isPresent()) {
            throw new IllegalStateException("A payment already exists for this reservation.");
        }
        if (method == null) {
            throw new IllegalArgumentException("A payment method must be selected.");
        }

        Long lotId = reservation.getParkingSlot().getParkingLot().getId();
        List<PricingRule> activeRules = pricingRuleRepository.findByParkingLotIdAndActiveTrue(lotId);
        if (activeRules.isEmpty()) {
            throw new IllegalStateException(
                    "This parking lot doesn't have pricing set up yet - please contact the admin.");
        }
        PricingRule rule = activeRules.get(0); // one active rule per lot, for now

        BigDecimal amount = calculateAmount(rule, reservation.getStartTime(), reservation.getEndTime(), discountCode);

        Payment payment = new Payment();
        payment.setReservationId(reservation.getId());
        payment.setUserId(reservation.getUserId());
        payment.setPricingRuleId(rule.getId());
        payment.setDiscountCodeUsed(discountCode);
        payment.setAmount(amount);
        payment.setMethod(method); // simulated - just recorded, no real transaction
        payment.setStatus(Payment.PaymentStatus.PAID);
        payment.setPaidAt(LocalDateTime.now());

        Payment saved = paymentRepository.save(payment);

        // payment succeeded - the reservation is now genuinely confirmed
        reservation.setStatus(Reservation.ReservationStatus.CONFIRMED);
        reservationRepository.save(reservation);

        try {
            notificationService.notifyBookingConfirmed(reservation);
        } catch (Exception ignored) { }

        return saved;
    }

    // READ - a user's payment history
    public List<Payment> getPaymentHistory(Long userId) {
        return paymentRepository.findByUserId(userId);
    }

    // READ - one payment
    public Payment getPayment(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + id));
    }

    // READ - the payment for a reservation, if one exists yet (used by the
    // frontend right after an edit/cancel to show the updated amount/refund)
    public Optional<Payment> findPaymentForReservation(Long reservationId) {
        return paymentRepository.findByReservationId(reservationId);
    }

    // UPDATE - recalculate the charge when a PAID reservation's time (and
    // optionally slot/lot) changes. If newLotId is provided, switch to that
    // lot's active pricing rule so a "Change Slot" into another lot picks up
    // the correct rates. Called by ReservationService.updateReservation.
    public Payment recalculateForEdit(Long reservationId, LocalDateTime newStart, LocalDateTime newEnd) {
        return recalculateForEdit(reservationId, newStart, newEnd, null);
    }

    public Payment recalculateForEdit(Long reservationId, LocalDateTime newStart, LocalDateTime newEnd, Long newLotId) {
        Optional<Payment> paymentOpt = paymentRepository.findByReservationId(reservationId);
        if (paymentOpt.isEmpty()) return null; // not paid yet - nothing to recalculate

        Payment payment = paymentOpt.get();
        if (payment.getStatus() != Payment.PaymentStatus.PAID) return payment; // refunded/void - leave alone

        PricingRule rule;
        if (newLotId != null) {
            List<PricingRule> activeRules = pricingRuleRepository.findByParkingLotIdAndActiveTrue(newLotId);
            if (activeRules.isEmpty()) {
                throw new IllegalStateException(
                        "The new parking lot doesn't have pricing set up yet - cannot change to that lot.");
            }
            rule = activeRules.get(0);
            payment.setPricingRuleId(rule.getId());
        } else {
            rule = pricingRuleRepository.findById(payment.getPricingRuleId())
                    .orElseThrow(() -> new RuntimeException("Pricing rule not found"));
        }

        BigDecimal newAmount = calculateAmount(rule, newStart, newEnd, payment.getDiscountCodeUsed());
        payment.setAmount(newAmount);
        return paymentRepository.save(payment);
    }

    // UPDATE - process refund on cancellation, with tiered fee. Uses the
    // pricing rule already stored on the payment - no need to pass it in.
    public Payment refundForCancellation(Long reservationId) {
        Payment payment = paymentRepository.findByReservationId(reservationId)
                .orElseThrow(() -> new RuntimeException("Payment not found for reservation " + reservationId));
        if (payment.getStatus() == Payment.PaymentStatus.REFUNDED) {
            throw new IllegalStateException("This payment has already been refunded.");
        }
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found: " + reservationId));
        PricingRule rule = pricingRuleRepository.findById(payment.getPricingRuleId())
                .orElseThrow(() -> new RuntimeException("Pricing rule not found"));

        long minutesBeforeStart = ChronoUnit.MINUTES.between(LocalDateTime.now(), reservation.getStartTime());
        int freeWindow = rule.getFreeCancellationWindowMinutes();
        BigDecimal feePct = rule.getCancellationFeePercentage() != null
                ? rule.getCancellationFeePercentage()
                : BigDecimal.ZERO;

        // freeWindow <= 0 means NO free cancellation — always apply fee (if fee > 0).
        // freeWindow > 0 means full refund only when cancelling at least that many minutes before start.
        boolean qualifiesForFreeCancel = freeWindow > 0 && minutesBeforeStart >= freeWindow;

        BigDecimal refund;
        if (qualifiesForFreeCancel || feePct.compareTo(BigDecimal.ZERO) <= 0) {
            refund = payment.getAmount(); // full refund
        } else {
            BigDecimal fee = payment.getAmount().multiply(feePct)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            refund = payment.getAmount().subtract(fee);
            if (refund.compareTo(BigDecimal.ZERO) < 0) {
                refund = BigDecimal.ZERO;
            }
        }

        payment.setRefundAmount(refund.setScale(2, RoundingMode.HALF_UP));
        payment.setStatus(Payment.PaymentStatus.REFUNDED);
        return paymentRepository.save(payment);
    }

    // UPDATE - bill an overstay penalty for late checkout
    public Payment applyOverstayPenalty(Long reservationId, Long pricingRuleId,
                                         LocalDateTime bookedEndTime, LocalDateTime actualExitTime) {
        Payment payment = paymentRepository.findByReservationId(reservationId)
                .orElseThrow(() -> new RuntimeException("Payment not found for reservation " + reservationId));
        PricingRule rule = pricingRuleRepository.findById(pricingRuleId)
                .orElseThrow(() -> new RuntimeException("Pricing rule not found"));

        long overstayMinutes = ChronoUnit.MINUTES.between(bookedEndTime, actualExitTime);
        if (overstayMinutes <= 0) return payment; // no overstay, nothing to charge

        BigDecimal overstayHours = BigDecimal.valueOf(overstayMinutes)
                .divide(BigDecimal.valueOf(60), 4, RoundingMode.HALF_UP);
        BigDecimal penalty = rule.getBaseRatePerHour()
                .multiply(rule.getOverstayMultiplier())
                .multiply(overstayHours);

        payment.setOverstayPenalty(penalty.setScale(2, RoundingMode.HALF_UP));
        return paymentRepository.save(payment);
    }

    // DELETE - void a duplicate/incorrect invoice
    public void deletePayment(Long id) {
        paymentRepository.deleteById(id);
    }
}
