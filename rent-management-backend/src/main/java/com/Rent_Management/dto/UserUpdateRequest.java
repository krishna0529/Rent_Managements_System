package com.Rent_Management.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserUpdateRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Mobile number is required")
    private String mobileNumber;

    @NotBlank(message = "Address is required")
    private String fullAddress;

    @NotBlank(message = "Aadhaar number is required")
    private String aadhaarNumber;

    private String status; // PENDING, APPROVED, REJECTED
    private Boolean active; // true / false
}
