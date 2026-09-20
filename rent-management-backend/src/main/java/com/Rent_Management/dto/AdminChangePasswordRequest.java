package com.Rent_Management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminChangePasswordRequest {

    @NotBlank(message = "Current administrative password is required")
    private String currentPassword;

    @NotBlank(message = "New password is required")
    private String newPassword;
}
