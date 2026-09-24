package com.parksync.common;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

// Seeds one demo account for each privileged role (Attendant, Lot Admin,
// System Admin) the first time the app starts, since these roles should
// NOT be self-registerable through the public sign-up form - only
// CUSTOMER accounts are. In a production system, admin/attendant accounts
// would instead be created by an existing admin through a protected
// "manage staff" screen, but that was out of scope for this phase.
@Component
public class AdminAccountSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String DEMO_PASSWORD = "ParkSync123";

    @Override
    public void run(String... args) {
        seedIfMissing("attendant@parksync.demo", "Demo Attendant", User.Role.ATTENDANT);
        seedIfMissing("lotadmin@parksync.demo", "Demo Lot Admin", User.Role.LOT_ADMIN);
        seedIfMissing("sysadmin@parksync.demo", "Demo System Admin", User.Role.SYSTEM_ADMIN);

        System.out.println("========================================================");
        System.out.println(" ParkSync demo accounts (password for all: " + DEMO_PASSWORD + ")");
        System.out.println("   Attendant:    attendant@parksync.demo");
        System.out.println("   Lot Admin:    lotadmin@parksync.demo");
        System.out.println("   System Admin: sysadmin@parksync.demo");
        System.out.println(" Customers register normally through the app.");
        System.out.println("========================================================");
    }

    private void seedIfMissing(String email, String fullName, User.Role role) {
        if (userRepository.existsByEmail(email)) return;

        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(DEMO_PASSWORD));
        user.setRole(role);
        userRepository.save(user);
    }
}
