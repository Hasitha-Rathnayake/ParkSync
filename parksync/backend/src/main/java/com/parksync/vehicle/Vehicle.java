package com.parksync.vehicle;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "vehicles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "User ID is required")
    private Long userId; // owner - the customer this vehicle belongs to

    @NotBlank(message = "Plate number is required")
    @Size(min = 2, max = 20, message = "Plate number must be between 2 and 20 characters")
    private String plateNumber;

    @Size(max = 50, message = "Make must be under 50 characters")
    private String make;   // e.g. "Toyota" - optional

    @Size(max = 50, message = "Model must be under 50 characters")
    private String model;  // e.g. "Aqua" - optional

    @Size(max = 30, message = "Color must be under 30 characters")
    private String color;  // optional

    @NotNull(message = "Vehicle type is required")
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private VehicleType type = VehicleType.CAR;

    public enum VehicleType {
        CAR, VAN, MOTORCYCLE, SUV, OTHER
    }
}
