package com.parksync.parkinglot;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ParkingLotPhotoRepository extends JpaRepository<ParkingLotPhoto, Long> {
    List<ParkingLotPhoto> findByParkingLotIdOrderBySortOrderAscIdAsc(Long parkingLotId);
    long countByParkingLotId(Long parkingLotId);
}
