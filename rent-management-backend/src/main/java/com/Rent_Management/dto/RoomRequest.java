package com.Rent_Management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomRequest {

    @NotBlank(message = "Room ID is required (e.g. ROOM-402, SHOP-01)")
    private String roomId;

    @NotBlank(message = "Property type is required")
    private String propertyType;

    private Long assignedUserId; // nullable if vacant

    @NotNull(message = "Rent amount is required")
    @PositiveOrZero(message = "Rent amount must be non-negative")
    private Double rentAmount;

    @NotBlank(message = "Meter number is required")
    private String meterNumber;

    @NotNull(message = "Baseline unit is required")
    @PositiveOrZero(message = "Baseline unit must be non-negative")
    private Double baselineUnit;

    private String floorNumber;

    private String status; // VACANT, OCCUPIED, MAINTENANCE
}
