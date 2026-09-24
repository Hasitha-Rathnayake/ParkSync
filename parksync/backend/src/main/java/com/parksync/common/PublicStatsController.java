package com.parksync.common;

import com.parksync.parkinglot.ParkingLotRepository;
import com.parksync.parkinglot.ParkingSlotRepository;
import com.parksync.reservation.ReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Public, read-only aggregate numbers for the landing page - no auth needed
// since none of this exposes anything sensitive, just totals.
@RestController
@RequestMapping("/api/stats")
public class PublicStatsController {

    @Autowired
    private ParkingLotRepository parkingLotRepository;

    @Autowired
    private ParkingSlotRepository parkingSlotRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/public")
    public PublicStats getPublicStats() {
        return new PublicStats(
                parkingLotRepository.count(),
                parkingSlotRepository.count(),
                reservationRepository.count(),
                userRepository.countByRole(User.Role.CUSTOMER)
        );
    }
}
