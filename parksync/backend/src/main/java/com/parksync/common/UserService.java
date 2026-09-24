package com.parksync.common;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // CREATE - register a new user (public signup is always CUSTOMER)
    public User register(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalStateException("An account with this email already exists.");
        }
        // Public registration must never create privileged roles
        user.setRole(User.Role.CUSTOMER);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    // READ - login: verify email + password match
    public User login(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }
        return user;
    }

    // READ - get profile
    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
    }

    // CREATE - System Admin creates a staff account (Attendant or Lot Admin).
    // NOTE: this is only reachable from the frontend's Manage Staff page, which
    // is itself only shown to a logged-in System Admin - but as with the rest of
    // this project, that check is UI-side only (no backend session/JWT auth was
    // built in this phase). See README for details.
    public User createStaffAccount(User user) {
        if (user.getRole() != User.Role.ATTENDANT && user.getRole() != User.Role.LOT_ADMIN) {
            throw new IllegalArgumentException("Staff accounts must be either ATTENDANT or LOT_ADMIN.");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalStateException("An account with this email already exists.");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    // READ - list all users with a given role (used by Manage Staff page)
    public java.util.List<User> getUsersByRole(User.Role role) {
        return userRepository.findByRole(role);
    }

    // DELETE - remove a staff account
    public void deleteUser(Long id) {
        User user = getById(id);
        if (user.getRole() == User.Role.SYSTEM_ADMIN) {
            throw new IllegalStateException("System Admin accounts cannot be removed from here.");
        }
        userRepository.deleteById(id);
    }

    // UPDATE - profile update
    public User updateProfile(Long id, String fullName, String phoneNumber) {
        User user = getById(id);
        user.setFullName(fullName);
        user.setPhoneNumber(phoneNumber);
        return userRepository.save(user);
    }

    // UPDATE - password reset
    public User resetPassword(Long id, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters.");
        }
        User user = getById(id);
        user.setPassword(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }
}
