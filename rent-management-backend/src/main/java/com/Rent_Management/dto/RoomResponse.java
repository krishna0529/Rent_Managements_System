package com.Rent_Management.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomResponse {

    private Long id;
    private String roomId;
    private String propertyType;
    private Long assignedUserId;
    private String assignedUserName;
    private String assignedUserMobile;
    private String assignedUserAadhaar;
    private Double rentAmount;
    private Double depositAmount;
    private String meterNumber;
    private Double baselineUnit;
    private String floorNumber;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
