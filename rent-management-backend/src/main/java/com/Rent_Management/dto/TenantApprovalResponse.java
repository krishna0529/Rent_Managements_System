package com.Rent_Management.dto;

import com.Rent_Management.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantApprovalResponse {

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
    private UserStatus status;
    private boolean isActive;
    private String roomUnit;
    private Long roomId;
    private String propertyType;
    private Double monthlyRent;
    private Double depositAmount;
    private String meterNumber;
    private Double baselineUnit;
    private String floorNumber;
    private String occupation;
    private String emergencyContact;
    private String emergencyContactName;
    private String rejectionReason;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
