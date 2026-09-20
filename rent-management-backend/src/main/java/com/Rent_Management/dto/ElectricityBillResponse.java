package com.Rent_Management.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ElectricityBillResponse {

    private Long id;
    private Long roomId;
    private String roomCode;
    private String propertyType;
    private Long userId;
    private String userName;
    private String userMobile;
    private String billingMonth;
    private Double previousUnit;
    private Double currentUnit;
    private Double unitsConsumed;
    private Double ratePerUnit;
    private Double totalAmount;
    private String status;
    private LocalDate billDate;
    private LocalDate dueDate;
    private LocalDateTime createdAt;
}
