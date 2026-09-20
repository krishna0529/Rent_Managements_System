package com.Rent_Management.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminVerifyEmailRequest {

    @NotBlank(message = "New Gmail/Email address is required")
    @Email(message = "Please enter a valid Gmail/Email address")
    private String newEmail;

    @NotBlank(message = "6-digit OTP code is required")
    private String otp;
}
