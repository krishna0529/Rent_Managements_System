package com.Rent_Management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentStatusUpdateRequest {

    @NotBlank(message = "Payment status is required (e.g. PENDING, FAILED, PAID)")
    private String status;

    private String reason;
}
