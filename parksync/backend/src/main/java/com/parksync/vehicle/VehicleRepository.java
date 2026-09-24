package com.parksync.vehicle;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByUserId(Long userId);
    boolean existsByUserIdAndPlateNumberIgnoreCase(Long userId, String plateNumber);
}
