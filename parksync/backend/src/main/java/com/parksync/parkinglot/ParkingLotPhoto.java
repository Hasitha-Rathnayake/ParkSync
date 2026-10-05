package com.parksync.parkinglot;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "parking_lot_photos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ParkingLotPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Relative path under uploads/, e.g. lots/3_2.jpg */
    @Column(nullable = false, length = 255)
    private String filePath;

    private int sortOrder = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parking_lot_id", nullable = false)
    @JsonIgnore
    private ParkingLot parkingLot;
}
