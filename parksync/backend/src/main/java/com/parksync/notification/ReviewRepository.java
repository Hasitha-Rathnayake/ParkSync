package com.parksync.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByParkingLotId(Long parkingLotId);
    List<Review> findByParkingLotIdOrderByCreatedAtDesc(Long parkingLotId);
    Optional<Review> findByReservationId(Long reservationId);
    boolean existsByReservationId(Long reservationId);
}
