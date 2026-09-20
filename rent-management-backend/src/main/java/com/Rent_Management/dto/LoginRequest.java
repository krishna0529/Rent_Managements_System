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
public class LoginRequest {

    @NotBlank(message = "Username or email is required")
    private String identifier;

    @NotBlank(message = "Password is required")
    private String password;

    @Builder.Default
    private Boolean rememberDevice = false;

    public boolean isRememberDevice() {
        return Boolean.TRUE.equals(rememberDevice);
    }
}
