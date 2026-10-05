package com.parksync.pricing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface SpecialPackageRepository extends JpaRepository<SpecialPackage, Long> {
    List<SpecialPackage> findByParkingLotIdAndActiveTrueOrderByStartDateDesc(Long parkingLotId);
    List<SpecialPackage> findByParkingLotIdOrderByStartDateDesc(Long parkingLotId);

    @Query("""
        SELECT p FROM SpecialPackage p
        WHERE p.parkingLotId = :lotId AND p.active = true
          AND p.startDate <= :day AND p.endDate >= :day
        ORDER BY p.discountPercentage DESC
        """)
    List<SpecialPackage> findActiveForLotOnDate(@Param("lotId") Long lotId, @Param("day") LocalDate day);

    /** All active packages across every lot on a given day (dashboard strip). */
    @Query("""
        SELECT p FROM SpecialPackage p
        WHERE p.active = true
          AND p.startDate <= :day AND p.endDate >= :day
        ORDER BY p.discountPercentage DESC, p.name ASC
        """)
    List<SpecialPackage> findAllActiveOnDate(@Param("day") LocalDate day);
}
