package com.parksync.ticket;

import com.parksync.common.User;
import com.parksync.common.UserRepository;
import com.parksync.parkinglot.ParkingLot;
import com.parksync.parkinglot.ParkingSlot;
import com.parksync.parkinglot.ParkingSlotRepository;
import com.parksync.payment.Payment;
import com.parksync.payment.PaymentRepository;
import com.parksync.payment.PaymentService;
import com.parksync.reservation.Reservation;
import com.parksync.reservation.ReservationRepository;
import com.parksync.vehicle.Vehicle;
import com.parksync.vehicle.VehicleRepository;
import com.parksync.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Map;

@Service
public class TicketService {

    /** Minutes the slot stays held after check-out before becoming AVAILABLE again. */
    public static final int SLOT_RELEASE_DELAY_MINUTES = 10;

    /** Grace after booked end before overstay is flagged (penalty still uses existing Payment rules). */
    public static final int OVERSTAY_GRACE_MINUTES = 10;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private ParkingSlotRepository parkingSlotRepository;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    /**
     * Preferred path: check in by reservation ID.
     * Validates CONFIRMED status, no duplicate active ticket, uses reserved slot + plate.
     */
    public Ticket checkInByReservation(Long reservationId) {
        Reservation res = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found: " + reservationId));

        if (res.getStatus() == Reservation.ReservationStatus.CANCELLED) {
            throw new IllegalStateException("This reservation was cancelled — cannot check in.");
        }
        if (res.getStatus() == Reservation.ReservationStatus.PENDING_PAYMENT) {
            throw new IllegalStateException("This reservation is not paid yet — customer must complete payment first.");
        }
        if (res.getStatus() != Reservation.ReservationStatus.CONFIRMED
                && res.getStatus() != Reservation.ReservationStatus.COMPLETED) {
            throw new IllegalStateException("Reservation is not valid for check-in (status: " + res.getStatus() + ").");
        }
        if (res.getStatus() == Reservation.ReservationStatus.COMPLETED) {
            throw new IllegalStateException("This reservation already has a completed visit.");
        }

        Optional<Ticket> existingActive = ticketRepository.findByReservationIdAndStatus(
                reservationId, Ticket.TicketStatus.ACTIVE);
        if (existingActive.isPresent()) {
            throw new IllegalStateException("This reservation already has an active ticket (#"
                    + existingActive.get().getId() + ").");
        }

        ParkingSlot slot = res.getParkingSlot();
        if (slot == null) {
            throw new IllegalStateException("Reservation has no parking slot assigned.");
        }
        slot = parkingSlotRepository.findById(slot.getId())
                .orElseThrow(() -> new RuntimeException("Parking slot not found"));

        if (slot.getStatus() == ParkingSlot.SlotStatus.MAINTENANCE) {
            throw new IllegalStateException("The reserved slot is under maintenance — contact the lot admin.");
        }
        if (slot.getStatus() == ParkingSlot.SlotStatus.OCCUPIED) {
            throw new IllegalStateException("The reserved slot is currently occupied — void the other ticket or wait.");
        }

        Vehicle vehicle = vehicleRepository.findById(res.getVehicleId())
                .orElseThrow(() -> new IllegalStateException("Vehicle on this reservation was not found."));

        // Also block if this plate already has any active ticket (other reservation / walk-in)
        boolean plateActive = ticketRepository
                .findByVehiclePlateNumberIgnoreCaseAndStatus(vehicle.getPlateNumber(), Ticket.TicketStatus.ACTIVE)
                .stream().anyMatch(t -> true);
        if (plateActive) {
            throw new IllegalStateException(
                    "Vehicle " + vehicle.getPlateNumber() + " already has an active ticket — check it out first.");
        }

        Ticket ticket = new Ticket();
        ticket.setReservationId(res.getId());
        ticket.setParkingSlotId(slot.getId());
        ticket.setVehiclePlateNumber(vehicle.getPlateNumber());
        ticket.setEntryTime(LocalDateTime.now());
        ticket.setStatus(Ticket.TicketStatus.ACTIVE);

        slot.setStatus(ParkingSlot.SlotStatus.OCCUPIED);
        parkingSlotRepository.save(slot);

        Ticket saved = ticketRepository.save(ticket);
        try {
            notificationService.notifyTicketCreated(res.getUserId(), res.getId(), saved.getId(), vehicle.getPlateNumber());
        } catch (Exception ignored) { }
        return saved;
    }

    /**
     * Walk-in check-in (no reservation). Attendant supplies plate + slot.
     */
    public Ticket checkInWalkIn(Ticket ticket) {
        if (ticket.getVehiclePlateNumber() == null || ticket.getVehiclePlateNumber().isBlank()) {
            throw new IllegalArgumentException("Vehicle plate number is required.");
        }
        if (ticket.getParkingSlotId() == null) {
            throw new IllegalArgumentException("A parking slot must be selected.");
        }

        boolean alreadyActive = !ticketRepository
                .findByVehiclePlateNumberIgnoreCaseAndStatus(
                        ticket.getVehiclePlateNumber().trim(), Ticket.TicketStatus.ACTIVE)
                .isEmpty();
        if (alreadyActive) {
            throw new IllegalStateException(
                    "Vehicle " + ticket.getVehiclePlateNumber() + " already has an active ticket — check it out first.");
        }

        ParkingSlot slot = parkingSlotRepository.findById(ticket.getParkingSlotId())
                .orElseThrow(() -> new RuntimeException("Parking slot not found: " + ticket.getParkingSlotId()));

        if (slot.getStatus() == ParkingSlot.SlotStatus.MAINTENANCE) {
            throw new IllegalStateException("This slot is under maintenance and cannot be checked into.");
        }
        if (slot.getStatus() == ParkingSlot.SlotStatus.OCCUPIED) {
            throw new IllegalStateException("This slot is already occupied.");
        }

        slot.setStatus(ParkingSlot.SlotStatus.OCCUPIED);
        parkingSlotRepository.save(slot);

        ticket.setReservationId(null);
        ticket.setVehiclePlateNumber(ticket.getVehiclePlateNumber().trim());
        ticket.setEntryTime(LocalDateTime.now());
        ticket.setStatus(Ticket.TicketStatus.ACTIVE);
        return ticketRepository.save(ticket);
    }

    /** Legacy body-based check-in: if reservationId set → by reservation; else walk-in. */
    public Ticket checkIn(Ticket ticket) {
        if (ticket.getReservationId() != null) {
            return checkInByReservation(ticket.getReservationId());
        }
        return checkInWalkIn(ticket);
    }

    public List<Ticket> getActiveTickets() {
        return ticketRepository.findByStatus(Ticket.TicketStatus.ACTIVE);
    }

    public List<Ticket> getCompletedHistory() {
        return ticketRepository.findByStatusOrderByExitTimeDesc(Ticket.TicketStatus.COMPLETED);
    }

    public Ticket getTicket(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + id));
    }

    public List<Ticket> getTicketsForReservation(Long reservationId) {
        return ticketRepository.findByReservationId(reservationId);
    }

    /**
     * Check-out: complete ticket, apply existing overstay penalty if late,
     * no refund on early exit, hold slot for SLOT_RELEASE_DELAY_MINUTES then free.
     */
    public Ticket checkOut(Long ticketId) {
        Ticket ticket = getTicket(ticketId);
        if (ticket.getStatus() != Ticket.TicketStatus.ACTIVE) {
            throw new IllegalStateException("This ticket is not active — it may already be checked out or voided.");
        }

        LocalDateTime now = LocalDateTime.now();
        ticket.setExitTime(now);
        ticket.setStatus(Ticket.TicketStatus.COMPLETED);
        // Slot stays OCCUPIED until release time (buffer after exit)
        ticket.setSlotReleaseAt(now.plusMinutes(SLOT_RELEASE_DELAY_MINUTES));

        if (ticket.getReservationId() != null) {
            Optional<Reservation> resOpt = reservationRepository.findById(ticket.getReservationId());
            resOpt.ifPresent(res -> {
                LocalDateTime graceDeadline = res.getEndTime().plusMinutes(OVERSTAY_GRACE_MINUTES);
                if (now.isAfter(graceDeadline)) {
                    ticket.setOverstayed(true);
                    // Existing penalty logic — unchanged
                    try {
                        Optional<Payment> payOpt = paymentRepository.findByReservationId(res.getId());
                        if (payOpt.isPresent() && payOpt.get().getPricingRuleId() != null) {
                            paymentService.applyOverstayPenalty(
                                    res.getId(),
                                    payOpt.get().getPricingRuleId(),
                                    res.getEndTime(),
                                    now
                            );
                        }
                    } catch (Exception ignored) {
                        // Don't block check-out if penalty billing fails; flag is already set
                    }
                }
                // Mark reservation visit complete (early leave keeps paid amount — no refund)
                if (res.getStatus() == Reservation.ReservationStatus.CONFIRMED) {
                    res.setStatus(Reservation.ReservationStatus.COMPLETED);
                    reservationRepository.save(res);
                }
            });
        }

        // Do NOT free the slot immediately — SlotReleaseScheduler does it after delay
        Ticket savedOut = ticketRepository.save(ticket);
        try {
            Long uid = null;
            if (ticket.getReservationId() != null) {
                uid = reservationRepository.findById(ticket.getReservationId()).map(r -> r.getUserId()).orElse(null);
            }
            if (uid != null) {
                notificationService.notifyTicketClosed(uid, ticket.getReservationId(), savedOut.getId(), savedOut.isOverstayed());
            }
        } catch (Exception ignored) { }
        return savedOut;
    }

    /**
     * Void a mistaken / duplicate ticket (attendant only). Frees slot immediately.
     */
    public void voidTicket(Long id) {
        Ticket ticket = getTicket(id);
        if (ticket.getStatus() == Ticket.TicketStatus.COMPLETED) {
            throw new IllegalStateException("Cannot void a completed ticket — it is already in history.");
        }
        ticket.setStatus(Ticket.TicketStatus.VOID);
        ticket.setSlotReleaseAt(null);
        ticketRepository.save(ticket);

        parkingSlotRepository.findById(ticket.getParkingSlotId()).ifPresent(slot -> {
            if (slot.getStatus() == ParkingSlot.SlotStatus.OCCUPIED) {
                slot.setStatus(ParkingSlot.SlotStatus.AVAILABLE);
                parkingSlotRepository.save(slot);
            }
        });
    }

    /** Called by scheduler: free slots whose release time has passed. */
    public int releaseDueSlots() {
        List<Ticket> due = ticketRepository.findByStatusAndSlotReleaseAtBefore(
                Ticket.TicketStatus.COMPLETED, LocalDateTime.now());
        int released = 0;
        for (Ticket t : due) {
            parkingSlotRepository.findById(t.getParkingSlotId()).ifPresent(slot -> {
                if (slot.getStatus() == ParkingSlot.SlotStatus.OCCUPIED) {
                    slot.setStatus(ParkingSlot.SlotStatus.AVAILABLE);
                    parkingSlotRepository.save(slot);
                }
            });
            t.setSlotReleaseAt(null); // clear so we don't re-process
            ticketRepository.save(t);
            released++;
        }
        return released;
    }

    public TicketDetails toDetails(Ticket ticket) {
        TicketDetails d = new TicketDetails();
        d.setTicket(ticket);

        parkingSlotRepository.findById(ticket.getParkingSlotId()).ifPresent(slot -> {
            d.setSlotCode(slot.getSlotCode());
            d.setFloor(slot.getFloor());
            ParkingLot lot = slot.getParkingLot();
            if (lot != null) {
                d.setLotName(lot.getName());
                d.setLotAddress(lot.getAddress());
            }
        });

        if (ticket.getReservationId() != null) {
            reservationRepository.findById(ticket.getReservationId()).ifPresent(res -> {
                d.setBookedStart(res.getStartTime());
                d.setBookedEnd(res.getEndTime());
                d.setUserId(res.getUserId());
                userRepository.findById(res.getUserId()).ifPresent(u -> d.setCustomerName(u.getFullName()));

                paymentRepository.findByReservationId(res.getId()).ifPresent(p -> {
                    d.setAmountPaid(p.getAmount());
                    d.setOverstayPenalty(p.getOverstayPenalty() != null ? p.getOverstayPenalty() : BigDecimal.ZERO);
                    d.setRefundAmount(p.getRefundAmount() != null ? p.getRefundAmount() : BigDecimal.ZERO);
                    d.setPaymentStatus(p.getStatus() != null ? p.getStatus().name() : null);
                });
            });
        }

        if (ticket.getStatus() == Ticket.TicketStatus.COMPLETED) {
            String name = d.getCustomerName() != null ? d.getCustomerName() : "Guest";
            d.setThankYouMessage("Thank you, " + name + ", for parking with ParkSync. Drive safe!");
        } else if (ticket.getStatus() == Ticket.TicketStatus.ACTIVE) {
            d.setThankYouMessage("Welcome — your e-ticket is active. Present this at the lot if asked.");
        }

        return d;
    }

    public List<TicketDetails> toDetailsList(List<Ticket> tickets) {
        List<TicketDetails> list = new ArrayList<>();
        for (Ticket t : tickets) {
            list.add(toDetails(t));
        }
        return list;
    }

    /** E-tickets for a customer (via their reservation IDs). */
    public List<TicketDetails> getDetailsForUser(Long userId) {
        List<Reservation> reservations = reservationRepository.findByUserId(userId);
        List<Ticket> tickets = new ArrayList<>();
        for (Reservation r : reservations) {
            tickets.addAll(ticketRepository.findByReservationId(r.getId()));
        }
        // newest first roughly by id
        tickets.sort((a, b) -> Long.compare(b.getId(), a.getId()));
        return toDetailsList(tickets);
    }

    /**
     * Reservations eligible for check-in: CONFIRMED, not cancelled, no active ticket yet.
     * Used by attendant searchable dropdown (no typing wrong/cancelled IDs).
     */
    public List<Map<String, Object>> listEligibleForCheckIn() {
        List<Reservation> confirmed = reservationRepository.findByStatus(Reservation.ReservationStatus.CONFIRMED);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Reservation res : confirmed) {
            Optional<Ticket> active = ticketRepository.findByReservationIdAndStatus(
                    res.getId(), Ticket.TicketStatus.ACTIVE);
            if (active.isPresent()) continue;

            Map<String, Object> row = new java.util.LinkedHashMap<>();
            row.put("reservationId", res.getId());
            row.put("userId", res.getUserId());
            row.put("startTime", res.getStartTime());
            row.put("endTime", res.getEndTime());

            userRepository.findById(res.getUserId()).ifPresent(u -> {
                row.put("customerName", u.getFullName());
                row.put("customerEmail", u.getEmail());
            });

            vehicleRepository.findById(res.getVehicleId()).ifPresent(v ->
                    row.put("plateNumber", v.getPlateNumber()));

            if (res.getParkingSlot() != null) {
                row.put("slotCode", res.getParkingSlot().getSlotCode());
                row.put("parkingSlotId", res.getParkingSlot().getId());
                if (res.getParkingSlot().getParkingLot() != null) {
                    row.put("lotName", res.getParkingSlot().getParkingLot().getName());
                }
            }
            result.add(row);
        }
        return result;
    }

}
