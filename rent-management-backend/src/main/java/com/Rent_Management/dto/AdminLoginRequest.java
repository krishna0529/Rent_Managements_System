package com.Rent_Management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminLoginRequest {

    @NotBlank(message = "Admin email/gmail or mobile number is required")
    private String identifier;

    @NotBlank(message = "Password is required")
    private String password;

    @Builder.Default
    private Boolean rememberDevice = false;
}
