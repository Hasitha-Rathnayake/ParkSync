package com.parksync.common;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public User register(@Valid @RequestBody User user) {
        return userService.register(user);
    }

    @PostMapping("/staff")
    public User createStaff(@Valid @RequestBody User user) {
        return userService.createStaffAccount(user);
    }

    @GetMapping("/role/{role}")
    public java.util.List<User> getByRole(@PathVariable User.Role role) {
        return userService.getUsersByRole(role);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    @PostMapping("/login")
    public User login(@Valid @RequestBody UserDtos.LoginRequest request) {
        return userService.login(request.email(), request.password());
    }

    @GetMapping("/{id}")
    public User getProfile(@PathVariable Long id) {
        return userService.getById(id);
    }

    @PutMapping("/{id}")
    public User updateProfile(@PathVariable Long id, @RequestParam String fullName,
                               @RequestParam String phoneNumber) {
        return userService.updateProfile(id, fullName, phoneNumber);
    }

    @PutMapping("/{id}/reset-password")
    public User resetPassword(@PathVariable Long id, @Valid @RequestBody UserDtos.ResetPasswordRequest request) {
        return userService.resetPassword(id, request.newPassword());
    }
}
