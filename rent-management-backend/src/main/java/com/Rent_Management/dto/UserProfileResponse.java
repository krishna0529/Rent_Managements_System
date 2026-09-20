package com.Rent_Management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {

    private Long id;
    private String fullName;
    private String username;
    private String email;
    private String mobileNumber;
    private String fullAddress;
    private String aadhaarNumber;
    private String aadhaarDocumentPath;
    private String profileImagePath;
    private LocalDate dateOfJoining;
    private LocalDate nextDueDate;
    private String role;
    private boolean isActive;
}
