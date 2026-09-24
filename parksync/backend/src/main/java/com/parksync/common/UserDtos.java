package com.parksync.common;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UserDtos {

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {}

    public record ResetPasswordRequest(
            @NotBlank @Size(min = 6, message = "New password must be at least 6 characters") String newPassword
    ) {}
}
