package com.Rent_Management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminProfileResponse {

    private Long id;
    private String fullName;
    private String mobileNumber;
    private String gmail;
    private String profileImagePath;
    private String role;
    private boolean active;
    private LocalDateTime createdAt;
}
