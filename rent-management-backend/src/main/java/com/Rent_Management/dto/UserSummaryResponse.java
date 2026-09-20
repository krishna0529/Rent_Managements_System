package com.Rent_Management.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSummaryResponse {

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
    private String status;
    private boolean active;
    private String assignedRoomCode;
    private Long assignedRoomId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
