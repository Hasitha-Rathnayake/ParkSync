package com.parksync.parkinglot;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "parking_slots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ParkingSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Slot code is required (e.g. 'B-14')")
    @Size(max = 20, message = "Slot code must be under 20 characters")
    private String slotCode;

    @Size(max = 20, message = "Floor must be under 20 characters")
    private String floor;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private SlotStatus status = SlotStatus.AVAILABLE;

    // JsonIgnore breaks a circular reference: ParkingLot has a list of
    // ParkingSlot, and each ParkingSlot pointed back to its ParkingLot,
    // which pointed back to the full slot list again - infinitely. This was
    // crashing every endpoint that returned a Reservation (which embeds a
    // ParkingSlot), including Reservation Oversight lookups. The frontend
    // never needed slot.parkingLot directly anyway - it always already
    // knows which lot it's looking at from context.
    @ManyToOne
    @JoinColumn(name = "parking_lot_id")
    @JsonIgnore
    private ParkingLot parkingLot;

    public enum SlotStatus {
        AVAILABLE, OCCUPIED, MAINTENANCE
    }
}
