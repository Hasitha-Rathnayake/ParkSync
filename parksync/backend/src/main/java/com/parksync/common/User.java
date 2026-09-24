package com.parksync.common;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must be under 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid address")
    @Column(unique = true, nullable = false)
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password; // stored hashed via BCrypt - see UserService

    @Pattern(regexp = "^[0-9+\\-\\s]{7,15}$", message = "Enter a valid phone number (7-15 digits)")
    private String phoneNumber;

    // Role is required for staff creation; public registration forces CUSTOMER in service layer
    @NotNull(message = "Role is required")
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private Role role = Role.CUSTOMER;

    public enum Role {
        CUSTOMER, ATTENDANT, LOT_ADMIN, SYSTEM_ADMIN
    }
}
