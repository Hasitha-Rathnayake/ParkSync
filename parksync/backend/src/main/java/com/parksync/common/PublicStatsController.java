package com.parksync.common;

import com.parksync.notification.Review;
import com.parksync.notification.ReviewRepository;
import com.parksync.parkinglot.ParkingLotRepository;
import com.parksync.parkinglot.ParkingSlot;
import com.parksync.parkinglot.ParkingSlotRepository;
import com.parksync.reservation.Reservation;
import com.parksync.reservation.ReservationRepository;
import com.parksync.vehicle.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
public class PublicStatsController {

    @Autowired private ParkingLotRepository parkingLotRepository;
    @Autowired private ParkingSlotRepository parkingSlotRepository;
    @Autowired private ReservationRepository reservationRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private VehicleRepository vehicleRepository;
    @Autowired private ReviewRepository reviewRepository;

    @GetMapping("/public")
    public PublicStats getPublicStats() {
        long lots = parkingLotRepository.count();
        long slots = parkingSlotRepository.count();
        List<Reservation> reservations = reservationRepository.findAll();
        long resCount = reservations.size();
        long customers = userRepository.countByRole(User.Role.CUSTOMER);
        long vehicles = vehicleRepository.count();

        // Positive feedback: % of non-spam reviews with rating >= 4
        List<Review> reviews = reviewRepository.findAll().stream()
                .filter(r -> !r.isFlaggedAsSpam())
                .toList();
        double positivePct = 0;
        if (!reviews.isEmpty()) {
            long good = reviews.stream().filter(r -> r.getRating() >= 4).count();
            positivePct = round1(100.0 * good / reviews.size());
        }

        // Average booking length (hours)
        double avgHours = 0;
        if (!reservations.isEmpty()) {
            double sumHours = 0;
            int n = 0;
            for (Reservation r : reservations) {
                if (r.getStartTime() != null && r.getEndTime() != null
                        && r.getEndTime().isAfter(r.getStartTime())) {
                    sumHours += Duration.between(r.getStartTime(), r.getEndTime()).toMinutes() / 60.0;
                    n++;
                }
            }
            if (n > 0) avgHours = round1(sumHours / n);
        }

        // Most-used slot + share of all reservations
        String topCode = "—";
        double topShare = 0;
        if (!reservations.isEmpty()) {
            Map<Long, Long> counts = new HashMap<>();
            for (Reservation r : reservations) {
                if (r.getParkingSlot() != null && r.getParkingSlot().getId() != null) {
                    Long id = r.getParkingSlot().getId();
                    counts.merge(id, 1L, Long::sum);
                }
            }
            Long topId = null;
            long topN = 0;
            for (Map.Entry<Long, Long> e : counts.entrySet()) {
                if (e.getValue() > topN) {
                    topN = e.getValue();
                    topId = e.getKey();
                }
            }
            if (topId != null) {
                topShare = round1(100.0 * topN / resCount);
                topCode = parkingSlotRepository.findById(topId)
                        .map(ParkingSlot::getSlotCode)
                        .filter(c -> c != null && !c.isBlank())
                        .orElse("Slot #" + topId);
            }
        }

        return new PublicStats(
                lots, slots, resCount, customers, vehicles,
                positivePct, avgHours, topCode, topShare
        );
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
