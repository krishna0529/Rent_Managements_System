package com.Rent_Management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ElectricityBillRequest {

    @NotNull(message = "Room is required")
    private Long roomId;

    private Long userId; // optional, can be auto-assigned from room occupant

    @NotBlank(message = "Billing month is required")
    private String billingMonth; // e.g. "October 2024"

    @NotNull(message = "Previous unit is required")
    @PositiveOrZero(message = "Previous unit must be non-negative")
    private Double previousUnit;

    @NotNull(message = "Current unit is required")
    @PositiveOrZero(message = "Current unit must be non-negative")
    private Double currentUnit;

    @Builder.Default
    private Double ratePerUnit = 6.0;

    private LocalDate billDate;
    private LocalDate dueDate;
}
