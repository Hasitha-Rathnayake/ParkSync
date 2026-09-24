package com.parksync.parkinglot;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Long> {
    List<ParkingSlot> findByParkingLotId(Long parkingLotId);
    List<ParkingSlot> findByStatus(ParkingSlot.SlotStatus status);
}
